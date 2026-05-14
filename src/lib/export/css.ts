import { formatHex } from "culori";

import type { ThemePreset, ThemeTokens } from "@/lib/color/types";

function commentLine(label: string, value: string) {
  const hex = formatHex(value);
  return hex ? `  /* ${label}: ${hex} */\n` : "";
}

export function buildGlobalCss(tokens: ThemeTokens, preset: ThemePreset) {
  return `/* ChromaShift export: ${preset} */\n:root {\n${commentLine("background", tokens.background)}  --background: ${tokens.background};\n  --foreground: ${tokens.foreground};\n  --card: ${tokens.card};\n  --card-foreground: ${tokens.cardForeground};\n  --popover: ${tokens.popover};\n  --popover-foreground: ${tokens.popoverForeground};\n  --primary: ${tokens.primary};\n  --primary-foreground: ${tokens.primaryForeground};\n  --secondary: ${tokens.secondary};\n  --secondary-foreground: ${tokens.secondaryForeground};\n  --muted: ${tokens.muted};\n  --muted-foreground: ${tokens.mutedForeground};\n  --accent: ${tokens.accent};\n  --accent-foreground: ${tokens.accentForeground};\n  --border: ${tokens.border};\n  --input: ${tokens.input};\n  --ring: ${tokens.ring};\n}\n\n.dark {\n  --background: ${tokens.background};\n  --foreground: ${tokens.foreground};\n  --card: ${tokens.card};\n  --card-foreground: ${tokens.cardForeground};\n  --popover: ${tokens.popover};\n  --popover-foreground: ${tokens.popoverForeground};\n  --primary: ${tokens.primary};\n  --primary-foreground: ${tokens.primaryForeground};\n  --secondary: ${tokens.secondary};\n  --secondary-foreground: ${tokens.secondaryForeground};\n  --muted: ${tokens.muted};\n  --muted-foreground: ${tokens.mutedForeground};\n  --accent: ${tokens.accent};\n  --accent-foreground: ${tokens.accentForeground};\n  --border: ${tokens.border};\n  --input: ${tokens.input};\n  --ring: ${tokens.ring};\n}\n`;
}
