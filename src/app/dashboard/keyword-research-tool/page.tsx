"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import {
  KeywordResearchPanel,
  type KeywordResearchRow,
} from "@/components/dashboard/keyword-research/KeywordResearchPanel";
import { DataForSeoBanner, FirecrawlBanner } from "@/components/dashboard/ProjectDomainBanner";
import { PageStack } from "@/components/dashboard/ui";
import { useDashboardProject } from "@/components/dashboard/useDashboardProject";
import type {
  SeedKeywordInsights,
  SerpResultRow,
} from "@/lib/dataforseo/keyword-research";
import {
  clearKeywordResearchSession,
  loadKeywordResearchSession,
  readLocalKeywordSession,
  saveKeywordResearchSession,
  type KeywordResearchSession,
} from "@/lib/dashboard/keyword-research-session";
import { type KeywordMode, DEFAULT_LOCATION_CODE } from "@/lib/dashboard/locations";

function applySession(
  session: KeywordResearchSession,
  setters: {
    setSeed: (value: string) => void;
    setLocationCode: (value: number) => void;
    setLimit: (value: number) => void;
    setMode: (value: KeywordMode) => void;
    setResults: (value: KeywordResearchRow[]) => void;
    setSeedInsights: (value: SeedKeywordInsights | null) => void;
    setSerpResults: (value: SerpResultRow[]) => void;
  },
) {
  setters.setSeed(session.seed);
  setters.setLocationCode(session.locationCode);
  setters.setLimit(session.limit);
  setters.setMode(session.mode);
  setters.setResults(session.results ?? []);
  setters.setSeedInsights(session.seedInsights ?? null);
  setters.setSerpResults(session.serpResults ?? []);
}

