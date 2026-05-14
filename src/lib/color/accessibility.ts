import { wcagContrast } from "culori";

import { clamp } from "@/lib/utils";
import type { AccessibilityPairReport, AccessibilityReport, SemanticAssignment, ThemeTokens } from "./types";

function pair(label: string, foreground: string, background: string, target: number): AccessibilityPairReport {
  const contrast = wcagContrast(foreground, background) ?? 1;
  return {
    label,
    contrast,
    target,
    passes: contrast >= target,
  };
}

export function scoreThemeAccessibility(
  tokens: ThemeTokens,
  assignments?: SemanticAssignment[],
  baselineScore?: number,
): AccessibilityReport {
  const pairs = [
    pair("Text / Background", tokens.foreground, tokens.background, 7),
    pair("Card text / Card", tokens.cardForeground, tokens.card, 4.5),
    pair("Muted text / Muted", tokens.mutedForeground, tokens.muted, 4.5),
    pair("Primary / Background", tokens.primary, tokens.background, 3),
    pair("Border / Background", tokens.border, tokens.background, 1.5),
  ];

  const average = pairs.reduce((sum, item) => sum + Math.min(item.contrast / item.target, 1.25), 0) / pairs.length;
  const issueCount = pairs.filter((item) => !item.passes).length;
  const confidencePenalty =
    assignments?.reduce((sum, assignment) => sum + (1 - assignment.confidence), 0) ?? 0;
  const score = Math.round(
    clamp(average * 82 + (pairs[0].passes ? 10 : 0) - confidencePenalty * 2, 24, 100),
  );
  const delta = baselineScore == null ? 0 : score - baselineScore;

  return {
    score,
    rating: delta > 5 ? "Improved" : delta < -3 ? "Needs review" : "Similar",
    issueCount,
    pairs,
    summary: [
      delta > 0 ? `Contrast improved by ${delta} points.` : "Contrast remained close to the source.",
      issueCount ? `${issueCount} contrast checks still need attention.` : "All tracked contrast pairs pass.",
    ],
  };
}
