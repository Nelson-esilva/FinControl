"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export const inputClass =
  "h-11 w-full rounded-[10px] border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"

export function Field({
  label,
  children,
  hint,
  className,
}: {
  label: string
  children: ReactNode
  hint?: string
  className?: string
}) {
  return (
    <label className={cn("flex min-w-0 flex-col gap-1.5 text-[13px] font-medium text-muted-foreground", className)}>
      {label}
      {children}
      {hint && <span className="text-xs font-normal">{hint}</span>}
    </label>
  )
}

/** Aceita "1.234,56", "1234,56" ou "1234.56". */
export function parseMoney(input: string): number {
  const clean = input.replace(/[^\d,.-]/g, "")
  if (!clean) return NaN
  const normalized = clean.includes(",") ? clean.replace(/\./g, "").replace(",", ".") : clean
  return Math.round(Number(normalized) * 100) / 100
}

export function moneyInputValue(n: number | undefined | null): string {
  if (n == null || !Number.isFinite(n)) return ""
  return n.toFixed(2).replace(".", ",")
}

export function parseTags(input: string): string[] {
  return input
    .split(/[,\s]+/)
    .map((t) => t.replace(/^#/, "").trim())
    .filter(Boolean)
}
