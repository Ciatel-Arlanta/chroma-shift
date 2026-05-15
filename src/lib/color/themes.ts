import { converter, formatCss, wcagContrast } from "culori";
import chroma from "chroma-js";

import type { CustomPalette, SemanticAssignment, ThemePreset, ThemeTokens } from "./types";

const toOklch = converter("oklch");

function assignmentMap(assignments: SemanticAssignment[]) {
  return Object.fromEntries(assignments.map((assignment) => [assignment.role, assignment.color])) as Record<
    SemanticAssignment["role"],
    string
  >;
}

function ensureContrast(foreground: string, background: string, target = 4.5) {
  let current = chroma(foreground);
  let attempts = 0;

  while ((wcagContrast(current.hex(), background) ?? 0) < target && attempts < 24) {
    current =
      chroma(background).luminance() < 0.45 ? current.brighten(0.35) : current.darken(0.35);
    attempts += 1;
  }

  return current.hex();
}

function cssColor(input: string) {
  return formatCss(toOklch(input)) ?? input;
}

function buildTokensFromBase(base: {
  background: string;
  surface: string;
  surfaceMuted: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  accentStrong: string;
  border: string;
}): ThemeTokens {
  const foreground = ensureContrast(base.textPrimary, base.background, 7);
  const primaryForeground = ensureContrast("#ffffff", base.accentStrong, 4.5);
  const secondaryForeground = ensureContrast(base.textPrimary, base.surfaceMuted, 4.5);

  return {
    background: cssColor(base.background),
    foreground: cssColor(foreground),
    card: cssColor(base.surface),
    cardForeground: cssColor(ensureContrast(base.textPrimary, base.surface, 5.5)),
    popover: cssColor(chroma(base.surface).brighten(0.25).hex()),
    popoverForeground: cssColor(ensureContrast(base.textPrimary, base.surface, 5.5)),
    primary: cssColor(base.accentStrong),
    primaryForeground: cssColor(primaryForeground),
    secondary: cssColor(base.surfaceMuted),
    secondaryForeground: cssColor(secondaryForeground),
    muted: cssColor(chroma(base.surfaceMuted).desaturate(0.35).hex()),
    mutedForeground: cssColor(ensureContrast(base.textSecondary, base.surfaceMuted, 4.5)),
    accent: cssColor(base.accent),
    accentForeground: cssColor(ensureContrast(base.textPrimary, base.accent, 4.5)),
    border: cssColor(base.border),
    input: cssColor(chroma(base.border).brighten(0.15).hex()),
    ring: cssColor(chroma(base.accentStrong).brighten(0.3).hex()),
  };
}

export function generateThemeTokens(
  assignments: SemanticAssignment[],
  preset: ThemePreset,
  customPalette?: CustomPalette,
): ThemeTokens {
  if (preset === "custom" && customPalette) {
    return generateCustomTokens(customPalette);
  }

  const colors = assignmentMap(assignments);
  const accentHue = chroma(colors.accent).set(
    "oklch.c",
    Math.max(chroma(colors.accent).get("oklch.c"), 0.15),
  );

  switch (preset) {
    case "dark":
      return buildTokensFromBase({
        background: "#07111f",
        surface: chroma.mix("#101828", colors.surface, 0.25, "oklch").hex(),
        surfaceMuted: chroma.mix("#162033", colors.surfaceMuted, 0.2, "oklch").hex(),
        textPrimary: "#f5f7ff",
        textSecondary: "#bdc7db",
        accent: chroma(colors.accent).brighten(0.2).hex(),
        accentStrong: accentHue.brighten(0.45).hex(),
        border: chroma.mix("#22314a", colors.border, 0.35, "oklch").hex(),
      });
    case "modern-saas":
      return buildTokensFromBase({
        background: "#f4f8fc",
        surface: "#ffffff",
        surfaceMuted: "#e6eef8",
        textPrimary: "#0f172a",
        textSecondary: "#506177",
        accent: chroma(colors.accent).set("oklch.c", 0.14).brighten(0.15).hex(),
        accentStrong: chroma(colors.accentStrong).set("oklch.c", 0.18).darken(0.15).hex(),
        border: "#d6e2f0",
      });
    case "pastel":
      return buildTokensFromBase({
        background: chroma.mix("#fffdfb", colors.background, 0.08, "oklch").hex(),
        surface: "#ffffff",
        surfaceMuted: chroma.mix("#f3eefb", colors.surfaceMuted, 0.12, "oklch").hex(),
        textPrimary: "#44324f",
        textSecondary: "#6f6178",
        accent: chroma(colors.accent).set("oklch.c", 0.1).brighten(1.15).hex(),
        accentStrong: chroma(colors.accentStrong).set("oklch.c", 0.12).brighten(0.75).hex(),
        border: "#ebdff1",
      });
    case "cyberpunk":
      return buildTokensFromBase({
        background: "#09050f",
        surface: "#140d20",
        surfaceMuted: "#1e1431",
        textPrimary: "#fbf8ff",
        textSecondary: "#cbb7ec",
        accent: chroma("#20f6ff").mix(colors.accent, 0.2, "oklch").hex(),
        accentStrong: chroma("#ff3fd1").mix(colors.accentStrong, 0.15, "oklch").hex(),
        border: "#3a235c",
      });
    case "monochrome":
      return buildTokensFromBase({
        background: "#f7f7f5",
        surface: "#ffffff",
        surfaceMuted: "#e8e7e3",
        textPrimary: "#111111",
        textSecondary: "#525252",
        accent: "#3c3c3c",
        accentStrong: "#18181b",
        border: "#d4d4d8",
      });
    case "accessibility":
      return buildTokensFromBase({
        background: chroma(colors.background).luminance() > 0.5 ? "#ffffff" : "#0b1220",
        surface: chroma(colors.background).luminance() > 0.5 ? "#f8fbff" : "#121a2b",
        surfaceMuted: chroma(colors.background).luminance() > 0.5 ? "#e8eef7" : "#1b263b",
        textPrimary: chroma(colors.background).luminance() > 0.5 ? "#0f172a" : "#f8fbff",
        textSecondary: chroma(colors.background).luminance() > 0.5 ? "#334155" : "#d2dbeb",
        accent: chroma(colors.accent).set("oklch.c", 0.16).hex(),
        accentStrong: chroma(colors.accentStrong).set("oklch.c", 0.2).darken(0.2).hex(),
        border: chroma(colors.background).luminance() > 0.5 ? "#bfd0e4" : "#32435f",
      });
    default:
      return buildTokensFromBase({
        background: colors.background,
        surface: colors.surface,
        surfaceMuted: colors.surfaceMuted,
        textPrimary: colors.textPrimary,
        textSecondary: colors.textSecondary,
        accent: colors.accent,
        accentStrong: colors.accentStrong,
        border: colors.border,
      });
  }
}

