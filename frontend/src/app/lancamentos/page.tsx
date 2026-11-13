"use client"

import { useEffect, useMemo, useState } from "react"
import { Search } from "lucide-react"
import { Chips, Empty, ErrorNote, Loading, MonthSwitcher, PageHeader, Panel } from "@/components/finance/ui"
import { inputClass } from "@/components/finance/form"
import { TransactionRow } from "@/components/finance/rows"
import { TransactionForm } from "@/components/finance/transaction-form"
import { useQuickAdd } from "@/components/finance/quick-add"
import { fetchAccounts, fetchTransactions, type TransactionQuery } from "@/lib/finance/client"
import { currentMonth, dayHeading, money, monthBounds } from "@/lib/finance/format"
import { useApi } from "@/lib/hooks/use-api"
import type { Transaction } from "@/lib/finance/types"

type Filter = "ALL" | "EXPENSE" | "INCOME" | "PAYMENT" | "INSTALLMENTS"
const FILTERS: { value: Filter; label: string }[] = [
  { value: "ALL", label: "Tudo" },
  { value: "EXPENSE", label: "Gastos" },
  { value: "INCOME", label: "Receitas" },
  { value: "PAYMENT", label: "Transferências" },
  { value: "INSTALLMENTS", label: "Parcelados" },
]

function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

export default function LancamentosPage() {
  const quickAdd = useQuickAdd()
  const [month, setMonth] = useState(currentMonth())
  const [filter, setFilter] = useState<Filter>("ALL")
  const [accountId, setAccountId] = useState("")
  const [search, setSearch] = useState("")
  const q = useDebounced(search)

  const query: TransactionQuery = {
    ...monthBounds(month),
    accountId: accountId || undefined,
    q: q || undefined,
    type: filter === "ALL" || filter === "INSTALLMENTS" ? undefined : filter,
    installments: filter === "INSTALLMENTS" ? "1" : undefined,
  }
  const txs = useApi(() => fetchTransactions(query), [month, filter, accountId, q])
  const accounts = useApi(fetchAccounts, [])

  const { days, totals } = useMemo(() => {
    const list = (txs.data ?? []).filter((t) => t.status !== "CANCELLED")
    const byDay = new Map<string, Transaction[]>()
    let income = 0
    let expense = 0
    let transfers = 0
    for (const t of list) {
      const day = t.date.slice(0, 10)
      byDay.set(day, [...(byDay.get(day) ?? []), t])
      if (t.status !== "COMPLETED") continue
      const n = Number(t.amount)
      if (t.type === "INCOME") income += n
      else if (t.type === "EXPENSE") expense += n
      else transfers += n
    }
    const days = [...byDay.entries()].map(([day, items]) => ({
      day,
      items,
      net: items.reduce((s, t) => s + (t.type === "INCOME" ? 1 : t.type === "EXPENSE" ? -1 : 0) * Number(t.amount), 0),
    }))
    return { days, totals: { income, expense, transfers } }
  }, [txs.data])

  return (
    <div className="flex flex-wrap items-start gap-6">
      <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-5">
        <PageHeader title={<MonthSwitcher month={month} onChange={setMonth} />}>
          <select
            aria-label="Conta"
            className={`${inputClass} w-auto min-w-[170px] rounded-xl bg-card`}
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            <option value="">Todas as contas</option>
            {(accounts.data ?? []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </PageHeader>

        <label className="flex min-h-12 items-center gap-2.5 rounded-xl border bg-card px-4 text-muted-foreground focus-within:ring-2 focus-within:ring-ring">
          <Search className="h-[18px] w-[18px]" aria-hidden />
          <span className="sr-only">Buscar lançamentos</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por descrição, categoria, nota ou #tag"
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </label>

        <Chips label="Filtrar por tipo" options={FILTERS} value={filter} onChange={setFilter} />

        <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-[14px] border bg-card px-5 py-4 text-[13px] text-muted-foreground">
          <span>Entradas <strong className="num font-semibold text-income">{money(totals.income)}</strong></span>
          <span>Saídas <strong className="num font-semibold text-expense">{money(totals.expense)}</strong></span>
          <span>
            Transferências <strong className="num font-semibold text-foreground">{money(totals.transfers)}</strong>{" "}
            <span className="opacity-80">(não contam como gasto)</span>
          </span>
        </div>

        {txs.error && <ErrorNote message={txs.error} onRetry={txs.reload} />}
        {txs.loading && !txs.data && <Loading />}
        {txs.data && days.length === 0 && (
          <Empty title="Nenhum lançamento encontrado">
            {q || filter !== "ALL" || accountId ? "Tente outro filtro ou mês." : "Use o formulário ou aperte N para lançar."}
          </Empty>
        )}

        {days.map((d) => (
          <section key={d.day} aria-label={dayHeading(d.day)} className="flex flex-col">
            <div className="flex justify-between px-1 py-2 text-[13px] font-medium text-muted-foreground">
              <span>{dayHeading(d.day)}</span>
              <span className="num">{d.net === 0 ? "" : money(d.net, { sign: true })}</span>
            </div>
            <div className="rounded-2xl border bg-card px-4">
              {d.items.map((t) => (
                <TransactionRow key={t.id} tx={t} onClick={() => quickAdd.edit(t)} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <Panel as="aside" aria-label="Novo lançamento" className="hidden max-w-[420px] flex-[1_1_340px] rounded-[20px] xl:block xl:sticky xl:top-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Novo lançamento</h2>
          <span className="text-xs text-muted-foreground">
            atalho <kbd className="rounded-md border px-1.5 font-sans">N</kbd>
          </span>
        </div>
        <TransactionForm />
      </Panel>
    </div>
  )
}
