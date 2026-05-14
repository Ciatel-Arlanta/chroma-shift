import Link from "next/link";

import { ThemeToggle } from "@/components/theme/theme-toggle";

export function SiteHeader() {
  return (
    <header className="px-6 pt-6 sm:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-[1360px] items-center justify-between rounded-full border border-[var(--line)] bg-[var(--panel-elevated)] px-4 py-3 shadow-[0_18px_60px_rgba(4,10,22,0.12)] backdrop-blur-xl">
        <Link href="/" className="text-lg font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
          ChromaShift
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/try"
            className="rounded-full border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-2 text-sm text-[var(--text-primary)] transition hover:bg-[var(--panel-elevated)]"
          >
            Try it
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
