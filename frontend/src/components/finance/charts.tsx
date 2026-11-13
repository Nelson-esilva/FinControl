"use client"

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { compactMoney, money } from "@/lib/finance/format"
import type { CashflowPoint } from "@/lib/finance/types"

/** Barras de receitas × gastos por mês (azul × laranja). */
export function CashflowBars({ data }: { data: CashflowPoint[] }) {
  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]))
  const summary = data.map((d) => `${d.label}: receitas ${money(d.income)}, gastos ${money(d.expense)}`).join("; ")
  return (
    <div className="flex flex-col gap-3">
      <div role="img" aria-label={summary} className="flex h-[200px] items-end justify-between gap-3 border-b">
        {data.map((d) => (
          <div key={d.month} className="group relative flex h-full flex-1 items-end justify-center gap-1">
            <div className="w-2/5 max-w-[18px] rounded-t bg-income" style={{ height: `${(d.income / max) * 100}%` }} />
            <div className="w-2/5 max-w-[18px] rounded-t bg-expense" style={{ height: `${(d.expense / max) * 100}%` }} />
            <div className="pointer-events-none absolute bottom-full mb-2 hidden whitespace-nowrap rounded-lg border bg-popover px-2.5 py-1.5 text-xs shadow group-hover:block">
              <div className="num text-income">{money(d.income)}</div>
              <div className="num text-expense">{money(d.expense)}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between gap-3 text-xs text-muted-foreground">
        {data.map((d) => (
          <span key={d.month} className="flex-1 text-center">
            {d.label.split("/")[0]}
          </span>
        ))}
      </div>
    </div>
  )
}

export function NetWorthArea({ data }: { data: { label: string; value: number }[] }) {
  if (data.length === 0) return null
  const first = data[0].value
  const last = data[data.length - 1].value
  return (
    <div
      role="img"
      aria-label={`Patrimônio líquido foi de ${money(first)} para ${money(last)} no período`}
      className="h-[200px] w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="nw-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.28} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
          <YAxis hide domain={["auto", "auto"]} />
          <Tooltip
            cursor={{ stroke: "hsl(var(--border))" }}
            contentStyle={{
              background: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 10,
              fontSize: 13,
            }}
            labelStyle={{ color: "hsl(var(--muted-foreground))" }}
            formatter={(v: number) => [money(v), "Patrimônio"]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={2.5}
            fill="url(#nw-fill)"
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function StackedShare({ parts, label }: { parts: { value: number; color: string; name: string }[]; label?: string }) {
  const total = parts.reduce((s, p) => s + Math.max(0, p.value), 0)
  const aria =
    label ?? parts.map((p) => `${p.name} ${total > 0 ? Math.round((p.value / total) * 100) : 0}%`).join(", ")
  return (
    <div role="img" aria-label={aria} className="flex h-3 gap-[3px] overflow-hidden rounded-full bg-track">
      {total > 0 &&
        parts
          .filter((p) => p.value > 0)
          .map((p) => <div key={p.name} style={{ flex: p.value, background: p.color }} />)}
    </div>
  )
}

export { compactMoney }
