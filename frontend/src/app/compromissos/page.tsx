"use client"

import { useMemo, useState } from "react"
import { Plus } from "lucide-react"
import { Action, Badge, Bar, Chips, Dot, Empty, ErrorNote, Loading, MonthSwitcher, PageHeader, Panel, PanelTitle, Segmented, StatTile } from "@/components/finance/ui"
import { BillCalendar, BillRow, useBillActions } from "@/components/finance/bills"
import { PayDialog } from "@/components/finance/pay-dialog"
import { FormDialog } from "@/components/finance/form-dialog"
import { RecurringForm } from "@/components/finance/recurring-form"
import { fetchAccounts, fetchBills, fetchRecurring, fetchRecurringSummary } from "@/lib/finance/client"
import { RECURRING_LABEL, currentMonth, daysUntil, money, shortDate } from "@/lib/finance/format"
import { useApi } from "@/lib/hooks/use-api"
import type { Bill, BillGroup, Recurring } from "@/lib/finance/types"

type Kind = "ALL" | BillGroup
const KINDS: { value: Kind; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "FIXED", label: "Fixas" },
  { value: "SUBSCRIPTION", label: "Assinaturas" },
  { value: "INSTALLMENT", label: "Parcelamentos" },
  { value: "LOAN", label: "Empréstimos" },
  { value: "CARD", label: "Faturas" },
  { value: "INCOME", label: "Receitas" },
]
type View = "list" | "calendar" | "manage"

