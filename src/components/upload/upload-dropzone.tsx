"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ImagePlus, UploadCloud } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type UploadDropzoneProps = {
  onFileSelect: (file: File) => void;
  onTrySample: () => void;
  currentFileName?: string;
  error?: string | null;
  isBusy?: boolean;
};

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

export function UploadDropzone({
  onFileSelect,
  onTrySample,
  currentFileName,
  error,
  isBusy,
}: UploadDropzoneProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [isActive, setIsActive] = React.useState(false);

  function handleFile(file?: File | null) {
    if (!file) {
      return;
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      onFileSelect(new File([], "", { type: "invalid/type" }));
      return;
    }

    onFileSelect(file);
  }

  return (
    <Card className="overflow-hidden p-2">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsActive(true);
        }}
        onDragLeave={() => setIsActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsActive(false);
          handleFile(event.dataTransfer.files?.[0] ?? null);
        }}
        className={cn(
          "relative rounded-[28px] border border-dashed px-6 py-8 transition duration-200",
          isActive
            ? "border-[var(--accent-strong)] bg-[color:color-mix(in_srgb,var(--accent-strong)_10%,transparent)] shadow-[inset_0_0_0_1px_rgba(103,232,249,0.18)]"
            : "border-[var(--line)] bg-[var(--panel-soft)]",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.webp,.svg"
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
        />
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl space-y-3">
            <div className="inline-flex size-14 items-center justify-center rounded-[18px] border border-[var(--line)] bg-[var(--panel-elevated)] text-[var(--accent-strong)] shadow-[0_0_30px_rgba(103,232,249,0.12)]">
              <UploadCloud className="size-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
                Upload a UI screenshot or SVG
              </h2>
              <p className="text-sm leading-6 text-[var(--text-muted)]">
                Drag in a dashboard, landing page, onboarding flow, or exported design.
                ChromaShift extracts palette structure, infers roles, and previews remapped themes instantly.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-[var(--text-soft)]">
              <span>Accepts PNG, JPG, WebP, SVG</span>
              <span>&bull;</span>
              <span>Client-side analysis</span>
              <span>&bull;</span>
              <span>Best with product UI screenshots</span>
              <span>&bull;</span>
              <span>Download-ready previews</span>
            </div>
          </div>

          <div className="flex flex-col items-stretch gap-3 sm:flex-row lg:flex-col">
            <Button
              className="w-full gap-2 sm:w-auto"
              onClick={() => inputRef.current?.click()}
              disabled={isBusy}
            >
              <ImagePlus className="size-4" />
              {isBusy ? "Analyzing..." : "Choose file"}
            </Button>
            <Button variant="secondary" className="w-full sm:w-auto" onClick={onTrySample}>
              Try sample dashboard
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {(currentFileName || error) && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="mt-5 flex flex-col gap-2 rounded-2xl border border-[var(--line)] bg-[var(--panel-elevated)] px-4 py-3 text-sm"
            >
              {currentFileName ? (
                <div className="text-[var(--text-muted)]">
                  Active source: <span className="font-medium text-[var(--text-primary)]">{currentFileName}</span>
                </div>
              ) : null}
              {error ? <div className="text-rose-500">{error}</div> : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
