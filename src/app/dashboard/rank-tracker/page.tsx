"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  Settings2,
  Trash2,
  TrendingUp,
} from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { DataForSeoBanner } from "@/components/dashboard/ProjectDomainBanner";
import {
  AddTrackedDomainModal,
  type AddTrackedDomainInput,
} from "@/components/dashboard/rank-tracking/AddTrackedDomainModal";
import {
  ChooseKeywordsModal,
  type DiscoverKeywordRow,
} from "@/components/dashboard/rank-tracking/ChooseKeywordsModal";
import {
  buttonGhostClass,
  buttonPrimaryClass,
  DashboardAlert,
  DashboardCard,
  DataTable,
  EmptyBlock,
  LoadingBlock,
  PageStack,
  ResultsPanel,
} from "@/components/dashboard/ui";
import { useDashboardProject } from "@/components/dashboard/useDashboardProject";
import type {
  TrackedDomainDetail,
  TrackedDomainSummary,
} from "@/lib/dashboard/rank-tracking";
import {
  DEFAULT_COUNTRY_LOCATION_CODE,
  resolveLabsLocationCode,
} from "@/lib/dashboard/locations";

export default function RankTrackingPage() {
  const { project, dataForSeoConfigured } = useDashboardProject();

  const [domains, setDomains] = useState<TrackedDomainSummary[]>([]);
  const [domainsReady, setDomainsReady] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<TrackedDomainDetail | null>(null);
  const didAutoOpenDomain = useRef(false);

  const [detailLoading, setDetailLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [checkingKeyword, setCheckingKeyword] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  const [chooseOpen, setChooseOpen] = useState(false);
  const [chooseDomain, setChooseDomain] = useState("");
  const [chooseDomainId, setChooseDomainId] = useState("");
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [discoveredKeywords, setDiscoveredKeywords] = useState<DiscoverKeywordRow[]>([]);
  const [chooseSaving, setChooseSaving] = useState(false);
  const [chooseError, setChooseError] = useState("");

  async function loadDomains() {
    try {
      const res = await fetch("/api/dashboard/rank-tracking");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      const next = (data.domains ?? []) as TrackedDomainSummary[];
      setDomains(next);
      // On first hydrate, open an existing domain instead of the Add Domain empty state.
      if (!didAutoOpenDomain.current && next[0]?.id) {
        didAutoOpenDomain.current = true;
        setSelectedId(next[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setDomainsReady(true);
    }
  }

  async function loadDetail(id: string) {
    setDetailLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/dashboard/rank-tracking/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setDetail(data.domain);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    // Hydrate saved domains quietly — no "Loading…" spinner on page open.
    void loadDomains();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    void loadDetail(selectedId);
  }, [selectedId]);

  async function openKeywordDiscovery(domainId: string, domain: string) {
    setChooseDomainId(domainId);
    setChooseDomain(domain);
    setChooseOpen(true);
    setDiscoverLoading(true);
    setDiscoveredKeywords([]);
    setChooseError("");

    try {
      const res = await fetch(`/api/dashboard/rank-tracking/${domainId}/discover`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setDiscoveredKeywords(data.keywords ?? []);
    } catch (err) {
      setChooseError(err instanceof Error ? err.message : "Discovery failed");
    } finally {
      setDiscoverLoading(false);
    }
  }

  async function handleAddDomain(input: AddTrackedDomainInput) {
    setAddSubmitting(true);
    setAddError("");
    try {
      const res = await fetch("/api/dashboard/rank-tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setAddOpen(false);
      await loadDomains();
      await openKeywordDiscovery(data.domain.id, data.domain.domain);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Could not add domain");
    } finally {
      setAddSubmitting(false);
    }
  }

  async function handleEditSettings(input: AddTrackedDomainInput) {
    if (!selectedId) return;
    setEditSubmitting(true);
    setEditError("");
    try {
      const res = await fetch(`/api/dashboard/rank-tracking/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationCode: input.locationCode,
          languageCode: input.languageCode,
          searchTargeting: input.searchTargeting,
          device: input.device,
          schedule: input.schedule,
          searchDepth: input.searchDepth,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setEditOpen(false);
      if (data.domain) setDetail(data.domain);
      await loadDomains();
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : "Could not update settings",
      );
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleSaveKeywords(selected: DiscoverKeywordRow[]) {
    setChooseSaving(true);
    setChooseError("");
    try {
      const res = await fetch(
        `/api/dashboard/rank-tracking/${chooseDomainId}/keywords`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keywords: selected }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setChooseOpen(false);
      setSelectedId(chooseDomainId);
      setDetail(data.domain);
      await loadDomains();
    } catch (err) {
      setChooseError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setChooseSaving(false);
    }
  }

  async function deleteDomain(id: string) {
    if (!confirm("Remove this tracked domain and all its keywords?")) return;
    setError("");
    try {
      const res = await fetch(`/api/dashboard/rank-tracking/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      if (selectedId === id) setSelectedId(null);
      await loadDomains();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function refreshAll(id: string) {
    setRefreshing(true);
    setError("");
    try {
      const res = await fetch(`/api/dashboard/rank-tracking/${id}/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setDetail(data.domain);
      await loadDomains();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refresh failed");
    } finally {
      setRefreshing(false);
    }
  }

  async function refreshKeyword(id: string, keyword: string) {
    setCheckingKeyword(keyword);
    setError("");
    try {
      const res = await fetch(`/api/dashboard/rank-tracking/${id}/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setDetail(data.domain);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refresh failed");
    } finally {
      setCheckingKeyword(null);
    }
  }

  async function removeKeyword(id: string, keyword: string) {
    setError("");
    try {
      const res = await fetch(`/api/dashboard/rank-tracking/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      await loadDetail(id);
      await loadDomains();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Remove failed");
    }
  }

  const activeDetail = detail && selectedId ? detail : null;

  return (
    <DashboardShell
      title="Rank Tracking"
      description="Track keyword positions across domains"
      actions={
        selectedId && activeDetail ? (
          <button
            type="button"
            onClick={() => void refreshAll(selectedId)}
            disabled={refreshing || Boolean(checkingKeyword)}
            className={buttonGhostClass}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh all
          </button>
        ) : null
      }
    >
      <PageStack>
        <DataForSeoBanner configured={dataForSeoConfigured} />
        {error ? <DashboardAlert variant="error">{error}</DashboardAlert> : null}

        {!selectedId ? (
          <>
            <DashboardCard
              title="Tracked Domains"
              flush
              className="overflow-hidden"
              actions={
                domainsReady && domains.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setAddOpen(true)}
                    className={`${buttonPrimaryClass} !py-1.5 !px-3 text-xs`}
                  >
                    <Plus className="h-4 w-4" /> Add Domain
                  </button>
                ) : null
              }
            >
              {!domainsReady ? (
                <div className="min-h-[8rem] p-4 sm:p-6" aria-hidden />
              ) : domains.length === 0 ? (
                <div className="p-4 sm:p-6">
                  <EmptyBlock
                    icon={TrendingUp}
                    title="No tracked domains yet"
                    description="Add a domain to fetch its ranking keywords and choose which ones to monitor."
                    action={
                      <button type="button" onClick={() => setAddOpen(true)} className={buttonPrimaryClass}>
                        <Plus className="h-4 w-4" /> Add Domain
                      </button>
                    }
                  />
                </div>
              ) : (
                <ul className="divide-y divide-line/60">
                  {domains.map((row) => (
                    <li key={row.id} className="flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-4 md:px-6">
                      <button
                        type="button"
                        onClick={() => setSelectedId(row.id)}
                        className="flex min-w-0 flex-1 items-center justify-between gap-4 text-left transition hover:opacity-90"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-snow">{row.domain}</p>
                          <p className="mt-1 text-xs text-ink-muted">
                            {row.summary} · {row.keywordCount} keyword
                            {row.keywordCount === 1 ? "" : "s"}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 shrink-0 text-ink-muted" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteDomain(row.id)}
                        className="rounded-lg border border-line p-2 text-ink-muted transition hover:border-red-500/30 hover:text-red-300"
                        aria-label={`Delete ${row.domain}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </DashboardCard>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="inline-flex items-center gap-1 text-sm text-ink-muted transition hover:text-snow"
            >
              <ChevronLeft className="h-4 w-4" /> Back to domains
            </button>

            {detailLoading && !activeDetail ? (
              <LoadingBlock label="Loading tracked keywords..." />
            ) : null}

            {activeDetail ? (
              <>
                <DashboardCard>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="font-display text-xl font-semibold text-snow">
                        {activeDetail.domain}
                      </h2>
                      <p className="mt-1 text-sm text-ink-muted">{activeDetail.summary}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditError("");
                          setEditOpen(true);
                        }}
                        className={buttonGhostClass}
                      >
                        <Settings2 className="h-4 w-4" /> Edit settings
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void openKeywordDiscovery(activeDetail.id, activeDetail.domain)
                        }
                        className={buttonGhostClass}
                      >
                        <Plus className="h-4 w-4" /> Add keywords
                      </button>
                    </div>
                  </div>
                </DashboardCard>

                {activeDetail.keywords.length === 0 ? (
                  <EmptyBlock
                    icon={TrendingUp}
                    title="No keywords tracked yet"
                    description="Discover keywords this domain ranks for and save the ones you want to monitor."
                    action={
                      <button
                        type="button"
                        onClick={() =>
                          void openKeywordDiscovery(activeDetail.id, activeDetail.domain)
                        }
                        className={buttonPrimaryClass}
                      >
                        Choose keywords
                      </button>
                    }
                  />
                ) : (
                  <ResultsPanel
                    title={`${activeDetail.keywords.length} tracked keywords`}
                    description="Refresh to check current Google positions for this domain."
                  >
                    <DataTable
                      minWidth="760px"
                      rows={activeDetail.keywords}
                      rowKey={(row) => row.id}
                      columns={[
                        {
                          key: "keyword",
                          header: "Keyword",
                          cell: (row) => (
                            <span className="font-medium text-snow">{row.keyword}</span>
                          ),
                        },
                        {
                          key: "position",
                          header: "Position",
                          cell: (row) => (
                            <span className="text-lg font-semibold text-accent">
                              {row.lastPosition ?? "100+"}
                            </span>
                          ),
                        },
                        {
                          key: "volume",
                          header: "Volume",
                          cell: (row) => (
                            <span className="text-ink-muted">
                              {row.searchVolume?.toLocaleString() ?? "—"}
                            </span>
                          ),
                        },
                        {
                          key: "traffic",
                          header: "Traffic",
                          cell: (row) => (
                            <span className="text-ink-muted">
                              {row.etv != null ? Math.round(row.etv).toLocaleString() : "—"}
                            </span>
                          ),
                        },
                        {
                          key: "date",
                          header: "Last checked",
                          cell: (row) => {
                            const latest = row.snapshots[row.snapshots.length - 1];
                            return (
                              <span className="text-ink-muted">
                                {latest?.date
                                  ? new Date(latest.date).toLocaleDateString()
                                  : "—"}
                              </span>
                            );
                          },
                        },
                        {
                          key: "actions",
                          header: "",
                          className: "text-right",
                          cell: (row) => (
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  void refreshKeyword(activeDetail.id, row.keyword)
                                }
                                disabled={refreshing || checkingKeyword === row.keyword}
                                className={buttonGhostClass}
                              >
                                <RefreshCw
                                  className={`h-4 w-4 ${
                                    checkingKeyword === row.keyword ? "animate-spin" : ""
                                  }`}
                                />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  void removeKeyword(activeDetail.id, row.keyword)
                                }
                                className={buttonGhostClass}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ),
                        },
                      ]}
                    />
                  </ResultsPanel>
                )}
              </>
            ) : null}
          </>
        )}
      </PageStack>

      <AddTrackedDomainModal
        key={`add-${addOpen}-${project?.domain ?? ""}`}
        open={addOpen}
        mode="add"
        onClose={() => {
          if (addSubmitting) return;
          setAddOpen(false);
          setAddError("");
        }}
        onSubmit={handleAddDomain}
        defaultDomain={project?.domain ?? ""}
        defaultLocationCode={resolveLabsLocationCode(
          project?.locationCode ?? DEFAULT_COUNTRY_LOCATION_CODE,
        )}
        defaultLanguageCode={project?.languageCode ?? "en"}
        submitting={addSubmitting}
        error={addError}
      />

      <AddTrackedDomainModal
        key={`edit-${editOpen}-${activeDetail?.id ?? ""}`}
        open={editOpen}
        mode="edit"
        onClose={() => {
          if (editSubmitting) return;
          setEditOpen(false);
          setEditError("");
        }}
        onSubmit={handleEditSettings}
        defaultDomain={activeDetail?.domain ?? ""}
        defaultLocationCode={resolveLabsLocationCode(
          activeDetail?.locationCode ?? DEFAULT_COUNTRY_LOCATION_CODE,
        )}
        defaultLanguageCode={activeDetail?.languageCode ?? "en"}
        defaultSearchTargeting={activeDetail?.searchTargeting ?? "national"}
        defaultDevice={activeDetail?.device ?? "mobile"}
        defaultSchedule={activeDetail?.schedule ?? "weekly"}
        defaultSearchDepth={activeDetail?.searchDepth ?? 40}
        submitting={editSubmitting}
        error={editError}
      />

      <ChooseKeywordsModal
        open={chooseOpen}
        onClose={() => {
          if (chooseSaving) return;
          setChooseOpen(false);
          setChooseError("");
        }}
        domain={chooseDomain}
        keywords={discoveredKeywords}
        loading={discoverLoading}
        saving={chooseSaving}
        error={chooseError}
        onSave={handleSaveKeywords}
        onSkip={() => {
          setChooseOpen(false);
          if (chooseDomainId) setSelectedId(chooseDomainId);
        }}
      />
    </DashboardShell>
  );
}
