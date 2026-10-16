"use client";

import { Link2, ListOrdered, MessagesSquare } from "lucide-react";
import type { ReactNode } from "react";
import {
  PaidFeatureUnlockCard,
  type UnlockFeature,
} from "@/components/dashboard/PaidFeatureUnlockCard";

const RESEARCH_FEATURES: UnlockFeature[] = [
  {
    icon: MessagesSquare,
    title: "Questions about your market",
    description:
      "See the questions people ask about a keyword, most common first, with ChatGPT's answer to each.",
  },
  {
    icon: Link2,
    title: "Who gets cited",
    description:
      "See which sites ChatGPT cited when it answered, and whether yours is one of them.",
  },
  {
    icon: ListOrdered,
    title: "Track the ones that matter",
    description:
      "Pick the questions worth watching and add them to Prompt Tracking in one step.",
  },
];

const EXPLORER_FEATURES: UnlockFeature[] = [
  {
    icon: MessagesSquare,
    title: "Four models side-by-side",
    description:
      "Run one prompt across ChatGPT, Claude, Gemini, and Perplexity in a single view.",
  },
  {
    icon: Link2,
    title: "See what models cite",
    description:
      "Audit the sources each engine used so you know who wins AI answers.",
  },
  {
    icon: ListOrdered,
    title: "Check brand mentions",
    description:
      "Highlight your brand to see if it appears in the answer text or cited sources.",
  },
];

export function PromptResearchUnlock({
  footer,
}: {
  footer?: ReactNode;
}) {
  return (
    <PaidFeatureUnlockCard
      title="Unlock Prompt Research"
      description="Find questions people ask about your market, see how ChatGPT answers them, and check which sites the answers cite. It runs on costlier AI data — included with SkillStack Pro."
      features={RESEARCH_FEATURES}
      footer={footer}
    />
  );
}

export function PromptExplorerUnlock({
  footer,
}: {
  footer?: ReactNode;
}) {
  return (
    <PaidFeatureUnlockCard
      title="Unlock Prompt Explorer"
      description="Run one prompt across ChatGPT, Claude, Gemini, and Perplexity. Compare answers, citations, and whether your brand is mentioned."
      features={EXPLORER_FEATURES}
      footer={footer}
    />
  );
}
