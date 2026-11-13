"use client"

import type { ReactNode } from "react"
import { ChevronLeft, ChevronRight, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { initials, money, monthTitle, shiftMonth } from "@/lib/finance/format"

export function PageHeader({ title, children }: { title: ReactNode; children?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      {typeof title === "string" ? (
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      ) : (
        title
      )}
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  )
}

export function MonthSwitcher({
  month,
  onChange,
  prefix,
}: {
  month: string
  onChange: (m: string) => void
  prefix?: string
}) {
  return (
    <div className="flex items-center gap-2">
      <IconButton label="Mês anterior" onClick={() => onChange(shiftMonth(month, -1))}>
        <ChevronLeft className="h-4 w-4" />
      </IconButton>
      <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
        {prefix ? `${prefix} · ${monthTitle(month).split(" ")[0]}` : monthTitle(month)}
      </h1>
      <IconButton label="Próximo mês" onClick={() => onChange(shiftMonth(month, 1))}>
        <ChevronRight className="h-4 w-4" />
      </IconButton>
    </div>
  )
}

export function IconButton({
  label,
  onClick,
  children,
  className,
}: {
  label: string
  onClick?: () => void
  children: ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "inline-flex h-11 w-11 items-center justify-center rounded-xl border bg-card text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {children}
    </button>
  )
}

export function Panel({ className, children, as: Tag = "section", ...rest }: {
  className?: string
  children: ReactNode
  as?: "section" | "div" | "aside"
  "aria-label"?: string
}) {
  return (
    <Tag className={cn("rounded-2xl border bg-card p-5 sm:p-6", className)} {...rest}>
      {children}
    </Tag>
  )
}

export function PanelTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-base font-semibold">{children}</h2>
      {action}
    </div>
  )
}

export function StatTile({
  label,
  value,
  hint,
  tone = "muted",
  big,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  tone?: "muted" | "income" | "expense" | "warning"
  big?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
      <span className={cn("num font-semibold tracking-tight", big ? "text-2xl" : "text-lg")}>{value}</span>
      {hint && (
        <span
          className={cn(
            "text-[13px]",
            tone === "income" && "text-income",
            tone === "expense" && "text-expense",
            tone === "warning" && "text-warning",
            tone === "muted" && "text-muted-foreground",
          )}
        >
          {hint}
        </span>
      )}
    </div>
  )
}

export function Bar({ pct, color, className, marker }: { pct: number; color?: string; className?: string; marker?: number }) {
  const w = Math.max(0, Math.min(100, pct))
  return (
    <div className={cn("relative h-1.5 rounded-full bg-track", className)}>
      <div className="h-full rounded-full bg-primary" style={{ width: `${w}%`, ...(color ? { background: color } : {}) }} />
      {marker != null && (
        <div
          aria-hidden
          className="absolute -top-1 h-[calc(100%+8px)] w-0.5 rounded bg-foreground/50"
          style={{ left: `${Math.min(100, marker)}%` }}
        />
      )}
    </div>
  )
}

export function Dot({ color, square, className }: { color: string; square?: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block h-2.5 w-2.5 shrink-0", square ? "rounded-[3px]" : "rounded-full", className)}
      style={{ background: color }}
    />
  )
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "income" | "expense" | "warning" | "primary" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold",
        tone === "neutral" && "bg-secondary text-muted-foreground",
        tone === "income" && "bg-income/15 text-income",
        tone === "expense" && "bg-expense/15 text-expense",
        tone === "warning" && "bg-warning/15 text-warning",
        tone === "primary" && "bg-primary/15 text-primary",
      )}
    >
      {children}
    </span>
  )
}

export function Avatar({ text, color }: { text: string; color: string }) {
  return (
    <div
      aria-hidden
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-[13px] font-semibold"
      style={{ background: `${color}22`, color }}
    >
      {initials(text)}
    </div>
  )
}

export function Money({ value, sign, className }: { value: unknown; sign?: boolean; className?: string }) {
  return <span className={cn("num", className)}>{money(value, { sign })}</span>
}

export function Chips<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "inline-flex min-h-9 items-center rounded-full border px-3.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            value === o.value
              ? "border-foreground bg-foreground text-background"
              : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  label: string
  className?: string
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn("grid gap-1 rounded-xl bg-background p-1", className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "min-h-10 rounded-[9px] px-3 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            value === o.value ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-6 py-10 text-center">
      <p className="font-medium">{title}</p>
      {children && <p className="max-w-sm text-sm text-muted-foreground">{children}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl border border-expense/40 bg-expense/10 px-4 py-3 text-sm">
      <AlertCircle className="h-4 w-4 text-expense" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="font-medium text-primary hover:underline">
          Tentar de novo
        </button>
      )}
    </div>
  )
}

export function Loading({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center py-16 text-muted-foreground", className)}>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando…
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-card", className)} />
}

/** Botão no padrão do design (44px). */
export function Action({
  children,
  onClick,
  variant = "default",
  type = "button",
  disabled,
  className,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: "default" | "primary" | "ghost" | "danger"
  type?: "button" | "submit"
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:h-4 [&_svg]:w-4",
        variant === "default" && "border bg-card hover:bg-accent",
        variant === "primary" && "bg-primary font-semibold text-primary-foreground hover:bg-primary/90",
        variant === "ghost" && "text-muted-foreground hover:bg-accent hover:text-foreground",
        variant === "danger" && "border border-expense/40 text-expense hover:bg-expense/10",
        className,
      )}
    >
      {children}
    </button>
  )
}

/** Pílula pequena (36px) para ações em linha. */
export function SmallAction({
  children,
  onClick,
  done,
  disabled,
  label,
}: {
  children: ReactNode
  onClick?: () => void
  done?: boolean
  disabled?: boolean
  label?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={done}
      className={cn(
        "inline-flex min-h-10 min-w-[96px] items-center justify-center gap-1.5 rounded-[10px] px-3.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
        done ? "bg-income/15 text-income hover:bg-income/25" : "border border-input hover:bg-accent",
      )}
    >
      {children}
    </button>
  )
}
