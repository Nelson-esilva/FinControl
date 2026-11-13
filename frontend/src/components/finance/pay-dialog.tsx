"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Action } from "./ui"
import { FormDialog } from "./form-dialog"
import { Field, inputClass, moneyInputValue, parseMoney } from "./form"
import { errorMessage, fetchAccounts, fetchBillCandidates, payRecurring } from "@/lib/finance/client"
import { money, shortDate } from "@/lib/finance/format"
import { useApi } from "@/lib/hooks/use-api"
import type { Bill } from "@/lib/finance/types"

/** Pagar/receber um compromisso escolhendo conta, valor e data — ou vincular a uma linha do extrato. */
export function PayDialog({ bill, month, onClose }: { bill: Bill | null; month: string; onClose: () => void }) {
  return (
    <FormDialog
      open={!!bill}
      onOpenChange={(o) => !o && onClose()}
      title={bill ? `${bill.direction === "IN" ? "Receber" : "Pagar"} ${bill.name}` : ""}
      description="O lançamento entra no extrato da conta escolhida e atualiza o saldo."
    >
      {bill && <PayForm key={bill.id} bill={bill} month={month} onClose={onClose} />}
    </FormDialog>
  )
}

function PayForm({ bill, month, onClose }: { bill: Bill; month: string; onClose: () => void }) {
  const { data: accounts = [] } = useApi(fetchAccounts, [])
  const { data: candidates = [] } = useApi(() => fetchBillCandidates(bill.refId, month), [bill.refId, month])
  const [accountId, setAccountId] = useState(bill.account?.id ?? "")
  const [amount, setAmount] = useState(moneyInputValue(bill.amount))
  const [date, setDate] = useState(bill.dueDate.slice(0, 10))
  const [saving, setSaving] = useState(false)

  async function pay(transactionId?: string) {
    const value = parseMoney(amount)
    if (!transactionId && !accountId) return toast.error("Escolha a conta.")
    if (!transactionId && !(value > 0)) return toast.error("Informe o valor.")
    setSaving(true)
    try {
      await payRecurring(bill.refId, transactionId ? { month, transactionId } : { month, accountId, amount: value, date })
      toast.success(transactionId ? "Vinculado ao extrato." : bill.direction === "IN" ? "Recebimento registrado." : "Pagamento registrado.")
      onClose()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Field label="Conta">
        <select className={inputClass} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
          <option value="">Escolha…</option>
          {accounts
            .filter((a) => a.isActive && (bill.direction === "IN" ? a.type !== "CREDIT_CARD" : true))
            .map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
                {a.type === "CREDIT_CARD" ? " (entra na fatura)" : ""}
              </option>
            ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Valor">
          <input className={`${inputClass} num`} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Data">
          <input className={inputClass} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>
      <Action variant="primary" onClick={() => pay()} disabled={saving} className="min-h-12">
        {saving ? "Salvando…" : bill.direction === "IN" ? "Confirmar recebimento" : "Confirmar pagamento"}
      </Action>
      {candidates.length > 0 && (
        <div className="flex flex-col gap-2 border-t pt-4">
          <span className="text-[13px] font-medium text-muted-foreground">Ou vincular a uma linha do extrato do banco</span>
          {candidates.map((c) => (
            <button
              key={c.id}
              type="button"
              disabled={saving}
              onClick={() => pay(c.id)}
              className="flex min-h-11 items-center justify-between gap-3 rounded-xl border px-3 text-left text-sm hover:bg-accent"
            >
              <span className="min-w-0 truncate">
                {shortDate(c.date)} · {c.description} <span className="text-muted-foreground">· {c.accountName}</span>
              </span>
              <span className="num font-semibold">{money(c.amount)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
