"use client"

import { useState } from "react"
import { ArrowRightLeft, Plus } from "lucide-react"
import { Action, Badge, Bar, ErrorNote, Empty, Loading, PageHeader, Panel, PanelTitle, SmallAction, StatTile, Skeleton } from "@/components/finance/ui"
import { NetWorthArea } from "@/components/finance/charts"
import { FormDialog } from "@/components/finance/form-dialog"
import { AccountForm, ValuationForm } from "@/components/finance/account-form"
import { useQuickAdd } from "@/components/finance/quick-add"
import { fetchAccounts, fetchNetWorth } from "@/lib/finance/client"
import { ACCOUNT_TYPE_LABEL, money, shortDate } from "@/lib/finance/format"
import { useApi } from "@/lib/hooks/use-api"
import type { Account } from "@/lib/finance/types"

function since(iso: string | null) {
  if (!iso) return "sem avaliação"
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000)
  return days <= 0 ? "atualizado hoje" : days === 1 ? "atualizado ontem" : `atualizado há ${days} dias`
}

export default function PatrimonioPage() {
  const quickAdd = useQuickAdd()
  const accounts = useApi(fetchAccounts, [])
  const nw = useApi(() => fetchNetWorth(12), [])
  const [form, setForm] = useState<{ open: boolean; editing?: Account | null }>({ open: false })
  const [valuing, setValuing] = useState<Account | null>(null)

  const list = accounts.data ?? []
  const active = list.filter((a) => a.isActive)
  const investments = active.filter((a) => a.type === "INVESTMENT")
  const cards = active.filter((a) => a.type === "CREDIT_CARD")
  const cash = active.filter((a) => a.type !== "INVESTMENT" && a.type !== "CREDIT_CARD")
  const inactive = list.filter((a) => !a.isActive)
  const current = nw.data?.current
  const series = nw.data?.series ?? []
  const delta = series.length > 1 ? series[series.length - 1].value - series[0].value : 0
  const invested = investments.reduce((s, a) => s + a.currentBalance, 0)
  const yieldTotal = investments.reduce((s, a) => s + (a.yieldAmount ?? 0), 0)

  const edit = (a: Account) => setForm({ open: true, editing: a })

  return (
    <>
      <PageHeader title="Patrimônio">
        <Action onClick={() => quickAdd.open({ type: "PAYMENT" })}>
          <ArrowRightLeft /> Transferir / aportar
        </Action>
        <Action variant="primary" onClick={() => setForm({ open: true, editing: null })}>
          <Plus /> Nova conta
        </Action>
      </PageHeader>

      {accounts.error && <ErrorNote message={accounts.error} onRetry={accounts.reload} />}

      {!current ? (
        <Skeleton className="h-[340px]" />
      ) : (
        <Panel aria-label="Patrimônio líquido" className="flex flex-col gap-5 rounded-[20px] sm:px-8 sm:py-7">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-muted-foreground">Patrimônio líquido</span>
              <span className="num text-[40px] font-bold leading-tight tracking-tight">{money(current.total)}</span>
              {series.length > 1 && (
                <span className={`text-sm ${delta >= 0 ? "text-income" : "text-expense"}`}>
                  {money(delta, { sign: true })} em {series.length} meses
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-7">
              <StatTile label="Contas" value={money(current.cash)} />
              <StatTile label="Investimentos" value={money(current.investments)} />
              <StatTile label="Cartões" value={<span className="text-expense">{money(current.cards)}</span>} />
              <StatTile label="Dívidas" value={<span className="text-expense">{money(current.loans)}</span>} />
            </div>
          </div>
          <NetWorthArea data={series} />
        </Panel>
      )}

      {accounts.loading && !accounts.data && <Loading />}
      {accounts.data && list.length === 0 && (
        <Empty title="Nenhuma conta ainda" action={<Action onClick={() => setForm({ open: true, editing: null })}>Criar conta</Action>}>
          Cadastre conta corrente, cartões e investimentos. O saldo passa a seguir seus lançamentos.
        </Empty>
      )}

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <Panel aria-label="Investimentos">
          <PanelTitle
            action={
              investments.length > 0 && (
                <span className={`num text-[13px] ${yieldTotal >= 0 ? "text-income" : "text-expense"}`}>
                  {money(yieldTotal, { sign: true })}
                  {invested > 0 ? ` · ${((yieldTotal / invested) * 100).toFixed(1).replace(".", ",")}%` : ""}
                </span>
              )
            }
          >
            Investimentos
          </PanelTitle>
          {investments.length === 0 && <p className="text-sm text-muted-foreground">Crie uma conta do tipo Investimento e registre aportes como transferências.</p>}
          {investments.map((a) => (
            <div key={a.id} className="flex flex-col gap-2.5 border-t py-4 first:border-t-0 first:pt-0">
              <div className="flex justify-between gap-3">
                <button type="button" onClick={() => edit(a)} className="flex flex-col items-start gap-0.5 text-left">
                  <span className="text-sm font-medium hover:underline">{a.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {[a.institution, since(a.lastValuationAt)].filter(Boolean).join(" · ")}
                  </span>
                </button>
                <span className="num text-[15px] font-semibold">{money(a.marketValue ?? a.currentBalance)}</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>
                  Aplicado <span className="num text-foreground/80">{money(a.currentBalance)}</span> · Rendimento{" "}
                  <span className={`num ${(a.yieldAmount ?? 0) >= 0 ? "text-income" : "text-expense"}`}>{money(a.yieldAmount ?? 0, { sign: true })}</span>
                </span>
                <div className="flex gap-2">
                  <SmallAction onClick={() => quickAdd.open({ type: "PAYMENT", transferAccountId: a.id, description: `Aporte ${a.name}` })}>Aportar</SmallAction>
                  <SmallAction onClick={() => setValuing(a)}>Atualizar valor</SmallAction>
                </div>
              </div>
            </div>
          ))}
        </Panel>

        <div className="flex flex-col gap-4">
          <Panel aria-label="Contas">
            <PanelTitle>Contas</PanelTitle>
            {cash.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma conta corrente ou carteira.</p>}
            {cash.map((a) => (
              <button key={a.id} type="button" onClick={() => edit(a)} className="flex min-h-[52px] w-full items-center justify-between gap-3 border-t text-left first:border-t-0">
                <div className="flex flex-col">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {a.name} {a.source === "PLUGGY" && <Badge tone="primary">Banco conectado</Badge>}
                  </span>
                  <span className="text-xs text-muted-foreground">{[ACCOUNT_TYPE_LABEL[a.type], a.institution].filter(Boolean).join(" · ")}</span>
                </div>
                <span className={`num font-semibold ${a.currentBalance < 0 ? "text-expense" : ""}`}>{money(a.currentBalance)}</span>
              </button>
            ))}
          </Panel>

          <Panel aria-label="Cartões">
            <PanelTitle>Cartões</PanelTitle>
            {cards.length === 0 && <p className="text-sm text-muted-foreground">Nenhum cartão cadastrado.</p>}
            {cards.map((a) => {
              const toPay = a.closedInvoice ?? a.openInvoice
              return (
                <div key={a.id} className="flex flex-col gap-2 border-t py-3 first:border-t-0 first:pt-0">
                  <button type="button" onClick={() => edit(a)} className="flex justify-between text-left">
                    <span className="text-sm font-medium hover:underline">{a.name}</span>
                    <span className="num font-semibold">{money(a.openInvoice?.total ?? 0)}</span>
                  </button>
                  {a.limitUsedPct != null && <Bar pct={a.limitUsedPct} color="hsl(var(--warning))" />}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>
                      {a.openInvoice ? `Fatura aberta · fecha ${shortDate(a.openInvoice.closingDate)}` : "Sem fatura"}
                      {a.creditLimit ? ` · limite ${money(a.creditLimit)}` : ""}
                      {a.closedInvoice ? ` · fechada a pagar ${money(a.closedInvoice.remaining)}` : ""}
                    </span>
                    {toPay && toPay.remaining > 0 && (
                      <SmallAction
                        onClick={() =>
                          quickAdd.open({
                            type: "PAYMENT",
                            transferAccountId: a.id,
                            amount: toPay.remaining,
                            description: `Pagamento fatura ${a.name}`,
                            invoiceMonth: toPay.month,
                          })
                        }
                      >
                        Pagar fatura
                      </SmallAction>
                    )}
                  </div>
                </div>
              )
            })}
          </Panel>

          {inactive.length > 0 && (
            <Panel aria-label="Inativas" className="p-5 sm:p-5">
              <PanelTitle>Inativas</PanelTitle>
              {inactive.map((a) => (
                <button key={a.id} type="button" onClick={() => edit(a)} className="flex min-h-11 w-full justify-between text-left text-sm text-muted-foreground">
                  <span>{a.name}</span>
                  <span className="num">{money(a.currentBalance)}</span>
                </button>
              ))}
            </Panel>
          )}
        </div>
      </div>

      <FormDialog open={form.open} onOpenChange={(o) => setForm((f) => ({ ...f, open: o }))} title={form.editing ? "Editar conta" : "Nova conta"}>
        <AccountForm key={form.editing?.id ?? "new"} editing={form.editing} onDone={() => setForm({ open: false })} />
      </FormDialog>
      <FormDialog open={!!valuing} onOpenChange={(o) => !o && setValuing(null)} title={valuing ? `Valor atual · ${valuing.name}` : ""}>
        {valuing && <ValuationForm account={valuing} onDone={() => setValuing(null)} />}
      </FormDialog>
    </>
  )
}
