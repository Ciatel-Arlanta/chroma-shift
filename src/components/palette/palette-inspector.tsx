import { motion } from "framer-motion";

import { Card } from "@/components/ui/card";
import type { ExtractedColor, SemanticAssignment } from "@/lib/color/types";

type PaletteInspectorProps = {
  colors: ExtractedColor[];
  assignments: SemanticAssignment[];
};

export function PaletteInspector({ colors, assignments }: PaletteInspectorProps) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-[var(--text-primary)]">Palette extraction</div>
          <p className="text-sm text-[var(--text-muted)]">Dominant colors merged by perceptual similarity.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {colors.slice(0, 8).map((color, index) => {
          const role = assignments.find((assignment) => assignment.color === color.hex);
          return (
            <motion.div
              key={`${color.hex}-${index}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--panel-soft)] transition hover:border-[var(--accent-strong)]/30 hover:bg-[var(--panel-elevated)]"
            >
              <div
                className="h-16 w-full border-b border-[var(--line)]"
                style={{ backgroundColor: color.hex }}
              />
              <div className="p-3">
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate font-mono text-[11px] font-medium text-[var(--text-primary)]">
                    {color.hex}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {Math.round(color.population * 100)}%
                  </span>
                </div>
                <div className="mt-1 truncate text-[9px] uppercase tracking-[0.15em] text-[var(--text-soft)]">
                  {role?.role ?? "unassigned"}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}