export default function CompromissosPage() {
  const [month, setMonth] = useState(currentMonth())
  const [kind, setKind] = useState<Kind>("ALL")
  const [view, setView] = useState<View>("list")
  const [payBill, setPayBill] = useState<Bill | null>(null)
  const [form, setForm] = useState<{ open: boolean; editing?: Recurring | null }>({ open: false })

  const bills = useApi(() => fetchBills(month), [month])
  const recurring = useApi(fetchRecurring, [])
  const summary = useApi(fetchRecurringSummary, [])
  const accounts = useApi(fetchAccounts, [])
  const actions = useBillActions(month, setPayBill)

  const data = bills.data
  const shown = useMemo(() => (data?.items ?? []).filter((b) => kind === "ALL" || b.group === kind), [data, kind])
  const groups = useMemo(() => {
    const late = shown.filter((b) => b.isOverdue)
    const open = shown.filter((b) => !b.isPaid && !b.isOverdue)
    return [
      { title: "Atrasado", dot: "hsl(var(--expense))", tone: "text-expense", items: late },
      { title: "Próximos 7 dias", dot: "hsl(var(--primary))", tone: "", items: open.filter((b) => daysUntil(b.dueDate) <= 7) },
      { title: "Mais adiante", dot: "hsl(var(--border))", tone: "", items: open.filter((b) => daysUntil(b.dueDate) > 7) },
      { title: "Pagos", dot: "hsl(var(--income))", tone: "text-muted-foreground", items: shown.filter((b) => b.isPaid) },
    ].filter((g) => g.items.length > 0)
  }, [shown])

  const t = data?.totals
  const paidPct = t && t.out > 0 ? Math.round((t.outPaid / t.out) * 100) : 0
  const incomeShare = t && t.in > 0 ? Math.round((t.out / t.in) * 100) : null
  const recurringById = new Map((recurring.data ?? []).map((r) => [r.id, r]))
  const openEdit = (b: Bill) => b.kind === "RECURRING" && setForm({ open: true, editing: recurringById.get(b.refId) ?? null })
  const cards = (accounts.data ?? []).filter((a) => a.type === "CREDIT_CARD" && a.isActive)
  const debts = (recurring.data ?? []).filter((r) => (r.type === "LOAN" || r.type === "INSTALLMENT") && r.status === "ACTIVE")

  return (
    <>
      <PageHeader title={<MonthSwitcher month={month} onChange={setMonth} prefix="Compromissos" />}>
        <Action variant="primary" onClick={() => setForm({ open: true, editing: null })}>
          <Plus /> Novo compromisso
        </Action>
      </PageHeader>

      {bills.error && <ErrorNote message={bills.error} onRetry={bills.reload} />}

      <Panel aria-label="Resumo do mês" className="flex flex-col gap-5 rounded-[20px]">
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          <StatTile big label="Total do mês" value={money(t?.out ?? 0)} />
          <StatTile big label="Pago" value={<span className="text-income">{money(t?.outPaid ?? 0)}</span>} />
          <StatTile big label="Falta pagar" value={money(t?.outOpen ?? 0)} hint={t?.overdueCount ? `${t.overdueCount} em atraso` : undefined} tone="expense" />
          <StatTile big label="Da renda prevista" value={incomeShare != null ? `${incomeShare}%` : "—"} hint={incomeShare == null ? "Cadastre receitas fixas" : `de ${money(t?.in ?? 0)}`} />
        </div>
        <Bar pct={paidPct} color="hsl(var(--income))" className="h-2.5" />
      </Panel>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Chips label="Filtrar por tipo" options={KINDS} value={kind} onChange={setKind} />
        <Segmented
          label="Visualização"
          className="w-full border bg-card sm:w-[330px]"
          options={[
            { value: "list", label: "Lista" },
            { value: "calendar", label: "Calendário" },
            { value: "manage", label: "Cadastrados" },
          ]}
          value={view}
          onChange={setView}
        />
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[999_1_480px] flex-col gap-5">
          {bills.loading && !data && <Loading />}
          {view === "list" && data && groups.length === 0 && (
            <Empty title="Nada neste mês" action={<Action onClick={() => setForm({ open: true, editing: null })}>Cadastrar compromisso</Action>}>
              Cadastre aluguel, assinaturas, empréstimos e o seu salário para acompanhar tudo aqui.
            </Empty>
          )}
          {view === "list" &&
            groups.map((g) => (
              <section key={g.title} aria-label={g.title} className="flex flex-col gap-2">
                <div className="flex items-center gap-2 px-1">
                  <Dot color={g.dot} />
                  <h2 className={`text-sm font-semibold ${g.tone}`}>{g.title}</h2>
                  <span className="num ml-auto text-[13px] text-muted-foreground">
                    {money(g.items.filter((b) => b.direction === "OUT" && !b.viaCard).reduce((s, b) => s + b.amount, 0))}
                  </span>
                </div>
                <div className="rounded-2xl border bg-card px-4">
                  {g.items.map((b) => (
                    <BillRow
                      key={b.id}
                      bill={b}
                      busy={actions.busy === b.id}
                      onPay={() => actions.pay(b)}
                      onUndo={() => actions.undo(b)}
                      onDetails={b.kind === "RECURRING" ? () => openEdit(b) : undefined}
                    />
                  ))}
                </div>
              </section>
            ))}
          {view === "calendar" && data && <BillCalendar month={month} bills={shown} onSelect={(b) => (b.isPaid ? openEdit(b) : actions.pay(b))} />}
          {view === "manage" && <ManageList items={recurring.data ?? []} onEdit={(r) => setForm({ open: true, editing: r })} />}
        </div>

        <aside className="flex min-w-0 max-w-full flex-[1_1_300px] flex-col gap-4 lg:max-w-[380px]">
          <Panel aria-label="Faturas de cartão" className="p-5 sm:p-5">
            <PanelTitle>Faturas de cartão</PanelTitle>
            {cards.length === 0 && <p className="text-sm text-muted-foreground">Nenhum cartão cadastrado.</p>}
            {cards.map((c) => (
              <div key={c.id} className="flex flex-col gap-1.5 border-t py-3 first:border-t-0 first:pt-0">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{c.name}</span>
                  <span className="num font-semibold">{money(c.openInvoice?.total ?? 0)}</span>
                </div>
                {c.openInvoice && (
                  <span className="text-xs text-muted-foreground">
                    Fecha {shortDate(c.openInvoice.closingDate)} · vence {shortDate(c.openInvoice.dueDate)}
                  </span>
                )}
                {c.closedInvoice && (
                  <span className="text-xs text-warning">Fatura fechada a pagar: {money(c.closedInvoice.remaining)}</span>
                )}
                {c.limitUsedPct != null && (
                  <>
                    <Bar pct={c.limitUsedPct} color="hsl(var(--warning))" />
                    <span className="text-xs text-muted-foreground">{c.limitUsedPct}% do limite de {money(c.creditLimit ?? 0)}</span>
                  </>
                )}
              </div>
            ))}
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Pagar a fatura é uma transferência da conta corrente para o cartão: não conta como gasto de novo.
            </p>
          </Panel>

          <Panel aria-label="Dívidas em andamento" className="p-5 sm:p-5">
            <PanelTitle>Dívidas em andamento</PanelTitle>
            <StatTile big label="Saldo devedor estimado" value={money(summary.data?.debtOutstanding ?? 0)} hint="Parcelas restantes × valor da parcela" />
            <div className="mt-3 flex flex-col">
              {debts.map((r) => (
                <div key={r.id} className="flex justify-between border-t py-2.5 text-[13px]">
                  <span>{r.name}</span>
                  <span className="num text-muted-foreground">{r.remainingInstallments} restantes</span>
                </div>
              ))}
            </div>
          </Panel>

          {summary.data && (
            <Panel aria-label="Fixos por mês" className="p-5 sm:p-5">
              <PanelTitle>Custo fixo mensal</PanelTitle>
              {(["FIXED", "SUBSCRIPTION", "INSTALLMENT", "LOAN"] as const).map((k) => (
                <div key={k} className="flex justify-between py-1.5 text-[13px]">
                  <span className="text-muted-foreground">{RECURRING_LABEL[k]}</span>
                  <span className="num">{money(summary.data!.byType[k] ?? 0)}</span>
                </div>
              ))}
              <div className="mt-1 flex justify-between border-t pt-2.5 text-sm font-semibold">
                <span>Total</span>
                <span className="num">{money(summary.data.monthlyOut)}</span>
              </div>
            </Panel>
          )}
        </aside>
      </div>

      <PayDialog bill={payBill} month={month} onClose={() => setPayBill(null)} />
      <FormDialog
        open={form.open}
        onOpenChange={(o) => setForm((f) => ({ ...f, open: o }))}
        title={form.editing ? "Editar compromisso" : "Novo compromisso"}
        wide
      >
        <RecurringForm key={form.editing?.id ?? "new"} editing={form.editing} onDone={() => setForm({ open: false })} />
      </FormDialog>
    </>
  )
}

