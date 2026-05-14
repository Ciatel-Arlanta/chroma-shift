"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition duration-200 disabled:pointer-events-none disabled:opacity-40",
        variant === "primary" &&
          "border border-[var(--line)] bg-[linear-gradient(135deg,#f7f1d5_0%,#b8ffe8_38%,#84d9ff_100%)] text-slate-950 shadow-[0_10px_35px_rgba(64,192,255,0.26)] hover:-translate-y-0.5 hover:shadow-[0_16px_50px_rgba(64,192,255,0.32)]",
        variant === "secondary" &&
          "border border-[var(--line)] bg-[var(--panel-elevated)] text-[var(--text-primary)] hover:bg-[var(--panel-soft)]",
        variant === "ghost" && "text-[var(--text-muted)] hover:bg-[var(--panel-soft)] hover:text-[var(--text-primary)]",
        className,
      )}
      {...props}
    />
  );
}
