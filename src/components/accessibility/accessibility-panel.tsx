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
          <div className="text-sm font-semibold text-white">Accessibility score</div>
          <p className="text-sm text-slate-400">WCAG-based contrast checks with readability heuristics.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-right">
          <div className="text-2xl font-semibold text-white">{report.score}</div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{report.rating}</div>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-2xl border border-white/8 bg-slate-950/50 px-3 py-2 text-sm text-slate-300">
        <Icon className="size-4 text-cyan-300" />
        <span>{report.issueCount ? `${report.issueCount} issues remain.` : "All tracked pairs pass."}</span>
      </div>

      <div className="space-y-2">
        {report.pairs.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm"
          >
            <span className="text-slate-300">{item.label}</span>
            <span className={item.passes ? "text-emerald-300" : "text-amber-300"}>
              {item.contrast.toFixed(2)}:1
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-start gap-2 text-sm text-slate-400">
        <Sparkles className="mt-0.5 size-4 text-cyan-300" />
        <p>{report.summary.join(" ")}</p>
      </div>
    </Card>
  );
}
