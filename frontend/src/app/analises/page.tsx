"use client"

import { useMemo, useState } from "react"
import { Dot, ErrorNote, Loading, PageHeader, Panel, PanelTitle, Segmented, Bar } from "@/components/finance/ui"
import { StackedShare } from "@/components/finance/charts"
import { inputClass } from "@/components/finance/form"
import { fetchSpending } from "@/lib/finance/client"
import { currentMonth, money, monthBounds, shiftMonth, todayISO } from "@/lib/finance/format"
import { useApi } from "@/lib/hooks/use-api"
import type { SpendingGroupBy, SpendingResponse } from "@/lib/finance/types"

type Tab = "where" | "when" | "why"
type Period = "month" | "3m" | "6m" | "year"
const PERIODS: { value: Period; label: string }[] = [
  { value: "month", label: "Este mês" },
  { value: "3m", label: "Últimos 3 meses" },
  { value: "6m", label: "Últimos 6 meses" },
  { value: "year", label: "Este ano" },
]

function range(p: Period) {
  const m = currentMonth()
  const to = todayISO()
  if (p === "month") return { from: monthBounds(m).from, to }
  if (p === "year") return { from: `${m.slice(0, 4)}-01-01`, to }
  return { from: monthBounds(shiftMonth(m, p === "3m" ? -2 : -5)).from, to }
}

function useSpending(groupBy: SpendingGroupBy, period: Period, enabled: boolean, compare = false) {
  const { from, to } = range(period)
  return useApi(() => (enabled ? fetchSpending(from, to, groupBy, compare) : Promise.resolve(null)), [groupBy, period, enabled, compare])
}

