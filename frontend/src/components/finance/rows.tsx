"use client"

import { ArrowRightLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, Badge, Dot, Money } from "./ui"
import { BILL_GROUP_LABEL, NATURE_LABEL, dayOfMonth, weekdayShort } from "@/lib/finance/format"
import type { Bill, Transaction } from "@/lib/finance/types"

export function DateStack({ iso }: { iso: string }) {
  return (
    <div className="flex w-11 shrink-0 flex-col text-center">
      <span className="text-[11px] uppercase text-muted-foreground">{weekdayShort(iso)}</span>
      <span className="num text-lg font-semibold leading-tight">{String(dayOfMonth(iso)).padStart(2, "0")}</span>
    </div>
  )
}

/** Valor com sinal: receita azul, gasto neutro, transferência apagada. */
export function TxAmount({ tx, className }: { tx: Transaction; className?: string }) {
  const n = Number(tx.amount)
  if (tx.type === "INCOME") return <Money value={n} sign className={cn("font-semibold text-income", className)} />
  if (tx.type === "PAYMENT") return <Money value={n} className={cn("font-semibold text-muted-foreground", className)} />
  return <Money value={-n} className={cn("font-semibold", className)} />
}

export function TransactionRow({
  tx,
  onClick,
  showNature = true,
  compactMeta,
}: {
  tx: Transaction
  onClick?: () => void
  showNature?: boolean
  compactMeta?: string
}) {
  const color = tx.type === "PAYMENT" ? "#8B8CFF" : tx.category?.color ?? "#9AA1AD"
  const where =
    tx.type === "PAYMENT" ? `${tx.account.name} → ${tx.transferAccount?.name ?? "?"}` : tx.account.name
  const label =
    tx.totalInstallments && tx.installmentNumber
      ? `${tx.description} (${tx.installmentNumber}/${tx.totalInstallments})`
      : tx.description
  const Tag = onClick ? "button" : "div"
  return (
    <Tag
      {...(onClick ? { type: "button" as const, onClick } : {})}
      className={cn(
        "flex min-h-16 w-full items-center gap-3.5 border-b py-2 text-left last:border-b-0",
        onClick && "rounded-lg transition-colors hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      {tx.type === "PAYMENT" ? (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-primary/15 text-primary" aria-hidden>
          <ArrowRightLeft className="h-4 w-4" />
        </div>
      ) : (
        <Avatar text={tx.description} color={color} />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-medium">{label}</span>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {compactMeta ?? (
            <>
              <span style={{ color: tx.type === "PAYMENT" ? undefined : color }}>
                {tx.type === "PAYMENT" ? "Transferência" : tx.category?.name ?? "Sem categoria"}
              </span>
              <span aria-hidden>·</span>
              <span className="truncate">{where}</span>
              {tx.status === "SCHEDULED" && <Badge tone="warning">Agendado</Badge>}
              {showNature && tx.nature && <Badge>{NATURE_LABEL[tx.nature]}</Badge>}
              {tx.tags.slice(0, 2).map((t) => (
                <span key={t} className="text-primary">
                  #{t}
                </span>
              ))}
            </>
          )}
        </span>
      </div>
      <TxAmount tx={tx} className="text-sm" />
    </Tag>
  )
}

export function BillMini({ bill }: { bill: Bill }) {
  const meta = [
    BILL_GROUP_LABEL[bill.group],
    bill.installmentNumber && bill.totalInstallments ? `Parcela ${bill.installmentNumber} de ${bill.totalInstallments}` : null,
    bill.account?.name,
  ]
    .filter(Boolean)
    .join(" · ")
  return (
    <div className="flex min-h-[52px] items-center gap-3.5 border-t py-1.5 first:border-t-0">
      <DateStack iso={bill.dueDate} />
      <Dot color={bill.color} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{bill.name}</span>
        <span className="truncate text-xs text-muted-foreground">{meta}</span>
      </div>
      <Money
        value={bill.direction === "IN" ? bill.amount : bill.amount}
        sign={bill.direction === "IN"}
        className={cn("text-sm font-semibold", bill.direction === "IN" && "text-income")}
      />
    </div>
  )
}
