"use client"

import Link from "next/link"
import { useState } from "react"
import { Plus } from "lucide-react"
import { Action, Dot, Empty, ErrorNote, MonthSwitcher, PageHeader, Panel, PanelTitle, Skeleton, StatTile, Bar } from "@/components/finance/ui"
import { BillMini, TransactionRow } from "@/components/finance/rows"
import { CashflowBars, StackedShare } from "@/components/finance/charts"
import { useQuickAdd } from "@/components/finance/quick-add"
import { fetchAccounts, fetchCashflow, fetchOverview } from "@/lib/finance/client"
import { currentMonth, money, monthName, shortDate } from "@/lib/finance/format"
import { useApi } from "@/lib/hooks/use-api"

export default function OverviewPage() {
  const [month, setMonth] = useState(currentMonth())
  const quickAdd = useQuickAdd()
  const overview = useApi(() => fetchOverview(month), [month])
  const cashflow = useApi(() => fetchCashflow(6), [])
  const accounts = useApi(fetchAccounts, [])
  const o = overview.data

  const card = (accounts.data ?? [])
    .filter((a) => a.type === "CREDIT_CARD" && a.isActive && a.openInvoice)
    .sort((a, b) => (b.openInvoice?.total ?? 0) - (a.openInvoice?.total ?? 0))[0]

  const noAccounts = accounts.data && accounts.data.length === 0

  return (
    <>
      <PageHeader title={<MonthSwitcher month={month} onChange={setMonth} />}>
        <Action variant="primary" onClick={() => quickAdd.open()} className="hidden sm:inline-flex">
          <Plus /> Novo lançamento <span className="font-medium opacity-60">N</span>
        </Action>
      </PageHeader>

      {overview.error && <ErrorNote message={overview.error} onRetry={overview.reload} />}

      {noAccounts && (
        <Empty
          title="Comece cadastrando suas contas"
          action={
            <Link href="/patrimonio" className="font-medium text-primary hover:underline">
              Ir para Patrimônio
            </Link>
          }
        >
          Conta corrente, cartões e investimentos. Depois cadastre salário e contas fixas em Compromissos.
        </Empty>
      )}

      {!o ? (
        <Skeleton className="h-[220px]" />
      ) : (
        <Panel aria-label="Livre para gastar" className="flex flex-col gap-5 rounded-[20px] sm:px-8 sm:py-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-muted-foreground">Livre para gastar em {monthName(month).toLowerCase()}</span>
              <span className={`num text-[40px] font-bold leading-tight tracking-tight sm:text-5xl ${o.freeToSpend < 0 ? "text-expense" : ""}`}>
                {money(o.freeToSpend)}
              </span>
              {o.daysLeft > 0 && o.perDay != null && (
                <span className="text-sm text-muted-foreground">
                  {o.daysLeft} {o.daysLeft === 1 ? "dia restante" : "dias restantes"} · cerca de{" "}
                  <strong className="text-foreground">{money(o.perDay)}/dia</strong>
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-8">
              <StatTile label="Receitas previstas" value={<span className="text-income">{money(o.expectedIncome)}</span>} />
              <StatTile label="Compromissos a pagar" value={money(o.pendingCommitments)} />
              <StatTile label="Já gasto" value={<span className="text-expense">{money(o.spent)}</span>} />
            </div>
          </div>
          <StackedShare
            parts={[
              { name: "Compromissos a pagar", value: o.pendingCommitments, color: "hsl(var(--primary))" },
              { name: "Gasto no mês", value: o.spent, color: "hsl(var(--expense))" },
              { name: "Livre", value: Math.max(0, o.freeToSpend), color: "hsl(var(--track))" },
            ]}
          />
          <div className="flex flex-wrap gap-5 text-[13px] text-muted-foreground">
            <span className="flex items-center gap-2"><Dot square color="hsl(var(--primary))" />Compromissos a pagar</span>
            <span className="flex items-center gap-2"><Dot square color="hsl(var(--expense))" />Gasto no mês</span>
            <span className="flex items-center gap-2"><Dot square color="hsl(var(--track))" className="outline outline-1 outline-border" />Livre</span>
          </div>
          {o.expectedIncome === 0 && (
            <p className="text-sm text-muted-foreground">
              Cadastre seu salário como <Link href="/compromissos" className="text-primary hover:underline">receita fixa</Link> para o cálculo considerar o que ainda vai entrar.
            </p>
          )}
        </Panel>
      )}

      {o && (
        <section aria-label="Indicadores" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Panel className="p-5 sm:p-5">
            <StatTile
              big
              label="Receitas do mês"
              value={money(o.incomeReceived)}
              hint={o.pendingIncome > 0 ? `${money(o.pendingIncome)} ainda a receber` : "Tudo recebido"}
            />
          </Panel>
          <Panel className="p-5 sm:p-5">
            <StatTile
              big
              label="Gastos do mês"
              value={money(o.spent)}
              tone={o.spentVsAvgPct == null ? "muted" : o.spentVsAvgPct > 0 ? "expense" : "income"}
              hint={
                o.spentVsAvgPct == null
                  ? "Sem histórico para comparar"
                  : `${Math.abs(o.spentVsAvgPct)}% ${o.spentVsAvgPct > 0 ? "acima" : "abaixo"} da média de 3 meses`
              }
            />
          </Panel>
          <Panel className="p-5 sm:p-5">
            <StatTile
              big
              label="Patrimônio líquido"
              value={<Link href="/patrimonio" className="hover:underline">{money(o.netWorth.total)}</Link>}
              hint={`Investido ${money(o.netWorth.investments)}`}
            />
          </Panel>
          <Panel className="p-5 sm:p-5">
            {card?.openInvoice ? (
              <StatTile
                big
                label={`Fatura aberta · ${card.name}`}
                value={money(card.openInvoice.total)}
                tone="warning"
                hint={`Fecha ${shortDate(card.openInvoice.closingDate)} · vence ${shortDate(card.openInvoice.dueDate)}`}
              />
            ) : (
              <StatTile big label="Compromissos do mês" value={money(o.commitmentsTotal)} hint={`${o.overdue.length} em atraso`} tone={o.overdue.length ? "expense" : "muted"} />
            )}
          </Panel>
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel aria-label="Fluxo de caixa">
          <PanelTitle
            action={
              <div className="flex gap-4 text-[13px] text-muted-foreground">
                <span className="flex items-center gap-1.5"><Dot square color="hsl(var(--income))" />Receitas</span>
                <span className="flex items-center gap-1.5"><Dot square color="hsl(var(--expense))" />Gastos</span>
              </div>
            }
          >
            Fluxo de caixa
          </PanelTitle>
          {cashflow.data ? <CashflowBars data={cashflow.data} /> : <Skeleton className="h-[220px]" />}
        </Panel>

        <Panel aria-label="Próximos 7 dias">
          <PanelTitle action={<Link href="/compromissos" className="text-[13px] text-primary hover:underline">Ver todos</Link>}>
            Próximos 7 dias
          </PanelTitle>
          {o?.overdue.length ? (
            <Link href="/compromissos" className="mb-2 block rounded-xl bg-expense/10 px-3 py-2 text-sm text-expense hover:bg-expense/15">
              {o.overdue.length} {o.overdue.length === 1 ? "compromisso atrasado" : "compromissos atrasados"} · {money(o.overdue.reduce((s, b) => s + b.amount, 0))}
            </Link>
          ) : null}
          {o && o.upcoming.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nada vence nos próximos 7 dias.</p>
          ) : (
            o?.upcoming.map((b) => <BillMini key={b.id} bill={b} />)
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel aria-label="Onde está indo o dinheiro">
          <PanelTitle action={<Link href="/analises" className="text-[13px] text-primary hover:underline">Análises</Link>}>
            Onde está indo o dinheiro
          </PanelTitle>
          <div className="flex flex-col gap-4">
            {o && o.topCategories.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Nenhum gasto neste mês.</p>}
            {o?.topCategories.map((c) => (
              <div key={c.id ?? "none"} className="flex flex-col gap-2">
                <div className="flex justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2"><Dot square color={c.color} />{c.name}</span>
                  <span className="num font-medium">
                    {money(c.amount)} <span className="font-normal text-muted-foreground">· {c.pct}%</span>
                  </span>
                </div>
                <Bar pct={c.pct} color={c.color} />
              </div>
            ))}
          </div>
        </Panel>

        <Panel aria-label="Últimos lançamentos">
          <PanelTitle action={<Link href="/lancamentos" className="text-[13px] text-primary hover:underline">Ver todos</Link>}>
            Últimos lançamentos
          </PanelTitle>
          {o && o.recent.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Nenhum lançamento ainda. Aperte N para lançar.</p>}
          {o?.recent.map((t) => <TransactionRow key={t.id} tx={t} onClick={() => quickAdd.edit(t)} showNature={false} />)}
        </Panel>
      </div>
    </>
  )
}