function Bars({ data, perMonth }: { data: SpendingResponse; perMonth: boolean }) {
  const max = Math.max(1, ...data.groups.map((g) => g.amount))
  if (data.groups.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">Nenhum gasto no período.</p>
  return (
    <div className="flex flex-col gap-3">
      {data.groups.slice(0, 10).map((g) => (
        <div key={g.key} className="grid grid-cols-[minmax(0,130px)_minmax(0,1fr)_110px] items-center gap-3 text-sm">
          <span className="truncate">{g.label}</span>
          <div className="h-[22px] rounded-md bg-secondary">
            <div className="h-full rounded-md" style={{ width: `${(g.amount / max) * 100}%`, background: g.color }} />
          </div>
          <span className="num text-right font-medium">{money(perMonth ? g.amount / data.months : g.amount)}</span>
        </div>
      ))}
    </div>
  )
}

function Ranked({ data, unit }: { data: SpendingResponse; unit: [string, string] }) {
  if (data.groups.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">Nada no período.</p>
  return (
    <div className="flex flex-col">
      {data.groups.slice(0, 8).map((g, i) => (
        <div key={g.key} className="flex min-h-[52px] items-center gap-3 border-t first:border-t-0">
          <span className="num w-5 text-[13px] text-muted-foreground">{i + 1}</span>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium">{g.label}</span>
            <span className="text-xs text-muted-foreground">
              {g.count} {g.count === 1 ? unit[0] : unit[1]}
            </span>
          </div>
          <span className="num text-sm font-semibold">{money(g.amount)}</span>
        </div>
      ))}
    </div>
  )
}

export default function AnalisesPage() {
  const [tab, setTab] = useState<Tab>("where")
  const [period, setPeriod] = useState<Period>("3m")

  const byCategory = useSpending("category", period, tab === "where")
  const byMerchant = useSpending("merchant", period, tab === "where")
  const byAccount = useSpending("account", period, tab === "where")
  const byWeekday = useSpending("weekday", period, tab === "when")
  const byPhase = useSpending("phase", period, tab === "when")
  const byNature = useSpending("nature", period, tab === "why", true)
  const byTag = useSpending("tag", period, tab === "why")

  const all = [byCategory, byMerchant, byAccount, byWeekday, byPhase, byNature, byTag]
  const error = all.find((q) => q.error)?.error
  const loading = all.some((q) => q.loading)

  const phaseInsight = useMemo(() => {
    const p = byPhase.data
    if (!p || p.total === 0) return null
    const top = [...p.groups].sort((a, b) => b.amount - a.amount)[0]
    const pct = Math.round((top.amount / p.total) * 100)
    return pct >= 45 ? `${pct}% dos seus gastos acontecem entre os ${top.label.toLowerCase()}. Um limite semanal pode suavizar esse pico.` : "Seus gastos estão bem distribuídos ao longo do mês."
  }, [byPhase.data])

  return (
    <>
      <PageHeader title="Análises">
        <select aria-label="Período" className={`${inputClass} w-auto rounded-xl bg-card`} value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
          {PERIODS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </PageHeader>

      <Segmented
        label="Pergunta"
        className="max-w-[520px] border bg-card"
        options={[
          { value: "where", label: "Onde" },
          { value: "when", label: "Quando" },
          { value: "why", label: "Por quê" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {error && <ErrorNote message={error} />}
      {loading && all.every((q) => !q.data) && <Loading />}

      {tab === "where" && (
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
          <Panel aria-label="Por categoria">
            <PanelTitle>Por categoria{byCategory.data && byCategory.data.months > 1 ? " · média mensal" : ""}</PanelTitle>
            {byCategory.data && <Bars data={byCategory.data} perMonth={byCategory.data.months > 1} />}
          </Panel>
          <Panel aria-label="Onde mais gastei">
            <PanelTitle>Onde mais gastei</PanelTitle>
            {byMerchant.data && <Ranked data={byMerchant.data} unit={["lançamento", "lançamentos"]} />}
          </Panel>
          <Panel aria-label="Por conta" className="lg:col-span-2">
            <PanelTitle>Por conta ou cartão</PanelTitle>
            {byAccount.data && <Bars data={byAccount.data} perMonth={false} />}
          </Panel>
        </div>
      )}

      {tab === "when" && (
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
          <Panel aria-label="Por dia da semana">
            <PanelTitle>Gasto médio por dia da semana</PanelTitle>
            {byWeekday.data && (() => {
              const max = Math.max(1, ...byWeekday.data.groups.map((g) => g.amount))
              const avg = byWeekday.data.groups.reduce((s, g) => s + g.amount, 0) / 7
              return (
                <div className="flex flex-col gap-3">
                  <div role="img" aria-label={byWeekday.data.groups.map((g) => `${g.label} ${money(g.amount)}`).join(", ")} className="flex h-[200px] items-end gap-3 border-b">
                    {byWeekday.data.groups.map((g) => (
                      <div key={g.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                        <span className="num text-[11px] text-muted-foreground">{money(g.amount).replace(/,\d\d$/, "")}</span>
                        <div className={`w-full max-w-9 rounded-t-md ${g.amount > avg * 1.4 ? "bg-expense" : "bg-primary"}`} style={{ height: `${(g.amount / max) * 85}%` }} />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    {byWeekday.data.groups.map((g) => (
                      <span key={g.key} className="flex-1 text-center">{g.label}</span>
                    ))}
                  </div>
                </div>
              )
            })()}
          </Panel>
          <Panel aria-label="Momento do mês">
            <PanelTitle>Momento do mês</PanelTitle>
            <div className="flex flex-col gap-4">
              {byPhase.data?.groups.map((g) => (
                <div key={g.key} className="flex flex-col gap-2">
                  <div className="flex justify-between text-sm">
                    <span>{g.label}</span>
                    <span className="num font-medium">{money(g.amount)} · {g.pct ?? 0}%</span>
                  </div>
                  <Bar pct={g.pct ?? 0} className="h-2" />
                </div>
              ))}
              {phaseInsight && <p className="rounded-xl bg-secondary px-4 py-3.5 text-[13px] leading-relaxed">{phaseInsight}</p>}
            </div>
          </Panel>
        </div>
      )}

      {tab === "why" && (
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
          <Panel aria-label="Natureza dos gastos">
            <PanelTitle>Natureza dos gastos</PanelTitle>
            {byNature.data && (
              <div className="flex flex-col gap-4">
                <StackedShare parts={byNature.data.groups.map((g) => ({ name: g.label, value: g.amount, color: g.color }))} />
                {byNature.data.groups.map((g) => {
                  const prev = g.previousAmount ?? 0
                  const change = prev > 0 ? Math.round(((g.amount - prev) / prev) * 100) : null
                  return (
                    <div key={g.key} className="flex min-h-12 items-center gap-3 border-t pt-2">
                      <Dot square color={g.color} />
                      <span className="flex-1 text-sm font-medium">{g.label}</span>
                      <div className="flex flex-col items-end">
                        <span className="num text-sm font-semibold">{money(g.amount)} · {g.pct ?? 0}%</span>
                        <span className={`num text-xs ${change == null ? "text-muted-foreground" : change > 0 ? "text-expense" : "text-income"}`}>
                          {change == null ? "sem período anterior" : `${change > 0 ? "+" : ""}${change}% vs período anterior`}
                        </span>
                      </div>
                    </div>
                  )
                })}
                {byNature.data.groups.some((g) => g.key === "NONE") && (
                  <p className="text-xs text-muted-foreground">Dica: marque a natureza ao lançar um gasto (Essencial, Importante ou Supérfluo).</p>
                )}
              </div>
            )}
          </Panel>
          <Panel aria-label="Por tag">
            <PanelTitle>Por tag (projetos e motivos)</PanelTitle>
            {byTag.data && <Ranked data={byTag.data} unit={["lançamento", "lançamentos"]} />}
          </Panel>
        </div>
      )}
    </>
  )
}
