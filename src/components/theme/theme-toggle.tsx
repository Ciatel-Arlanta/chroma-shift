"use client";

import { Moon, SunMedium } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

type ThemeMode = "light" | "dark";

function subscribe() {
  return () => {};
}

export function ThemeToggle({ className }: { className?: string }) {
  const mounted = React.useSyncExternalStore(subscribe, () => true, () => false);
  const [, forceUpdate] = React.useReducer((count: number) => count + 1, 0);
  const theme: ThemeMode =
    mounted && typeof document !== "undefined" && document.documentElement.dataset.theme === "dark"
      ? "dark"
      : "light";

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("chroma-shift-theme", nextTheme);
    forceUpdate();
  }

  return (
    <button
      type="button"
      aria-label={mounted ? `Switch to ${theme === "dark" ? "light" : "dark"} mode` : "Toggle theme"}
      onClick={toggleTheme}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition",
        "border-[var(--line)] bg-[var(--panel-elevated)] text-[var(--text-primary)] hover:bg-[var(--panel-soft)]",
        className,
      )}
    >
      <span className="inline-flex size-8 items-center justify-center rounded-full bg-[var(--panel-soft)]">
        {!mounted ? <Moon className="size-4" /> : theme === "dark" ? <SunMedium className="size-4" /> : <Moon className="size-4" />}
      </span>
      <span className="hidden sm:inline">
        {!mounted ? "Theme" : theme === "dark" ? "Light mode" : "Dark mode"}
      </span>
    </button>
  );
}
