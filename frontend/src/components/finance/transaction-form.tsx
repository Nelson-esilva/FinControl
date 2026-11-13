"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Action, Chips, Segmented } from "./ui"
import { Field, inputClass, moneyInputValue, parseMoney, parseTags } from "./form"
import {
  createTransaction,
  deleteTransaction,
  errorMessage,
  fetchAccounts,
  fetchCategories,
  payTransaction,
  updateTransaction,
} from "@/lib/finance/client"
import { NATURE_LABEL, todayISO } from "@/lib/finance/format"
import { useApi } from "@/lib/hooks/use-api"
import type { Account, Category, Nature, Transaction, TransactionInput, TransactionType } from "@/lib/finance/types"

const TYPE_OPTIONS: { value: TransactionType; label: string }[] = [
  { value: "EXPENSE", label: "Gasto" },
  { value: "INCOME", label: "Receita" },
  { value: "PAYMENT", label: "Transferência" },
]

const NATURE_OPTIONS = (Object.keys(NATURE_LABEL) as Nature[]).map((n) => ({ value: n, label: NATURE_LABEL[n] }))

export type TransactionPrefill = Partial<TransactionInput>

export function TransactionForm({
  editing,
  prefill,
  onDone,
  autoFocus,
}: {
  editing?: Transaction | null
  prefill?: TransactionPrefill
  onDone?: () => void
  autoFocus?: boolean
}) {
  const { data: accounts = [] } = useApi(fetchAccounts, [])
  const { data: categories = [] } = useApi(() => fetchCategories(), [])
  const activeAccounts = useMemo(() => accounts.filter((a) => a.isActive), [accounts])

  const init = editing
    ? {
        type: editing.type,
        amount: Number(editing.amount),
        description: editing.description,
        accountId: editing.accountId,
        transferAccountId: editing.transferAccountId ?? undefined,
        categoryId: editing.categoryId ?? undefined,
        date: editing.date.slice(0, 10),
        nature: editing.nature ?? undefined,
        tags: editing.tags,
        note: editing.note ?? undefined,
        invoiceMonth: editing.invoiceMonth ?? undefined,
      }
    : prefill ?? {}

  const [type, setType] = useState<TransactionType>(init.type ?? "EXPENSE")
  const [amount, setAmount] = useState(moneyInputValue(init.amount))
  const [description, setDescription] = useState(init.description ?? "")
  const [accountId, setAccountId] = useState(init.accountId ?? "")
  const [transferAccountId, setTransferAccountId] = useState(init.transferAccountId ?? "")
  const [categoryId, setCategoryId] = useState(init.categoryId ?? "")
  const [date, setDate] = useState(init.date ?? todayISO())
  const [installments, setInstallments] = useState("1")
  const [nature, setNature] = useState<Nature | "">(init.nature ?? "")
  const [tags, setTags] = useState((init.tags ?? []).map((t) => `#${t}`).join(" "))
  const [note, setNote] = useState(init.note ?? "")
  const [saving, setSaving] = useState(false)

  const typeCategories = useMemo(
    () => categories.filter((c: Category) => c.type === (type === "INCOME" ? "INCOME" : "EXPENSE")),
    [categories, type],
  )
  const account = activeAccounts.find((a) => a.id === accountId)
  const target = activeAccounts.find((a) => a.id === transferAccountId)

  useEffect(() => {
    if (!accountId && activeAccounts.length > 0) {
      const preferred =
        type === "PAYMENT" ? activeAccounts.find((a) => a.type === "CHECKING") : activeAccounts.find((a) => a.type !== "INVESTMENT")
      setAccountId((preferred ?? activeAccounts[0]).id)
    }
  }, [activeAccounts, accountId, type])

  useEffect(() => {
    if (categoryId && !typeCategories.some((c) => c.id === categoryId)) setCategoryId("")
  }, [typeCategories, categoryId])

  const invoiceMonth = (t?: Account) => {
    if (!t || t.type !== "CREDIT_CARD") return undefined
    if (prefill?.invoiceMonth && t.id === prefill.transferAccountId) return prefill.invoiceMonth
    return t.closedInvoice?.month ?? t.openInvoice?.month
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const value = parseMoney(amount)
    if (!Number.isFinite(value) || value <= 0) return toast.error("Informe um valor maior que zero.")
    if (!description.trim()) return toast.error("Descreva o lançamento.")
    if (!accountId) return toast.error("Escolha a conta.")
    if (type === "PAYMENT" && !transferAccountId) return toast.error("Escolha a conta de destino.")

    const body: TransactionInput = {
      type,
      amount: value,
      description: description.trim(),
      accountId,
      date,
      categoryId: type === "PAYMENT" ? undefined : categoryId || undefined,
      transferAccountId: type === "PAYMENT" ? transferAccountId : undefined,
      nature: type === "EXPENSE" && nature ? nature : undefined,
      tags: parseTags(tags),
      note: note.trim() || undefined,
      invoiceMonth: type === "PAYMENT" ? invoiceMonth(target) : undefined,
    }
    setSaving(true)
    try {
      if (editing) {
        await updateTransaction(editing.id, body)
        toast.success("Lançamento atualizado.")
      } else {
        const n = Number(installments)
        await createTransaction({ ...body, totalInstallments: type === "EXPENSE" && n > 1 ? n : undefined })
        toast.success(type === "PAYMENT" ? "Transferência registrada." : "Lançamento salvo.")
        setAmount("")
        setDescription("")
        setTags("")
        setNote("")
        setInstallments("1")
      }
      onDone?.()
    } catch (err) {
      toast.error(errorMessage(err, "Não foi possível salvar."))
    } finally {
      setSaving(false)
    }
  }

  const isPluggy = editing?.source === "PLUGGY"

  async function remove(scope: "one" | "all") {
    if (!editing) return
    const msg = scope === "all" ? "Excluir todas as parcelas desta compra?" : "Excluir este lançamento?"
    if (!window.confirm(msg)) return
    setSaving(true)
    try {
      await deleteTransaction(editing.id, scope)
      toast.success("Lançamento excluído.")
      onDone?.()
    } catch (err) {
      toast.error(errorMessage(err, "Não foi possível excluir."))
    } finally {
      setSaving(false)
    }
  }

  async function markPaid() {
    if (!editing) return
    setSaving(true)
    try {
      await payTransaction(editing.id)
      toast.success("Marcado como pago.")
      onDone?.()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {!isPluggy && <Segmented label="Tipo" options={TYPE_OPTIONS} value={type} onChange={setType} />}

      <Field label="Valor">
        <input
          className={`${inputClass} num h-14 text-2xl font-semibold`}
          inputMode="decimal"
          placeholder="0,00"
          value={amount}
          disabled={isPluggy}
          onChange={(e) => setAmount(e.target.value)}
          autoFocus={autoFocus && !editing}
        />
      </Field>
      <Field label="Descrição">
        <input
          className={inputClass}
          placeholder={type === "PAYMENT" ? "Ex.: Pagamento fatura Nubank" : "Ex.: Mercado do mês"}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={200}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        {type !== "PAYMENT" && (
          <Field label="Categoria">
            <select className={inputClass} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Sem categoria</option>
              {typeCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label={type === "PAYMENT" ? "Da conta" : "Conta"}>
          <select
            className={inputClass}
            value={accountId}
            disabled={isPluggy}
            onChange={(e) => setAccountId(e.target.value)}
          >
            {activeAccounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
                {a.type === "CREDIT_CARD" ? " (cartão)" : ""}
              </option>
            ))}
          </select>
        </Field>
        {type === "PAYMENT" && (
          <Field label="Para a conta">
            <select className={inputClass} value={transferAccountId} onChange={(e) => setTransferAccountId(e.target.value)}>
              <option value="">Escolha…</option>
              {activeAccounts
                .filter((a) => a.id !== accountId)
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                    {a.type === "CREDIT_CARD" ? " (pagar fatura)" : a.type === "INVESTMENT" ? " (aporte)" : ""}
                  </option>
                ))}
            </select>
          </Field>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Data">
          <input type="date" className={inputClass} value={date} disabled={isPluggy} onChange={(e) => setDate(e.target.value)} />
        </Field>
        {type === "EXPENSE" && !editing ? (
          <Field label="Parcelas">
            <select className={inputClass} value={installments} onChange={(e) => setInstallments(e.target.value)}>
              {Array.from({ length: 24 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n === 1 ? "À vista" : `${n}x`}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <div />
        )}
      </div>
      {type === "EXPENSE" && Number(installments) > 1 && (
        <p className="-mt-2 text-xs text-muted-foreground">
          {account?.type === "CREDIT_CARD"
            ? "Cada parcela entra em uma fatura. O limite do cartão é usado pelo valor total."
            : "A 1ª parcela sai hoje; as demais ficam em Compromissos para pagar no mês."}
        </p>
      )}

      {type === "EXPENSE" && (
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-muted-foreground">Por quê? (natureza)</span>
          <Chips
            label="Natureza do gasto"
            options={NATURE_OPTIONS}
            value={nature as Nature}
            onChange={(v) => setNature(v === nature ? "" : v)}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Tags">
          <input className={inputClass} placeholder="#viagem-sp #trabalho" value={tags} onChange={(e) => setTags(e.target.value)} />
        </Field>
        <Field label="Nota">
          <input className={inputClass} placeholder="Opcional" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
        </Field>
      </div>

      <Action type="submit" variant="primary" disabled={saving} className="min-h-12">
        {saving ? "Salvando…" : editing ? "Salvar alterações" : "Salvar lançamento"}
      </Action>
      {editing && (
        <div className="flex flex-wrap gap-2 border-t pt-4">
          {editing.status === "SCHEDULED" && (
            <Action onClick={markPaid} disabled={saving}>
              Marcar como pago
            </Action>
          )}
          {!isPluggy && (
            <Action variant="danger" onClick={() => remove("one")} disabled={saving}>
              {editing.totalInstallments ? "Excluir esta parcela" : "Excluir"}
            </Action>
          )}
          {!isPluggy && editing.totalInstallments && (
            <Action variant="danger" onClick={() => remove("all")} disabled={saving}>
              Excluir todas as parcelas
            </Action>
          )}
        </div>
      )}
    </form>
  )
}
