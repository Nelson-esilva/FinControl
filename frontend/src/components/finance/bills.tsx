"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Badge, Bar, Money, SmallAction } from "./ui"
import { DateStack } from "./rows"
import { useQuickAdd } from "./quick-add"
import { errorMessage, payRecurring, payTransaction, undoPayRecurring, unpayTransaction } from "@/lib/finance/client"
import { BILL_GROUP_LABEL, dayOfMonth, money } from "@/lib/finance/format"
import type { Bill } from "@/lib/finance/types"

/**
 * Ações de pagar/desfazer por tipo de item:
 * compromisso → cria lançamento real; parcela agendada → paga o lançamento; fatura → abre transferência.
 */
export function useBillActions(month: string, openPayDialog: (b: Bill) => void) {
  const quickAdd = useQuickAdd()
  const [busy, setBusy] = useState<string | null>(null)

  async function run(bill: Bill, fn: () => Promise<unknown>, success: string, undo?: () => Promise<unknown>) {
    setBusy(bill.id)
    try {
      await fn()
      toast.success(success, undo ? { action: { label: "Desfazer", onClick: () => void undo().catch((e) => toast.error(errorMessage(e))) } } : undefined)
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  function pay(bill: Bill) {
    if (bill.kind === "CARD_INVOICE") {
      quickAdd.open({
        type: "PAYMENT",
        transferAccountId: bill.refId,
        amount: Math.max(0, bill.amount - bill.paidAmount),
        description: `Pagamento ${bill.name.toLowerCase()}`,
        invoiceMonth: bill.invoiceMonth ?? undefined,
      })
      return
    }
    if (bill.kind === "SCHEDULED") {
      return run(bill, () => payTransaction(bill.refId), "Parcela paga.", () => unpayTransaction(bill.refId))
    }
    if (!bill.account) return openPayDialog(bill)
    return run(
      bill,
      () => payRecurring(bill.refId, { month }),
      bill.direction === "IN" ? `${bill.name} recebido.` : `${bill.name} pago.`,
      () => undoPayRecurring(bill.refId, month),
    )
  }

  function undo(bill: Bill) {
    if (bill.kind === "CARD_INVOICE") return
    if (bill.kind === "SCHEDULED") return run(bill, () => unpayTransaction(bill.refId), "Pagamento desfeito.")
    const extract = bill.paidVia === "EXTRACT"
    return run(bill, () => undoPayRecurring(bill.refId, month), extract ? "Vínculo com o extrato removido." : "Pagamento desfeito.")
  }

  return { pay, undo, busy }
}

export function BillRow({
  bill,
  onPay,
  onUndo,
  onDetails,
  busy,
}: {
  bill: Bill
  onPay: () => void
  onUndo: () => void
  onDetails?: () => void
  busy?: boolean
}) {
  const progress =
    bill.installmentNumber && bill.totalInstallments ? (bill.installmentNumber / bill.totalInstallments) * 100 : null
  const meta = [
    bill.kind === "CARD_INVOICE"
      ? bill.paidAmount > 0 && !bill.isPaid
        ? `Pago ${money(bill.paidAmount)}`
        : "Calculada das compras"
      : bill.account?.name ?? "Conta a escolher",
    bill.viaCard ? "entra na fatura" : null,
    bill.paidVia === "EXTRACT" ? "vinculado ao extrato" : null,
    bill.category?.name,
  ]
    .filter(Boolean)
    .join(" · ")
  const payLabel = bill.direction === "IN" ? "Receber" : "Pagar"
  const doneLabel = bill.direction === "IN" ? "Recebido" : "Pago"

  return (
    <div className="flex min-h-[72px] flex-wrap items-center gap-3.5 border-b py-2 last:border-b-0">
      <DateStack iso={bill.dueDate} />
      <div className="flex min-w-0 flex-[1_1_200px] flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          {onDetails ? (
            <button type="button" onClick={onDetails} className="text-left text-sm font-medium hover:underline">
              {bill.name}
            </button>
          ) : (
            <span className="text-sm font-medium">{bill.name}</span>
          )}
          <Badge tone={bill.direction === "IN" ? "income" : bill.group === "CARD" ? "warning" : "neutral"}>
            {BILL_GROUP_LABEL[bill.group]}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground">{meta}</span>
        {progress != null && (
          <div className="flex items-center gap-2">
            <Bar pct={progress} color={bill.color} className="h-1 max-w-[220px] flex-1" />
            <span className="text-xs text-muted-foreground">
              Parcela {bill.installmentNumber} de {bill.totalInstallments}
            </span>
          </div>
        )}
      </div>
      <Money
        value={bill.amount}
        sign={bill.direction === "IN"}
        className={cn("min-w-[100px] text-right text-[15px] font-semibold", bill.direction === "IN" && "text-income")}
      />
      {bill.isPaid ? (
        <SmallAction
          done
          disabled={busy || bill.kind === "CARD_INVOICE"}
          onClick={onUndo}
          label={bill.kind === "CARD_INVOICE" ? doneLabel : `${doneLabel} — clique para desfazer`}
        >
          <Check className="h-3.5 w-3.5" /> {doneLabel}
        </SmallAction>
      ) : (
        <SmallAction disabled={busy} onClick={onPay}>
          {busy ? "…" : payLabel}
        </SmallAction>
      )}
    </div>
  )
}

/** Calendário do mês com os vencimentos de cada dia. */
export function BillCalendar({ month, bills, onSelect }: { month: string; bills: Bill[]; onSelect: (b: Bill) => void }) {
  const [y, m] = month.split("-").map(Number)
  const firstWeekday = new Date(Date.UTC(y, m - 1, 1)).getUTCDay()
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const cells: (number | null)[] = [...Array(firstWeekday).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)]
  const byDay = new Map<number, Bill[]>()
  for (const b of bills) byDay.set(dayOfMonth(b.dueDate), [...(byDay.get(dayOfMonth(b.dueDate)) ?? []), b])

  return (
    <div className="overflow-x-auto rounded-2xl border bg-card p-3">
      <div className="grid min-w-[640px] grid-cols-7 gap-1.5 text-xs">
        {["dom", "seg", "ter", "qua", "qui", "sex", "sáb"].map((d) => (
          <div key={d} className="px-2 py-1 font-medium uppercase text-muted-foreground">
            {d}
          </div>
        ))}
        {cells.map((day, i) => (
          <div key={i} className={cn("min-h-[92px] rounded-xl p-2", day ? "bg-background" : "")}>
            {day && (
              <>
                <span className="num text-[13px] font-semibold text-muted-foreground">{day}</span>
                <div className="mt-1 flex flex-col gap-1">
                  {(byDay.get(day) ?? []).map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => onSelect(b)}
                      className={cn(
                        "truncate rounded-md px-1.5 py-1 text-left text-[11px] font-medium",
                        b.isPaid ? "bg-income/15 text-income line-through decoration-1" : b.isOverdue ? "bg-expense/15 text-expense" : "bg-secondary",
                      )}
                      title={`${b.name} · ${money(b.amount)}`}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
