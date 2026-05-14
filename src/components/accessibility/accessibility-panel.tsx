import { CheckCircle2, CircleAlert, Sparkles } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { AccessibilityReport } from "@/lib/color/types";

type AccessibilityPanelProps = {
  report: AccessibilityReport;
};

export function AccessibilityPanel({ report }: AccessibilityPanelProps) {
  const Icon = report.rating === "Needs review" ? CircleAlert : CheckCircle2;

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-[var(--text-primary)]">Accessibility score</div>
          <p className="text-sm text-[var(--text-muted)]">WCAG-based contrast checks with readability heuristics.</p>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel-soft)] px-3 py-2 text-right">
          <div className="text-2xl font-semibold text-[var(--text-primary)]">{report.score}</div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-soft)]">{report.rating}</div>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-2xl border border-[var(--line)] bg-[var(--panel-soft)] px-3 py-2 text-sm text-[var(--text-muted)]">
        <Icon className="size-4 text-[var(--accent-strong)]" />
        <span>{report.issueCount ? `${report.issueCount} issues remain.` : "All tracked pairs pass."}</span>
      </div>

      <div className="space-y-2">
        {report.pairs.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-2xl border border-[var(--line)] bg-[var(--panel-soft)] px-3 py-2 text-sm"
          >
            <span className="text-[var(--text-muted)]">{item.label}</span>
            <span className={item.passes ? "text-emerald-300" : "text-amber-300"}>
              {item.contrast.toFixed(2)}:1
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-start gap-2 text-sm text-[var(--text-muted)]">
        <Sparkles className="mt-0.5 size-4 text-[var(--accent-strong)]" />
        <p>{report.summary.join(" ")}</p>
      </div>
    </Card>
  );
}
