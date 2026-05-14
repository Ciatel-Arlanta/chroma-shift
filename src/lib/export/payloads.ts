import type { GeneratedTheme, SemanticAssignment, ThemeAnalysisResult } from "@/lib/color/types";

export function buildThemeJson(
  analysis: ThemeAnalysisResult,
  theme: GeneratedTheme,
  sourceName: string,
) {
  return JSON.stringify(
    {
      sourceName,
      preset: theme.preset,
      sourceKind: analysis.sourceKind,
      extractedColors: analysis.extractedColors,
      semanticAssignments: analysis.semanticAssignments,
      accessibility: theme.accessibilityReport,
      tokens: theme.tokens,
    },
    null,
    2,
  );
}

export function buildTailwindSnippet(theme: GeneratedTheme, assignments: SemanticAssignment[]) {
  return `export const chromaShiftTheme = {\n  semantic: ${JSON.stringify(assignments, null, 2)},\n  tokens: ${JSON.stringify(theme.tokens, null, 2)},\n} as const;\n`;
}
