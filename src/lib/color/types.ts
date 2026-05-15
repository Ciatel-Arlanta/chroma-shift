export type SourceKind = "raster" | "svg";

export type ThemePreset =
  | "dark"
  | "modern-saas"
  | "pastel"
  | "cyberpunk"
  | "monochrome"
  | "accessibility"
  | "custom";

export interface CustomPalette {
  colors: string[]; // normalised hex values (3–10 colors)
  label: string;    // user-visible name
}

export type SemanticRole =
  | "background"
  | "surface"
  | "surfaceMuted"
  | "textPrimary"
  | "textSecondary"
  | "accent"
  | "accentStrong"
  | "border";

export interface OklchColor {
  l: number;
  c: number;
  h: number | null;
}

export interface ExtractedColor {
  hex: string;
  oklch: OklchColor;
  population: number;
  source: SourceKind;
  usages?: Array<"fill" | "stroke">;
}

export interface SemanticAssignment {
  role: SemanticRole;
  color: string;
  confidence: number;
  alternatives: string[];
}

export interface ThemeTokens {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  border: string;
  input: string;
  ring: string;
}

export interface AccessibilityPairReport {
  label: string;
  contrast: number;
  target: number;
  passes: boolean;
}

export interface AccessibilityReport {
  score: number;
  rating: "Improved" | "Similar" | "Needs review";
  issueCount: number;
  pairs: AccessibilityPairReport[];
  summary: string[];
}

export interface ThemeAnalysisResult {
  sourceKind: SourceKind;
  extractedColors: ExtractedColor[];
  semanticAssignments: SemanticAssignment[];
  originalAccessibilityScore: number;
}

export interface GeneratedTheme {
  preset: ThemePreset;
  tokens: ThemeTokens;
  transformedPreviewUrl?: string;
  transformedSvgText?: string;
  accessibilityScore: number;
  improvementSummary: string[];
  accessibilityReport: AccessibilityReport;
}