function ManageList({ items, onEdit }: { items: Recurring[]; onEdit: (r: Recurring) => void }) {
  if (items.length === 0) return <Empty title="Nenhum compromisso cadastrado" />
  return (
    <div className="rounded-2xl border bg-card px-4">
      {items.map((r) => (
        <button
          key={r.id}
          type="button"
          onClick={() => onEdit(r)}
          className="flex min-h-16 w-full flex-wrap items-center gap-3 border-b py-2 text-left last:border-b-0 hover:bg-secondary/30"
        >
          <Dot color={r.category?.color ?? r.color} />
          <div className="flex min-w-0 flex-[1_1_200px] flex-col gap-0.5">
            <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
              {r.name} <Badge tone={r.type === "INCOME" ? "income" : "neutral"}>{RECURRING_LABEL[r.type]}</Badge>
              {r.status !== "ACTIVE" && <Badge tone="warning">{r.status === "PAUSED" ? "Pausado" : r.status === "COMPLETED" ? "Quitado" : "Cancelado"}</Badge>}
            </span>
            <span className="text-xs text-muted-foreground">
              Dia {r.dueDay}
              {r.next ? ` · próximo ${shortDate(r.next.dueDate)}` : ""}
              {r.remainingInstallments != null ? ` · ${r.remainingInstallments} parcelas restantes` : ""}
              {r.account ? ` · ${r.account.name}` : ""}
            </span>
          </div>
          <span className="num text-sm font-semibold">
            {money(r.monthlyAmount)}
            <span className="font-normal text-muted-foreground">/mês</span>
          </span>
        </button>
      ))}
    </div>
  )
}
