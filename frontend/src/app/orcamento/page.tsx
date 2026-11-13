"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { Action, Badge, Bar, Dot, Empty, ErrorNote, Loading, MonthSwitcher, PageHeader, Panel, StatTile } from "@/components/finance/ui"
import { FormDialog } from "@/components/finance/form-dialog"
import { Field, inputClass, moneyInputValue, parseMoney } from "@/components/finance/form"
import { deleteBudget, errorMessage, fetchBudgetMonth, fetchCategories, upsertBudget } from "@/lib/finance/client"
import { currentMonth, money } from "@/lib/finance/format"
import { useApi } from "@/lib/hooks/use-api"

const STATUS = {
  OK: { label: "No ritmo", tone: "income" as const },
  AHEAD: { label: "Acima do ritmo", tone: "warning" as const },
  OVER: { label: "Estourou", tone: "expense" as const },
}

type Editing = { budgetId?: string; categoryId?: string; amount?: number } | null

export default function OrcamentoPage() {
  const [month, setMonth] = useState(currentMonth())
  const [editing, setEditing] = useState<Editing>(null)
  const budget = useApi(() => fetchBudgetMonth(month), [month])
  const b = budget.data
  const isCurrent = month === currentMonth()
  const aheadBy = b && isCurrent ? b.totals.pct - b.pacePct : 0

  return (
    <>
      <PageHeader title={<MonthSwitcher month={month} onChange={setMonth} prefix="Orçamento" />}>
        <Action variant="primary" onClick={() => setEditing({})}>
          <Plus /> Definir limite
        </Action>
      </PageHeader>

      {budget.error && <ErrorNote message={budget.error} onRetry={budget.reload} />}
      {budget.loading && !b && <Loading />}

      {b && (
        <Panel aria-label="Resumo" className="flex flex-wrap items-center gap-8 rounded-[20px]">
          <div
            role="img"
            aria-label={`${b.totals.pct}% do orçamento usado`}
            className="flex h-[132px] w-[132px] shrink-0 items-center justify-center rounded-full"
            style={{ background: `conic-gradient(hsl(var(--primary)) 0 ${Math.min(100, b.totals.pct)}%, hsl(var(--track)) ${Math.min(100, b.totals.pct)}% 100%)` }}
          >
            <div className="flex h-[104px] w-[104px] flex-col items-center justify-center rounded-full bg-card">
              <span className="num text-[26px] font-bold">{b.totals.pct}%</span>
              <span className="text-xs text-muted-foreground">usado</span>
            </div>
          </div>
          <div className="grid flex-[1_1_280px] grid-cols-2 gap-5 md:grid-cols-4">
            <StatTile big label="Orçado" value={money(b.totals.limit)} />
            <StatTile big label="Gasto" value={money(b.totals.spent)} />
            <StatTile big label="Restante" value={<span className={b.totals.remaining < 0 ? "text-expense" : "text-income"}>{money(b.totals.remaining)}</span>} />
            <StatTile
              big
              label="Ritmo esperado hoje"
              value={`${b.pacePct}%`}
              tone={aheadBy > 0 ? "expense" : "income"}
              hint={isCurrent ? (aheadBy > 0 ? `${aheadBy} pontos acima do ritmo` : "Dentro do ritmo") : undefined}
            />
          </div>
        </Panel>
      )}

      {b && b.items.length === 0 && (
        <Empty title="Nenhum limite definido" action={<Action onClick={() => setEditing({})}>Definir primeiro limite</Action>}>
          Defina um teto mensal por categoria. Ele vale para todos os meses e mostra se você está gastando mais rápido que o mês anda.
        </Empty>
      )}

      {b && b.items.length > 0 && (
        <Panel aria-label="Categorias" className="rounded-[20px] py-2 sm:py-2">
          {b.items.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setEditing({ budgetId: r.id, categoryId: r.category.id, amount: r.limit })}
              className="flex w-full flex-col gap-2.5 border-b py-[18px] text-left last:border-b-0"
            >
              <div className="flex w-full flex-wrap items-center gap-3">
                <Dot square color={r.category.color} />
                <span className="flex-1 text-[15px] font-medium">{r.category.name}</span>
                <Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge>
                <span className="num min-w-[190px] text-right text-sm">
                  <strong className="font-semibold">{money(r.spent)}</strong> <span className="text-muted-foreground">de {money(r.limit)}</span>
                </span>
              </div>
              <Bar pct={r.pct} color={r.status === "OVER" ? "hsl(var(--expense))" : r.category.color} className="h-2 w-full" marker={isCurrent ? b.pacePct : undefined} />
              <span className="text-xs text-muted-foreground">
                {r.remaining < 0
                  ? `Passou ${money(-r.remaining)} do limite`
                  : isCurrent
                    ? `Pode gastar ${money(r.perDayLeft)} por dia até o fim do mês`
                    : `Sobrou ${money(r.remaining)}`}
              </span>
            </button>
          ))}
          {b.unbudgeted.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 py-[18px]">
              <span className="text-[13px] text-muted-foreground">
                Sem orçamento: {b.unbudgeted.map((u) => `${u.category.name} (${money(u.spent)})`).join(" · ")}
              </span>
              <Action onClick={() => setEditing({ categoryId: b.unbudgeted[0].category.id })}>Definir limite</Action>
            </div>
          )}
        </Panel>
      )}

      <FormDialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)} title={editing?.budgetId ? "Editar limite" : "Definir limite"}>
        {editing && <BudgetForm key={editing.budgetId ?? editing.categoryId ?? "new"} editing={editing} onDone={() => setEditing(null)} />}
      </FormDialog>
    </>
  )
}

function BudgetForm({ editing, onDone }: { editing: NonNullable<Editing>; onDone: () => void }) {
  const { data: categories = [] } = useApi(() => fetchCategories("EXPENSE"), [])
  const [categoryId, setCategoryId] = useState(editing.categoryId ?? "")
  const [amount, setAmount] = useState(moneyInputValue(editing.amount))
  const [saving, setSaving] = useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const value = parseMoney(amount)
    if (!categoryId) return toast.error("Escolha a categoria.")
    if (!(value > 0)) return toast.error("Informe o limite mensal.")
    setSaving(true)
    try {
      await upsertBudget(categoryId, value)
      toast.success("Limite salvo.")
      onDone()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!editing.budgetId) return
    setSaving(true)
    try {
      await deleteBudget(editing.budgetId)
      toast.success("Limite removido.")
      onDone()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <Field label="Categoria">
        <select className={inputClass} value={categoryId} disabled={!!editing.budgetId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">Escolha…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Limite por mês" hint="Vale para todos os meses.">
        <input className={`${inputClass} num`} inputMode="decimal" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
      </Field>
      <Action type="submit" variant="primary" disabled={saving} className="min-h-12">
        Salvar limite
      </Action>
      {editing.budgetId && (
        <Action variant="danger" onClick={remove} disabled={saving}>
          Remover limite
        </Action>
      )}
    </form>
  )
}
