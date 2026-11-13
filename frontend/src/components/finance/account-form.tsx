"use client"

import { useState } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Action } from "./ui"
import { Field, inputClass, moneyInputValue, parseMoney } from "./form"
import { addValuation, createAccount, deleteAccount, errorMessage, updateAccount } from "@/lib/finance/client"
import { ACCOUNT_TYPE_LABEL, PALETTE, money, todayISO } from "@/lib/finance/format"
import type { Account, AccountInput, AccountType } from "@/lib/finance/types"

const TYPES = Object.keys(ACCOUNT_TYPE_LABEL) as AccountType[]

function balanceLabel(type: AccountType) {
  if (type === "CREDIT_CARD") return "Já usado do limite (opcional)"
  if (type === "INVESTMENT") return "Total aplicado até hoje"
  return "Saldo atual"
}

export function AccountForm({ editing, onDone }: { editing?: Account | null; onDone: () => void }) {
  const [type, setType] = useState<AccountType>(editing?.type ?? "CHECKING")
  const [name, setName] = useState(editing?.name ?? "")
  const [institution, setInstitution] = useState(editing?.institution ?? "")
  const initial = editing ? (editing.type === "CREDIT_CARD" ? -editing.initialBalance : editing.initialBalance) : undefined
  const [balance, setBalance] = useState(moneyInputValue(initial))
  const [limit, setLimit] = useState(moneyInputValue(editing?.creditLimit))
  const [closingDay, setClosingDay] = useState(editing?.closingDay ? String(editing.closingDay) : "")
  const [dueDay, setDueDay] = useState(editing?.dueDate ? String(editing.dueDate) : "")
  const [color, setColor] = useState(editing?.color ?? PALETTE[0])
  const [active, setActive] = useState(editing?.isActive ?? true)
  const [saving, setSaving] = useState(false)
  const isCard = type === "CREDIT_CARD"
  const isPluggy = editing?.source === "PLUGGY"

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return toast.error("Dê um nome à conta.")
    const value = balance ? parseMoney(balance) : 0
    if (!Number.isFinite(value)) return toast.error("Valor inválido.")
    if (isCard && (!closingDay || !dueDay)) return toast.error("Informe o dia de fechamento e de vencimento da fatura.")
    const body: AccountInput = {
      name: name.trim(),
      type,
      institution: institution.trim() || undefined,
      color,
      isActive: active,
      ...(isPluggy ? {} : { initialBalance: isCard ? -Math.abs(value) : value }),
      ...(isCard ? { creditLimit: limit ? parseMoney(limit) : undefined, closingDay: Number(closingDay), dueDate: Number(dueDay) } : {}),
    }
    setSaving(true)
    try {
      if (editing) await updateAccount(editing.id, body)
      else await createAccount(body)
      toast.success(editing ? "Conta atualizada." : "Conta criada.")
      onDone()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!editing || !window.confirm(`Excluir “${editing.name}” e todos os lançamentos dela? Prefira desativar se quiser manter o histórico.`)) return
    setSaving(true)
    try {
      await deleteAccount(editing.id)
      toast.success("Conta excluída.")
      onDone()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Tipo">
          <select className={inputClass} value={type} disabled={!!editing} onChange={(e) => setType(e.target.value as AccountType)}>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {ACCOUNT_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Instituição">
          <input className={inputClass} value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="Ex.: Itaú" maxLength={80} />
        </Field>
      </div>
      <Field label="Nome">
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder={isCard ? "Ex.: Nubank" : "Ex.: Conta Itaú"} maxLength={80} />
      </Field>
      {!isPluggy && (
        <Field
          label={balanceLabel(type)}
          hint={editing ? "Alterar o saldo de abertura desloca o saldo atual pela mesma diferença." : undefined}
        >
          <input className={`${inputClass} num`} inputMode="decimal" placeholder="0,00" value={balance} onChange={(e) => setBalance(e.target.value)} />
        </Field>
      )}
      {isCard && (
        <div className="grid grid-cols-3 gap-3">
          <Field label="Limite">
            <input className={`${inputClass} num`} inputMode="decimal" value={limit} onChange={(e) => setLimit(e.target.value)} />
          </Field>
          <Field label="Fecha dia">
            <input className={inputClass} type="number" min={1} max={31} value={closingDay} onChange={(e) => setClosingDay(e.target.value)} />
          </Field>
          <Field label="Vence dia">
            <input className={inputClass} type="number" min={1} max={31} value={dueDay} onChange={(e) => setDueDay(e.target.value)} />
          </Field>
        </div>
      )}
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-medium text-muted-foreground">Cor</span>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Cor">
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={color === c}
              aria-label={c}
              onClick={() => setColor(c)}
              className={cn("h-9 w-9 rounded-full ring-offset-2 ring-offset-card", color === c && "ring-2 ring-foreground")}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>
      {editing && (
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input type="checkbox" className="h-4 w-4" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Conta ativa (desative para esconder sem perder o histórico)
        </label>
      )}
      <Action type="submit" variant="primary" disabled={saving} className="min-h-12">
        {editing ? "Salvar conta" : "Criar conta"}
      </Action>
      {editing && (
        <Action variant="danger" onClick={remove} disabled={saving}>
          Excluir conta
        </Action>
      )}
    </form>
  )
}

export function ValuationForm({ account, onDone }: { account: Account; onDone: () => void }) {
  const [value, setValue] = useState(moneyInputValue(account.marketValue ?? account.currentBalance))
  const [date, setDate] = useState(todayISO())
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const v = parseMoney(value)
    if (!(v >= 0)) return toast.error("Informe o valor atual.")
    setSaving(true)
    try {
      await addValuation(account.id, v, date)
      toast.success("Valor atualizado.")
      onDone()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Aplicado (aportes − resgates): <strong className="num text-foreground">{money(account.currentBalance)}</strong>. Informe quanto vale hoje, como
        aparece no app da corretora.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Valor de mercado">
          <input className={`${inputClass} num`} inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
        </Field>
        <Field label="Data">
          <input className={inputClass} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>
      <Action type="submit" variant="primary" disabled={saving} className="min-h-12">
        Salvar valor
      </Action>
    </form>
  )
}
