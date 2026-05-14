import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-6 pt-10 pb-18 sm:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_420px] lg:items-end">
          <div className="flex flex-col gap-6">
            {/* <Badge className="w-fit border-[var(--line)] bg-[var(--panel-soft)] text-[var(--text-primary)]">
              Deterministic UI Theme Remapper
            </Badge> */}
            <div className="space-y-5">
              <h1 className="max-w-5xl text-5xl font-semibold tracking-[-0.065em] text-[var(--text-primary)] sm:text-6xl lg:text-[88px] lg:leading-[0.94]">
                Turn any product screenshot into a polished, shareable theme concept.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[var(--text-muted)] sm:text-xl">
                ChromaShift analyzes screenshots and SVGs, infers semantic color roles,
                then remaps the interface into usable themes you can preview, export, and circulate for feedback immediately.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/try">
                <Button className="gap-2 px-5 py-3 text-sm">
                  Try the workspace
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-2 text-sm text-[var(--text-muted)]">
                <Sparkles className="size-4 text-[var(--accent-strong)]" />
                Dark mode, SaaS, pastel, cyberpunk, monochrome, accessibility
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[32px] border border-[var(--line)] bg-[var(--panel)] p-5 shadow-[0_30px_80px_var(--shadow-glow)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-[var(--text-primary)]">Demo signal</div>
                <div className="text-sm text-[var(--text-muted)]">Optimized for screenshot sharing and judge demos.</div>
              </div>
              <Badge className="border-[var(--line)] bg-[var(--panel-soft)] text-[var(--text-primary)]">Instant output</Badge>
            </div>
            <div className="space-y-3">
              {[
                ["Upload a screenshot", "Read the existing hierarchy and repeated UI colors."],
                ["Pick a preset", "Generate a coherent alternative theme without flattening emphasis."],
                ["Download PNG", "Share the remapped concept without touching your codebase."],
              ].map(([title, copy], index) => (
                <div
                  key={title}
                  className="rounded-[24px] border border-[var(--line)] bg-[var(--panel-soft)] p-4"
                >
                  <div className="mb-2 text-[11px] uppercase tracking-[0.24em] text-[var(--text-soft)]">
                    0{index + 1}
                  </div>
                  <div className="text-base font-semibold text-[var(--text-primary)]">{title}</div>
                  <div className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{copy}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["Intelligent remapping", "Maps semantic roles instead of doing blunt hue swaps."],
            ["Client-side processing", "Fast analysis with no paid AI APIs or backend inference."],
            ["Shareable exports", "Download PNG/SVG outputs and copy theme payloads for implementation later."],
          ].map(([title, copy]) => (
            <div
              key={title}
              className="rounded-[26px] border border-[var(--line)] bg-[var(--panel)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
            >
              <div className="mb-2 text-sm font-semibold text-[var(--text-primary)]">{title}</div>
              <p className="text-sm leading-6 text-[var(--text-muted)]">{copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