/* ------------------------------------------------------------------ */
/*  Custom palette → semantic role assignment                         */
/*                                                                    */
/*  Given 3-10 arbitrary colors, sort by luminance and chroma to      */
/*  intelligently pick background, surface, text, accent, border.     */
/* ------------------------------------------------------------------ */

function generateCustomTokens(palette: CustomPalette): ThemeTokens {
  const hexes = palette.colors.slice(0, 10);

  // Sort by luminance (lightest first)
  const byLuminance = [...hexes].sort(
    (a, b) => chroma(b).luminance() - chroma(a).luminance(),
  );

  // Sort by chroma (most colorful first)
  const byChroma = [...hexes].sort(
    (a, b) => chroma(b).get("oklch.c") - chroma(a).get("oklch.c"),
  );

  // Decide if user wants a light or dark theme based on average luminance
  const avgLum = hexes.reduce((s, h) => s + chroma(h).luminance(), 0) / hexes.length;
  const isDark = avgLum < 0.35;

  // Pick background: lightest color for light theme, darkest for dark theme
  const background = isDark ? byLuminance[byLuminance.length - 1] : byLuminance[0];

  // Pick text: opposite end of luminance spectrum from background
  const textPrimary = isDark ? byLuminance[0] : byLuminance[byLuminance.length - 1];

  // Pick accent: most chromatic color (that isn't background or text)
  const accent =
    byChroma.find((c) => c !== background && c !== textPrimary) ?? byChroma[0];

  // Pick accent strong: second most chromatic (or darken/brighten accent)
  const accentStrong =
    byChroma.find((c) => c !== background && c !== textPrimary && c !== accent) ??
    (isDark ? chroma(accent).brighten(0.4).hex() : chroma(accent).darken(0.4).hex());

  // Pick surface: second lightest (or brightest) that isn't already used
  const used = new Set([background, textPrimary, accent, accentStrong]);
  const surface =
    byLuminance.find((c) => !used.has(c)) ??
    (isDark ? chroma(background).brighten(0.5).hex() : chroma(background).darken(0.15).hex());
  used.add(surface);

  // Pick border: mid-luminance low-chroma color
  const border =
    byLuminance.find((c) => !used.has(c)) ??
    chroma.mix(background, textPrimary, 0.25, "oklch").hex();
  used.add(border);

  // Surface muted: another mid color or derive
  const surfaceMuted =
    byLuminance.find((c) => !used.has(c)) ??
    chroma.mix(background, surface, 0.5, "oklch").hex();

  // Text secondary: lighter variant of textPrimary
  const textSecondary = isDark
    ? chroma(textPrimary).darken(1.2).hex()
    : chroma(textPrimary).brighten(1.2).hex();

  return buildTokensFromBase({
    background,
    surface,
    surfaceMuted,
    textPrimary,
    textSecondary,
    accent,
    accentStrong,
    border,
  });
}

