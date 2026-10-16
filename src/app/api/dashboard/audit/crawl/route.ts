import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-session";
import { connectDB } from "@/lib/db";
import { runCrawlAudit } from "@/lib/audit/crawl/run-crawl-audit";
import { getProjectForUser } from "@/lib/dashboard/project";
import { SiteAudit } from "@/models/SiteAudit";

export const maxDuration = 60;

export async function POST(request: Request) {
  const result = await requireUser(request);
  if ("response" in result) return result.response;
  const { user } = result;

  try {
    const project = await getProjectForUser(user.id);
    const body = (await request.json().catch(() => ({}))) as {
      url?: string;
      maxPages?: number;
    };

    const target =
      typeof body.url === "string" && body.url.trim()
        ? body.url.trim()
        : project.domain;

    if (!target || target === "example.com") {
      return NextResponse.json(
        { message: "Enter a domain or URL to crawl." },
        { status: 400 },
      );
    }

    const maxPages = Math.min(Math.max(Number(body.maxPages) || 30, 5), 50);

    await connectDB();
    const audit = await SiteAudit.create({
      userId: user.id,
      projectId: project.id,
      status: "running",
    });

    try {
      const report = await runCrawlAudit(target, { maxPages });

      const severityMap = {
        critical: "critical",
        warning: "warning",
        info: "notice",
      } as const;

      audit.status = "completed";
      audit.pagesCrawled = report.pagesCrawled;
      audit.score = Math.max(
        0,
        100 - report.issues.filter((i) => i.severity === "critical").length * 8,
      );
      audit.seoScore = Math.max(
        0,
        100 - Math.min(80, report.issuesFound * 2),
      );
      audit.report = report;
      audit.set(
        "issues",
        report.issues.slice(0, 200).map((issue) => ({
          type: issue.issueType,
          severity: severityMap[issue.severity],
          message: issue.title,
          url: issue.pageUrl,
        })),
      );
      await audit.save();

      return NextResponse.json({
        id: audit._id.toString(),
        report,
      });
    } catch (error) {
      audit.status = "failed";
      audit.errorMessage =
        error instanceof Error ? error.message : "Crawl audit failed";
      await audit.save();
      throw error;
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Crawl audit failed";
    console.error("Crawl audit error:", error);
    return NextResponse.json({ message }, { status: 500 });
  }
}
