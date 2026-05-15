"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Palette, Sparkles, X, ClipboardPaste } from "lucide-react";
import * as React from "react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { parsePaletteInput, type ParsedPalette } from "@/lib/color/parse-palette";
import type { CustomPalette } from "@/lib/color/types";

type CustomPaletteInputProps = {
  onApply: (palette: CustomPalette) => void;
  isActive: boolean;
};

export function CustomPaletteInput({ onApply, isActive }: CustomPaletteInputProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [rawText, setRawText] = React.useState("");
  const [parsed, setParsed] = React.useState<ParsedPalette | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  React.useEffect(() => {
    if (!rawText.trim()) {
      setParsed(null);
      setError(null);
      return;
    }

    const result = parsePaletteInput(rawText);
    if (result) {
      setParsed(result);
      setError(null);
    } else {
      setParsed(null);
      setError("Could not detect any colors. Paste hex codes, a JSON palette, or a coolors.co URL.");
    }
  }, [rawText]);

  function handleApply() {
    if (!parsed || parsed.colors.length < 2) return;

    onApply({
      colors: parsed.colors,
      label: `Custom (${parsed.colors.length} colors)`,
    });
  }

  async function handlePasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setRawText(text);
      }
    } catch {
      // clipboard permission denied — user can paste manually
    }
  }

  return (
    <Card className="overflow-hidden p-5">
      {/* Header — always visible */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            requestAnimationFrame(() => textareaRef.current?.focus());
          }
        }}
        className={cn(
          "flex w-full items-center gap-3 text-left transition",
          isActive && !isOpen && "opacity-90",
        )}
      >
        <div
          className={cn(
            "flex size-9 items-center justify-center rounded-xl border transition",
            isActive
              ? "border-[var(--accent-strong)]/40 bg-[color:color-mix(in_srgb,var(--accent-strong)_15%,transparent)] text-[var(--accent-strong)]"
              : "border-[var(--line)] bg-[var(--panel-soft)] text-[var(--text-muted)]",
          )}
        >
          <Palette className="size-4" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-[var(--text-primary)]">Custom palette</div>
          <p className="text-sm text-[var(--text-muted)]">
            Paste colors from coolors.co, JSON, CSV, or any format
          </p>
        </div>
        <div
          className={cn(
            "rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.22em]",
            isActive
              ? "bg-[color:color-mix(in_srgb,var(--accent-strong)_15%,transparent)] text-[var(--accent-strong)]"
              : "bg-[var(--panel-elevated)] text-[var(--text-soft)]",
          )}
        >
          {isActive ? "Active" : isOpen ? "Open" : "Custom"}
        </div>
      </button>

      {/* Expandable body */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-3">
              {/* Textarea */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`Paste any palette format:\n• f9e7e7, ded6d6, d2cbcb\n• #f9e7e7, #ded6d6\n• ["f9e7e7","ded6d6"]\n• {"Name":"f9e7e7",...}\n• coolors.co/f9e7e7-ded6d6-...`}
                  spellCheck={false}
                  rows={4}
                  className={cn(
                    "w-full resize-none rounded-2xl border bg-[var(--panel-soft)] p-3 pr-10 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-soft)] focus:outline-none focus:ring-2 transition font-mono leading-relaxed",
                    error
                      ? "border-red-500/40 focus:ring-red-500/30"
                      : parsed
                        ? "border-[var(--accent-strong)]/40 focus:ring-[var(--accent-strong)]/30"
                        : "border-[var(--line)] focus:ring-[var(--accent-strong)]/30",
                  )}
                />
                {rawText && (
                  <button
                    onClick={() => setRawText("")}
                    className="absolute top-3 right-3 rounded-lg p-1 text-[var(--text-soft)] hover:text-[var(--text-primary)] transition"
                    aria-label="Clear input"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Actions row */}
              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  className="gap-2 text-sm text-[var(--text-muted)]"
                  onClick={handlePasteFromClipboard}
                >
                  <ClipboardPaste className="size-3.5" />
                  Paste from clipboard
                </Button>

                {parsed && (
                  <div className="text-xs text-[var(--text-soft)]">
                    {parsed.format} · {parsed.colors.length} colors
                  </div>
                )}
              </div>

              {/* Error message */}
              {error && rawText.trim() && (
                <p className="text-xs text-red-400">{error}</p>
              )}

              {/* Swatch preview */}
              <AnimatePresence>
                {parsed && parsed.colors.length >= 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="space-y-3"
                  >
                    {/* Color swatches */}
                    <div className="flex gap-1.5 rounded-2xl border border-[var(--line)] bg-[var(--panel-elevated)] p-2">
                      {parsed.colors.map((hex, i) => (
                        <div key={`${hex}-${i}`} className="group relative flex-1">
                          <div
                            className="aspect-[3/4] w-full rounded-xl border border-white/10 transition-transform group-hover:scale-105"
                            style={{ backgroundColor: hex }}
                          />
                          <div className="mt-1 text-center text-[9px] font-mono uppercase text-[var(--text-soft)] opacity-0 transition-opacity group-hover:opacity-100">
                            {hex.replace("#", "")}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Apply button */}
                    <Button
                      className="w-full gap-2"
                      onClick={handleApply}
                    >
                      <Sparkles className="size-4" />
                      Apply custom palette
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
