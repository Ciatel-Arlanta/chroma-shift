"use client";

import { Check, Copy, Download } from "lucide-react";
import * as React from "react";

import { Card } from "@/components/ui/card";
import type { GeneratedTheme } from "@/lib/color/types";

type ExportPanelProps = {
  cssValue: string;
  jsonValue: string;
  tailwindValue: string;
  theme: GeneratedTheme;
  sourceName: string;
};

type ExportTab = "css" | "json" | "tailwind";

export function ExportPanel({
  cssValue,
  jsonValue,
  tailwindValue,
  theme,
  sourceName,
}: ExportPanelProps) {
  const [tab, setTab] = React.useState<ExportTab>("css");
  const [copied, setCopied] = React.useState<ExportTab | null>(null);

  const textMap = {
    css: cssValue,
    json: jsonValue,
    tailwind: tailwindValue,
  } satisfies Record<ExportTab, string>;

  async function copyCurrent(currentTab: ExportTab) {
    await navigator.clipboard.writeText(textMap[currentTab]);
    setCopied(currentTab);
    window.setTimeout(() => setCopied(null), 1500);
  }

  function downloadBlob(contents: string, filename: string, type: string) {
    const blob = new Blob([contents], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function downloadAsset() {
    if (theme.transformedSvgText) {
      downloadBlob(theme.transformedSvgText, `${sourceName}-${theme.preset}.svg`, "image/svg+xml");
      return;
    }

    if (theme.transformedPreviewUrl) {
      const link = document.createElement("a");
      link.href = theme.transformedPreviewUrl;
      link.download = `${sourceName}-${theme.preset}.png`;
      link.click();
    }
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-[var(--text-primary)]">Export</div>
          <p className="text-sm text-[var(--text-muted)]">Copy production-ready theme payloads or download the remapped asset.</p>
        </div>
        <button
          onClick={downloadAsset}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--panel-soft)] px-3 py-2 text-sm text-[var(--text-primary)] transition hover:bg-[var(--panel-elevated)]"
        >
          <Download className="size-4" />
          {theme.transformedSvgText ? "Download SVG" : "Download PNG"}
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {(["css", "json", "tailwind"] as const).map((value) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`rounded-full px-3 py-1.5 text-sm transition ${tab === value
              ? "bg-[var(--text-primary)] text-[var(--background)]"
              : "border border-[var(--line)] bg-[var(--panel-soft)] text-[var(--text-muted)]"
              }`}
          >
            {value === "css" ? "global.css" : value}
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden rounded-[22px] border border-[var(--line)] bg-[var(--panel-soft)]">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[var(--text-soft)]">
          <span>{tab === "css" ? "global.css" : tab}</span>
          <button
            onClick={() => void copyCurrent(tab)}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--panel-elevated)] px-3 py-1 text-[11px] font-medium tracking-normal text-[var(--text-primary)] transition hover:bg-[var(--panel)]"
          >
            {copied === tab ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied === tab ? "Copied" : "Copy"}
          </button>
        </div>
        <pre className="max-h-150 flex overflow-auto p-4 text-xs leading-6 text-[var(--text-primary)]">
          <code>{textMap[tab]}</code>
        </pre>
      </div>
    </Card>
  );
}
