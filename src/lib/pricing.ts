export type PlanId = "pro" | "keywords" | "growth" | "fullstack";

export type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  priceUsd: number;
  featured?: boolean;
  topic: string;
  features: string[];
};

/** One package: Complete access to all SEO tools and Dashboard features for $20 USD */
export const plans: Plan[] = [
  {
    id: "pro",
    name: "SkillStack Pro Suite",
    topic: "SkillStack Pro",
    tagline:
      "All-in-one SEO command center — complete dashboard tools, AI research, and automated tracking.",
    priceUsd: 20,
    featured: true,
    features: [
      "Keyword research, difficulty & SERP analysis",
      "Domain overview, backlinks & rank tracking",
      "Site audit crawler with technical SEO checks",
      "Organic search, competitors & content gaps",
      "Internal links analyzer & GSC integration",
      "AI visibility suite + agent / MCP workflows",
    ],
  },
];

export function getPlan(id: string): Plan | undefined {
  const match = plans.find((p) => p.id === id);
  if (match) return match;
  // Fallback to primary plan if old plan IDs are referenced
  if (id === "keywords" || id === "growth" || id === "fullstack" || id === "pro") {
    return plans[0];
  }
  return plans[0];
}
