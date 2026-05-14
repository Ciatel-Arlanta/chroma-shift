import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { SiteHeader } from "@/components/marketing/site-header";
import { AnalysisWorkspace } from "@/components/workspace/analysis-workspace";

export default function TryPage() {
  return (
    <main className="min-h-screen text-[var(--text-primary)]">
      <SiteHeader />
      <section className="px-6 pt-10 pb-4 sm:px-8 lg:px-12">
        <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-4">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-2 text-sm text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
          >
            <ArrowLeft className="size-4" />
            Back to landing page
          </Link>
          <div className="max-w-3xl">
            <p className="mb-3 text-sm uppercase tracking-[0.24em] text-[var(--text-soft)]">Workspace</p>
            <h1 className="text-4xl font-semibold tracking-[-0.05em] text-[var(--text-primary)] sm:text-5xl">
              Upload, remap, compare, and download.
            </h1>
            <p className="mt-4 text-lg leading-8 text-[var(--text-muted)]">
              This page keeps only the interactive tool so the flow stays focused once a user clicks through from the landing page.
            </p>
          </div>
        </div>
      </section>
      <AnalysisWorkspace />
    </main>
  );
}
