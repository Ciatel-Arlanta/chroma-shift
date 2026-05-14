import { converter, wcagContrast } from "culori";

import { clamp } from "@/lib/utils";
import type { ExtractedColor, SemanticAssignment, SemanticRole } from "./types";

const toOklch = converter("oklch");

function getOklch(hex: string) {
  return toOklch(hex) ?? { l: 0, c: 0, h: 0 };
}

function pickDistinct(
  colors: ExtractedColor[],
  predicate: (color: ExtractedColor) => number,
  exclude: Set<string>,
) {
  return colors
    .filter((color) => !exclude.has(color.hex))
    .map((color) => ({ color, score: predicate(color) }))
    .sort((a, b) => b.score - a.score)[0]?.color;
}

function contrastAgainst(background: string, candidate: string) {
  return wcagContrast(background, candidate) ?? 1;
}

function accentScore(color: ExtractedColor, backgroundHex: string) {
  const sample = getOklch(color.hex);
  const background = getOklch(backgroundHex);
  const lightnessDistance = Math.abs(sample.l - 0.62);
  const backgroundDistance = Math.abs(sample.l - background.l);
  const populationBonus = Math.min(color.population * 7.5, 1.5);
  const chromaBonus = sample.c * 4.2;
  const contrastBonus = Math.min(contrastAgainst(backgroundHex, color.hex), 5) * 0.16;
  const highlightPenalty = sample.l > 0.82 ? (sample.l - 0.82) * 4.8 : 0;
  const tinyPenalty = color.population < 0.035 ? (0.035 - color.population) * 22 : 0;
  const washedPenalty = sample.c < 0.06 ? (0.06 - sample.c) * 6 : 0;
  const nearBackgroundPenalty = backgroundDistance < 0.12 ? (0.12 - backgroundDistance) * 4 : 0;

  return (
    chromaBonus +
    populationBonus +
    contrastBonus -
    lightnessDistance * 1.15 -
    highlightPenalty -
    tinyPenalty -
    washedPenalty -
    nearBackgroundPenalty
  );
}

function accentStrongScore(color: ExtractedColor, backgroundHex: string) {
  const sample = getOklch(color.hex);
  const contrast = contrastAgainst(backgroundHex, color.hex);
  const base = accentScore(color, backgroundHex);
  const extraContrast = Math.min(contrast, 6) * 0.32;
  const extraHighlightPenalty = sample.l > 0.86 ? (sample.l - 0.86) * 4 : 0;

  return base + extraContrast - extraHighlightPenalty;
}

function buildAssignment(
  role: SemanticRole,
  choice: ExtractedColor,
  colors: ExtractedColor[],
  confidenceBase: number,
): SemanticAssignment {
  const alternatives = colors
    .filter((color) => color.hex !== choice.hex)
    .slice(0, 2)
    .map((color) => color.hex);

  return {
    role,
    color: choice.hex,
    confidence: clamp(confidenceBase, 0.35, 0.99),
    alternatives,
  };
}

export function inferSemanticRoles(colors: ExtractedColor[]): SemanticAssignment[] {
  const sorted = [...colors].sort((a, b) => b.population - a.population);
  const background =
    pickDistinct(
      sorted,
      (color) => {
        const sample = getOklch(color.hex);
        return color.population * 1.5 + (1 - sample.c) + Math.abs(sample.l - 0.55) * 0.3;
      },
      new Set(),
    ) ?? sorted[0];

  const excluded = new Set<string>([background.hex]);
  const surface =
    pickDistinct(
      sorted,
      (color) => {
        const sample = getOklch(color.hex);
        const bg = getOklch(background.hex);
        const distance = Math.abs(sample.l - bg.l) + Math.abs(sample.c - bg.c);
        return color.population * 1.2 - distance;
      },
      excluded,
    ) ?? background;

  excluded.add(surface.hex);

  const textPrimary =
    pickDistinct(
      sorted,
      (color) => contrastAgainst(background.hex, color.hex) + (1 - color.population) * 0.2,
      excluded,
    ) ?? sorted[sorted.length - 1] ?? background;

  excluded.add(textPrimary.hex);

  const textSecondary =
    pickDistinct(
      sorted,
      (color) =>
        contrastAgainst(background.hex, color.hex) * 0.8 + (1 - getOklch(color.hex).c) * 0.2,
      excluded,
    ) ?? textPrimary;

  excluded.add(textSecondary.hex);

  const accent =
    pickDistinct(
      sorted,
      (color) => accentScore(color, background.hex),
      excluded,
    ) ?? textSecondary;

  excluded.add(accent.hex);

  const accentStrong =
    pickDistinct(
      sorted,
      (color) => accentStrongScore(color, background.hex),
      excluded,
    ) ?? accent;

  const border =
    pickDistinct(
      sorted,
      (color) => {
        const sample = getOklch(color.hex);
        const bg = getOklch(background.hex);
        return (
          (1 - sample.c) * 1.4 +
          (1 - Math.abs(sample.l - bg.l)) * 0.7 +
          contrastAgainst(background.hex, color.hex) * 0.15
        );
      },
      new Set([background.hex, accent.hex, accentStrong.hex]),
    ) ?? surface;

  const surfaceMuted =
    pickDistinct(
      sorted,
      (color) => {
        const sample = getOklch(color.hex);
        return color.population + (1 - sample.c) - Math.abs(sample.l - getOklch(surface.hex).l);
      },
      new Set([background.hex, surface.hex]),
    ) ?? border;

  return [
    buildAssignment("background", background, sorted, 0.92),
    buildAssignment("surface", surface, sorted, 0.82),
    buildAssignment("surfaceMuted", surfaceMuted, sorted, 0.74),
    buildAssignment("textPrimary", textPrimary, sorted, 0.88),
    buildAssignment("textSecondary", textSecondary, sorted, 0.7),
    buildAssignment("accent", accent, sorted, 0.84),
    buildAssignment("accentStrong", accentStrong, sorted, 0.66),
    buildAssignment("border", border, sorted, 0.72),
  ];
}
