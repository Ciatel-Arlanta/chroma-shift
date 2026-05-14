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
          <div className="text-sm font-semibold text-white">Palette extraction</div>
          <p className="text-sm text-slate-400">Dominant colors merged by perceptual similarity.</p>
        </div>
      </div>

      <div className="grid gap-3">
        {colors.slice(0, 8).map((color, index) => {
          const role = assignments.find((assignment) => assignment.color === color.hex);
          return (
            <motion.div
              key={`${color.hex}-${index}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="rounded-2xl border border-white/8 bg-white/[0.03] p-3"
            >
              <div className="flex items-center gap-3">
                <div
                  className="size-10 rounded-xl border border-white/10"
                  style={{ backgroundColor: color.hex }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-mono text-xs text-white">{color.hex}</span>
                    <span className="text-xs text-slate-400">
                      {Math.round(color.population * 100)}%
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                    <span>{role?.role ?? "unassigned"}</span>
                    <span>•</span>
                    <span>{role ? `${Math.round(role.confidence * 100)}%` : "cluster"}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}
