import type { LucideIcon } from "lucide-react";
import {
  Award,
  Bookmark,
  Bot,
  ClipboardCheck,
  FileStack,
  FileText,
  GitCompareArrows,
  Globe,
  Hash,
  KeyRound,
  LayoutDashboard,
  LineChart,
  Link2,
  MessageSquareText,
  Network,
  Search,
  Target,
  TrendingUp,
  Users,
  BarChart3,
} from "lucide-react";

export type DashboardNavItem = {
  href: string;
  label: string;
  icon?: LucideIcon;
  exact?: boolean;
};

export type DashboardNavGroup = {
  label: string;
  items: DashboardNavItem[];
  collapsible?: boolean;
  defaultOpen?: boolean;
};

export const connectNavGroup: DashboardNavGroup = {
  label: "Connect",
  items: [{ href: "/dashboard/connect", label: "AI & MCP", icon: Bot }],
};

export const dashboardNavGroups: DashboardNavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        exact: true,
      },
    ],
  },
  {
    label: "Research",
    items: [
      {
        href: "/dashboard/keyword-research-tool",
        label: "Keyword Research",
        icon: Search,
      },
      {
        href: "/dashboard/domain-overview-tool",
        label: "Domain Overview",
        icon: Globe,
      },
      {
        href: "/dashboard/backlink-checker",
        label: "Backlinks",
        icon: Link2,
      },
      {
        href: "/dashboard/keyword-difficulty-checker",
        label: "Keyword Difficulty",
        icon: BarChart3,
      },
    ],
  },
  {
    label: "AI Visibility",
    items: [
      {
        href: "/dashboard/prompt-research-tool",
        label: "Prompt Research",
        icon: Search,
      },
      {
        href: "/dashboard/prompt-explorer-tool",
        label: "Prompt Explorer",
        icon: MessageSquareText,
      },
      {
        href: "/dashboard/prompt-tracking-tool",
        label: "Prompt Tracking",
        icon: LineChart,
      },
    ],
  },
  {
    label: "Organic search",
    collapsible: true,
    defaultOpen: true,
    items: [
      {
        href: "/dashboard/organic-keyword-checker",
        label: "Organic keywords",
        icon: KeyRound,
      },
      {
        href: "/dashboard/organic-position-checker",
        label: "Organic positions",
        icon: Target,
      },
      {
        href: "/dashboard/top-pages-finder",
        label: "Top pages",
        icon: FileText,
      },
      {
        href: "/dashboard/organic-competitor-finder",
        label: "Organic competitors",
        icon: Users,
      },
    ],
  },
  {
    label: "Competitive analysis",
    collapsible: true,
    defaultOpen: true,
    items: [
      {
        href: "/dashboard/content-gap-finder",
        label: "Content gap",
        icon: GitCompareArrows,
      },
    ],
  },
  {
    label: "Pages",
    collapsible: true,
    defaultOpen: true,
    items: [
      {
        href: "/dashboard/best-by-links-finder",
        label: "Best by links",
        icon: Award,
      },
    ],
  },
  {
    label: "Internal links",
    collapsible: true,
    defaultOpen: true,
    items: [
      {
        href: "/dashboard/internal-link-checker",
        label: "Internal links",
        icon: Network,
        exact: true,
      },
      {
        href: "/dashboard/internal-link-checker/most-linked",
        label: "Most linked pages",
        icon: FileStack,
      },
      {
        href: "/dashboard/internal-link-checker/anchors",
        label: "Internal anchors",
        icon: Hash,
      },
    ],
  },
  {
    label: "My Site",
    items: [
      {
        href: "/dashboard/gsc-insights-tool",
        label: "GSC Insights",
        icon: BarChart3,
      },
      {
        href: "/dashboard/rank-tracker",
        label: "Rank Tracking",
        icon: TrendingUp,
      },
      {
        href: "/dashboard/saved-keywords-manager",
        label: "Saved Keywords",
        icon: Bookmark,
      },
      {
        href: "/dashboard/site-audit-tool",
        label: "Site Audit",
        icon: ClipboardCheck,
      },
    ],
  },
  connectNavGroup,
];

export const allDashboardNavItems = dashboardNavGroups.flatMap((g) => g.items);