export default function KeywordsPage() {
  const { dataForSeoConfigured, firecrawlConfigured } = useDashboardProject();
  const [seed, setSeed] = useState("");
  const [locationCode, setLocationCode] = useState<number>(DEFAULT_LOCATION_CODE);
  const [limit, setLimit] = useState<number>(50);
  const [mode, setMode] = useState<KeywordMode>("auto");
  const [results, setResults] = useState<KeywordResearchRow[]>([]);
  const [seedInsights, setSeedInsights] = useState<SeedKeywordInsights | null>(null);
  const [serpResults, setSerpResults] = useState<SerpResultRow[]>([]);
  const [serpLive, setSerpLive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [savedKeywords, setSavedKeywords] = useState<Set<string>>(new Set());
  const [savingKeywords, setSavingKeywords] = useState(false);

  async function loadSavedKeywords() {
    try {
      const res = await fetch("/api/dashboard/keywords/saved");
      const data = await res.json();
      if (!res.ok) return;
      const next = new Set<string>(
        (data.keywords ?? []).map((k: { keyword: string }) =>
          String(k.keyword).toLowerCase(),
        ),
      );
      setSavedKeywords(next);
    } catch {
      // Ignore — save UI still works without preloaded state
    }
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const setters = {
        setSeed,
        setLocationCode,
        setLimit,
        setMode,
        setResults,
        setSeedInsights,
        setSerpResults,
      };

      // Restore last search + results so refresh keeps the overview/table.
      const local = readLocalKeywordSession();
      if (local && !cancelled) {
        applySession(local, setters);
      }

      const server = await loadKeywordResearchSession();
      if (server && !cancelled) {
        applySession(server, setters);
      }

      if (!cancelled) {
        await loadSavedKeywords();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function onResearch(searchSeed?: string) {
    const keyword = (searchSeed ?? seed).trim();
    if (!keyword) return;
    if (searchSeed && searchSeed !== seed) setSeed(searchSeed);

    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/dashboard/keywords/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seed: keyword,
          locationCode,
          limit,
          mode,
          useClickstream: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      const nextResults = data.results ?? [];
      const nextInsights = data.seedInsights ?? null;
      const nextSerp = data.serpResults ?? [];

      setResults(nextResults);
      setSeedInsights(nextInsights);
      setSerpResults(nextSerp);
      setSerpLive(data.serpSource === "firecrawl");

      void saveKeywordResearchSession({
        seed: keyword,
        locationCode,
        limit,
        mode,
        useClickstream: false,
        results: nextResults,
        seedInsights: nextInsights,
        serpResults: nextSerp,
        savedAt: new Date().toISOString(),
      });

      if (nextResults.length === 0 && !nextInsights) {
        setError("No keywords found for that seed. Try a different keyword or mode.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Research failed");
      setResults([]);
      setSeedInsights(null);
      setSerpResults([]);
      setSerpLive(false);
    } finally {
      setLoading(false);
    }
  }

  function handleSeedChange(value: string) {
    setSeed(value);
    if (!value.trim()) {
      setResults([]);
      setSeedInsights(null);
      setSerpResults([]);
      setSerpLive(false);
      setError("");
      void clearKeywordResearchSession();
    }
  }

  async function saveKeywords(rows: KeywordResearchRow[]) {
    if (rows.length === 0) return;
    setError("");
    setMessage("");
    setSavingKeywords(true);
    try {
      const payload = rows.map((row) => ({
        keyword: row.keyword,
        searchVolume: row.searchVolume,
        cpc: row.cpc,
        difficulty: row.difficulty,
      }));
      const res = await fetch("/api/dashboard/keywords/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Save failed");
        return;
      }
      const saved = (data.saved ?? []) as Array<{ keyword: string }>;
      setSavedKeywords((prev) => {
        const next = new Set(prev);
        for (const item of saved) next.add(String(item.keyword).toLowerCase());
        return next;
      });
      setMessage(
        saved.length === 1
          ? `Saved "${saved[0].keyword}"`
          : `Saved ${saved.length} keywords`,
      );
    } catch {
      setError("Save failed. Please try again.");
    } finally {
      setSavingKeywords(false);
    }
  }

  async function saveKeyword(row: KeywordResearchRow) {
    await saveKeywords([row]);
  }

  async function unsaveKeyword(keyword: string) {
    const key = keyword.trim().toLowerCase();
    if (!key) return;
    setError("");
    setMessage("");
    setSavingKeywords(true);
    try {
      const res = await fetch(
        `/api/dashboard/keywords/saved?keyword=${encodeURIComponent(key)}`,
        { method: "DELETE" },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || "Could not remove keyword");
        return;
      }
      setSavedKeywords((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      setMessage(`Removed "${keyword}" from saved`);
    } catch {
      setError("Could not remove keyword. Please try again.");
    } finally {
      setSavingKeywords(false);
    }
  }

  return (
    <DashboardShell
      title="Keyword Research"
      description="Discover keyword ideas, search demand, and ranking opportunities."
    >
      <PageStack className="!max-w-none w-full">
        <DataForSeoBanner configured={dataForSeoConfigured} />
        <FirecrawlBanner configured={firecrawlConfigured} />

        <KeywordResearchPanel
          seed={seed}
          onSeedChange={handleSeedChange}
          locationCode={locationCode}
          onLocationChange={setLocationCode}
          limit={limit}
          onLimitChange={setLimit}
          mode={mode}
          onModeChange={setMode}
          results={results}
          seedInsights={seedInsights}
          serpResults={serpResults}
          serpLive={serpLive}
          loading={loading}
          error={error}
          message={message}
          onResearch={(nextSeed) => void onResearch(nextSeed)}
          onSaveKeyword={(row) => void saveKeyword(row)}
          onUnsaveKeyword={(keyword) => void unsaveKeyword(keyword)}
          onSaveKeywords={(rows) => void saveKeywords(rows)}
          savedKeywords={savedKeywords}
          savingKeywords={savingKeywords}
        />
      </PageStack>
    </DashboardShell>
  );
}
