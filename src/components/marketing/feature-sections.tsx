import { ArrowRight, Download, Layers3, Sparkles, Wand2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: Layers3,
    title: "Semantic role detection",
    copy: "Backgrounds, text, surfaces, accents, and borders are inferred from the source instead of flattened into a single palette swap.",
  },
  {
    icon: Wand2,
    title: "Deterministic remapping",
    copy: "Themes are generated with heuristics, perceptual color transforms, and contrast rules. No expensive model inference required.",
  },
  {
    icon: Download,
    title: "Shareable outputs",
    copy: "Download a remapped PNG or SVG immediately for feedback, then export global.css, JSON tokens, or Tailwind snippets later.",
  },
];

const steps = [
  "Upload a product screenshot or SVG export.",
  "Inspect extracted palette clusters and inferred roles.",
  "Switch between theme presets and compare with the live slider.",
  "Download the generated concept or copy implementation-ready theme tokens.",
];

export function FeatureSections() {
  return (
    <section className="px-6 pb-20 sm:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_420px]">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.26em] text-[var(--text-soft)]">What it does</p>
            <h2 className="max-w-3xl text-4xl font-semibold tracking-[-0.05em] text-[var(--text-primary)] sm:text-5xl">
              Built for fast theme exploration, critique loops, and demo-day impact.
            </h2>
            <p className="max-w-2xl text-lg leading-8 text-[var(--text-muted)]">
              The workspace is separate now, so the landing page can sell the product clearly while the try flow stays focused on actual remapping.
            </p>
          </div>
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2 text-[var(--text-primary)]">
              <Sparkles className="size-4 text-[var(--accent-strong)]" />
              <span className="text-sm font-semibold">How to use ChromaShift</span>
            </div>
            <ol className="space-y-3 text-sm leading-6 text-[var(--text-muted)]">
              {steps.map((step, index) => (
                <li
                  key={step}
                  className="rounded-[20px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3"
                >
                  <span className="mr-3 font-mono text-[var(--text-soft)]">0{index + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, copy }) => (
            <Card key={title} className="p-6">
              <div className="mb-5 inline-flex size-12 items-center justify-center rounded-[18px] border border-[var(--line)] bg-[var(--panel-soft)] text-[var(--accent-strong)]">
                <Icon className="size-5" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-[var(--text-primary)]">{title}</h3>
              <p className="text-sm leading-7 text-[var(--text-muted)]">{copy}</p>
            </Card>
          ))}
        </div>

        <Card className="flex flex-col items-start justify-between gap-5 p-6 lg:flex-row lg:items-center">
          <div>
            <p className="mb-2 text-sm uppercase tracking-[0.24em] text-[var(--text-soft)]">Workspace</p>
            <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
              Ready to test a screenshot?
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--text-muted)]">
              Open the focused remapping interface with upload, live preview, accessibility scoring, and download actions.
            </p>
          </div>
          <Link href="/try">
            <Button className="gap-2 px-5 py-3">
              Open workspace
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </Card>
      </div>
    </section>
  );
}
