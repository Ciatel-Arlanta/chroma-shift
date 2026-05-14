"use client";

import { Download, MoveHorizontal } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type BeforeAfterPreviewProps = {
  originalUrl?: string;
  transformedUrl?: string;
  originalSvg?: string;
  transformedSvg?: string;
  mode: "split" | "original" | "remapped";
  onModeChange: (mode: "split" | "original" | "remapped") => void;
  onDownload?: () => void;
  downloadLabel?: string;
};

function SvgLayer({ svgText }: { svgText: string }) {
  return <div className="size-full [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svgText }} />;
}

export function BeforeAfterPreview({
  originalUrl,
  transformedUrl,
  originalSvg,
  transformedSvg,
  mode,
  onModeChange,
  onDownload,
  downloadLabel,
}: BeforeAfterPreviewProps) {
  const [position, setPosition] = React.useState(56);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = React.useState(false);

  function updateFromClientX(clientX: number) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    const percentage = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.max(0, Math.min(100, percentage)));
  }

  React.useEffect(() => {
    if (!dragging) {
      return;
    }

    const handleMove = (event: PointerEvent) => updateFromClientX(event.clientX);
    const handleUp = () => setDragging(false);
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [dragging]);

  const originalLayer = originalSvg ? (
    <SvgLayer svgText={originalSvg} />
  ) : originalUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={originalUrl} alt="Original upload" className="size-full object-contain" />
  ) : null;

  const transformedLayer = transformedSvg ? (
    <SvgLayer svgText={transformedSvg} />
  ) : transformedUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={transformedUrl} alt="Remapped preview" className="size-full object-contain" />
  ) : null;

  return (
    <Card className="overflow-hidden p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">Live preview</div>
          <p className="text-sm text-slate-400">
            Drag the divider to compare the source and remapped theme, then download the generated asset directly.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-2 rounded-full border border-white/10 bg-white/5 p-1">
            {(["split", "original", "remapped"] as const).map((value) => (
              <button
                key={value}
                onClick={() => onModeChange(value)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm capitalize transition",
                  mode === value ? "bg-white text-slate-950" : "text-slate-300",
                )}
              >
                {value}
              </button>
            ))}
          </div>
          {onDownload ? (
            <Button className="gap-2 px-4 py-2" onClick={onDownload}>
              <Download className="size-4" />
              {downloadLabel ?? "Download"}
            </Button>
          ) : null}
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative min-h-[380px] overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.12),transparent_50%),linear-gradient(180deg,rgba(15,23,42,0.9),rgba(2,6,18,0.95))]"
      >
        <div className="absolute inset-0 p-4">
          <div className="grid size-full place-items-center rounded-[22px] border border-white/8 bg-slate-950/65">
            {!originalLayer || !transformedLayer ? (
              <div className="max-w-sm text-center text-sm leading-6 text-slate-400">
                Upload a UI screenshot or SVG to generate a live side-by-side preview.
              </div>
            ) : (
              <div className="relative size-full overflow-hidden rounded-[18px]">
                {(mode === "split" || mode === "original") && (
                  <div className="absolute inset-0">{originalLayer}</div>
                )}
                {(mode === "split" || mode === "remapped") && (
                  <div
                    className={cn("absolute inset-0", mode === "split" ? "overflow-hidden" : "")}
                    style={mode === "split" ? { clipPath: `inset(0 ${100 - position}% 0 0)` } : undefined}
                  >
                    {transformedLayer}
                  </div>
                )}
                {mode === "split" ? (
                  <>
                    <div className="absolute left-5 top-5 z-10 rounded-full border border-white/10 bg-slate-950/70 px-3 py-1.5 text-[11px] uppercase tracking-[0.24em] text-slate-300">
                      Original
                    </div>
                    <div className="absolute right-5 top-5 z-10 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.24em] text-cyan-100">
                      Remapped
                    </div>
                    <div
                      className="absolute top-0 bottom-0 w-px bg-white/70"
                      style={{ left: `calc(${position}% - 0.5px)` }}
                    />
                    <button
                      onPointerDown={(event) => {
                        setDragging(true);
                        updateFromClientX(event.clientX);
                      }}
                      className="absolute top-1/2 z-10 -translate-y-1/2 -translate-x-1/2 rounded-full border border-cyan-200/40 bg-slate-950/80 p-2 shadow-[0_0_35px_rgba(102,231,255,0.2)]"
                      style={{ left: `${position}%` }}
                      aria-label="Adjust preview split"
                    >
                      <MoveHorizontal className="size-4 text-cyan-100" />
                    </button>
                  </>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
