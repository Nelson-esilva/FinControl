"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Action } from "./ui"
import { Field, inputClass, moneyInputValue, parseMoney } from "./form"
import { createRecurring, deleteRecurring, errorMessage, fetchAccounts, fetchCategories, updateRecurring } from "@/lib/finance/client"
import { FREQUENCY_LABEL, RECURRING_LABEL, todayISO } from "@/lib/finance/format"
import { useApi } from "@/lib/hooks/use-api"
import type { Frequency, Recurring, RecurringInput, RecurringType } from "@/lib/finance/types"

const TYPES = Object.keys(RECURRING_LABEL) as RecurringType[]
const HINT: Record<RecurringType, string> = {
  FIXED: "Aluguel, condomínio, internet, escola.",
  SUBSCRIPTION: "Streaming, apps, academia.",
  INSTALLMENT: "Carnê ou parcelamento fora do cartão. Compras parceladas no cartão: lance como gasto em N vezes.",
  LOAN: "Empréstimo ou financiamento com número de parcelas.",
  INCOME: "Salário e outras entradas fixas — alimentam o “Livre para gastar”.",
}

export function RecurringForm({ editing, onDone }: { editing?: Recurring | null; onDone: () => void }) {
  const { data: accounts = [] } = useApi(fetchAccounts, [])
  const { data: categories = [] } = useApi(() => fetchCategories(), [])

  const [type, setType] = useState<RecurringType>(editing?.type ?? "FIXED")
  const [name, setName] = useState(editing?.name ?? "")
  const [amount, setAmount] = useState(moneyInputValue(editing?.amount))
  const [frequency, setFrequency] = useState<Frequency>(editing?.frequency ?? "MONTHLY")
  const [dueDay, setDueDay] = useState(String(editing?.dueDay ?? new Date().getDate()))
  const [startDate, setStartDate] = useState(editing?.startDate.slice(0, 10) ?? todayISO())
  const [endDate, setEndDate] = useState(editing?.endDate?.slice(0, 10) ?? "")
  const [firstInstallment, setFirstInstallment] = useState(String(editing?.firstInstallment ?? 1))
  const [totalInstallments, setTotalInstallments] = useState(editing?.totalInstallments ? String(editing.totalInstallments) : "")
  const [interestRate, setInterestRate] = useState(editing?.interestRate != null ? String(editing.interestRate) : "")
  const [categoryId, setCategoryId] = useState(editing?.categoryId ?? "")
  const [accountId, setAccountId] = useState(editing?.accountId ?? "")
  const [paused, setPaused] = useState(editing?.status === "PAUSED")
  const [saving, setSaving] = useState(false)

  const isInstallment = type === "INSTALLMENT" || type === "LOAN"
  const cats = useMemo(
    () => categories.filter((c) => c.type === (type === "INCOME" ? "INCOME" : "EXPENSE")),
    [categories, type],
  )

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const value = parseMoney(amount)
    const day = Number(dueDay)
    if (!name.trim()) return toast.error("Dê um nome ao compromisso.")
    if (!Number.isFinite(value) || value <= 0) return toast.error("Informe o valor.")
    if (!(day >= 1 && day <= 31)) return toast.error("Dia de vencimento entre 1 e 31.")
    if (isInstallment && !(Number(totalInstallments) >= 1)) return toast.error("Informe o total de parcelas.")
    if (isInstallment && Number(firstInstallment) > Number(totalInstallments))
      return toast.error("A parcela atual não pode passar do total.")

    const body: RecurringInput = {
      type,
      name: name.trim(),
      amount: value,
      frequency: isInstallment ? "MONTHLY" : frequency,
      dueDay: day,
      startDate,
      endDate: !isInstallment && endDate ? endDate : null,
      firstInstallment: isInstallment ? Number(firstInstallment) || 1 : 1,
      totalInstallments: isInstallment ? Number(totalInstallments) : null,
      interestRate: type === "LOAN" && interestRate ? Number(interestRate.replace(",", ".")) : null,
      categoryId: categoryId || null,
      accountId: accountId || null,
    }
    setSaving(true)
    try {
      if (editing) {
        const status = paused ? "PAUSED" : editing.status === "PAUSED" ? "ACTIVE" : undefined
        await updateRecurring(editing.id, { ...body, ...(status ? { status } : {}) })
        toast.success("Compromisso atualizado.")
      } else {
        await createRecurring(body)
        toast.success("Compromisso criado.")
      }
      onDone()
    } catch (err) {
      toast.error(errorMessage(err, "Não foi possível salvar."))
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!editing || !window.confirm(`Excluir “${editing.name}”? Os pagamentos já lançados continuam no extrato.`)) return
    setSaving(true)
    try {
      await deleteRecurring(editing.id)
      toast.success("Compromisso excluído.")
      onDone()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field label="Tipo" hint={HINT[type]}>
        <select className={inputClass} value={type} onChange={(e) => setType(e.target.value as RecurringType)}>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {RECURRING_LABEL[t]}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_160px]">
        <Field label="Nome">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Aluguel" maxLength={80} />
        </Field>
        <Field label={isInstallment ? "Valor da parcela" : "Valor"}>
          <input className={`${inputClass} num`} inputMode="decimal" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {!isInstallment && (
          <Field label="Frequência">
            <select className={inputClass} value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)}>
              {(Object.keys(FREQUENCY_LABEL) as Frequency[]).map((f) => (
                <option key={f} value={f}>
                  {FREQUENCY_LABEL[f]}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label={type === "INCOME" ? "Dia do recebimento" : "Dia do vencimento"}>
          <input className={inputClass} type="number" min={1} max={31} value={dueDay} onChange={(e) => setDueDay(e.target.value)} />
        </Field>
        <Field label={isInstallment ? "Mês da parcela atual" : "Começa em"}>
          <input className={inputClass} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </Field>
        {!isInstallment && (
          <Field label="Termina em (opcional)">
            <input className={inputClass} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </Field>
        )}
      </div>
      {isInstallment && (
        <div className="grid grid-cols-3 gap-3">
          <Field label="Parcela atual">
            <input className={inputClass} type="number" min={1} value={firstInstallment} onChange={(e) => setFirstInstallment(e.target.value)} />
          </Field>
          <Field label="Total">
            <input className={inputClass} type="number" min={1} value={totalInstallments} onChange={(e) => setTotalInstallments(e.target.value)} />
          </Field>
          {type === "LOAN" ? (
            <Field label="Juros % a.m.">
              <input className={inputClass} inputMode="decimal" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} />
            </Field>
          ) : (
            <div />
          )}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Categoria">
          <select className={inputClass} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Sem categoria</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label={type === "INCOME" ? "Recebe em" : "Paga com"}>
          <select className={inputClass} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            <option value="">Escolher ao pagar</option>
            {accounts
              .filter((a) => a.isActive && (type === "INCOME" ? a.type !== "CREDIT_CARD" : true))
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
          </select>
        </Field>
      </div>
      {editing && (
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-[hsl(var(--primary))]" checked={paused} onChange={(e) => setPaused(e.target.checked)} />
          Pausado (não aparece nos meses até reativar)
        </label>
      )}
      <Action type="submit" variant="primary" disabled={saving} className="min-h-12">
        {saving ? "Salvando…" : editing ? "Salvar alterações" : "Criar compromisso"}
      </Action>
      {editing && (
        <Action variant="danger" onClick={remove} disabled={saving}>
          Excluir compromisso
        </Action>
      )}
    </form>
  )
}
