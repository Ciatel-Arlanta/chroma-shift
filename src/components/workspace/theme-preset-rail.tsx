"use client";

import { motion } from "framer-motion";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ThemePreset } from "@/lib/color/types";

type ThemePresetRailProps = {
  activePreset: ThemePreset;
  onSelect: (preset: ThemePreset) => void;
};

const PRESETS: Array<{ id: ThemePreset; title: string; description: string }> = [
  { id: "dark", title: "Dark", description: "Deep neutral dark mode with preserved accent energy." },
  { id: "modern-saas", title: "Modern SaaS", description: "Cool, polished, judge-friendly product aesthetic." },
  { id: "pastel", title: "Pastel", description: "Soft elevated tones without losing hierarchy." },
  { id: "cyberpunk", title: "Cyberpunk", description: "Neon accents constrained to the right roles." },
  { id: "monochrome", title: "Monochrome", description: "Minimalist grayscale with clear functional depth." },
  { id: "accessibility", title: "Accessibility", description: "Contrast-first repair pass for usability." },
];

export function ThemePresetRail({ activePreset, onSelect }: ThemePresetRailProps) {
  return (
    <Card className="p-5">
      <div className="mb-4">
        <div className="text-sm font-semibold text-white">Preset remappers</div>
        <p className="text-sm text-slate-400">Each preset applies semantic remapping instead of blind recoloring.</p>
      </div>

      <div className="grid gap-3">
        {PRESETS.map((preset) => {
          const isActive = preset.id === activePreset;
          return (
            <button
              key={preset.id}
              onClick={() => onSelect(preset.id)}
              className={cn(
                "group relative overflow-hidden rounded-[24px] border p-4 text-left transition",
                isActive
                  ? "border-cyan-300/50 bg-[linear-gradient(180deg,rgba(34,211,238,0.12),rgba(34,211,238,0.05))]"
                  : "border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] hover:border-white/14 hover:bg-white/[0.06]",
              )}
            >
              {isActive ? (
                <motion.div
                  layoutId="preset-highlight"
                  className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(103,232,249,0.12),transparent_70%)]"
                />
              ) : null}
              <div className="relative">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-white">{preset.title}</div>
                  <div
                    className={cn(
                      "rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.22em]",
                      isActive ? "bg-white/12 text-cyan-100" : "bg-white/8 text-slate-500",
                    )}
                  >
                    {isActive ? "Active" : "Preset"}
                  </div>
                </div>
                <div className="text-sm leading-6 text-slate-400">{preset.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
