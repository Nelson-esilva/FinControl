import type { AccountType, Nature, RecurringType, BillGroup, Frequency } from "./types"

/** Datas de negócio chegam às 12:00 UTC; formatar em UTC evita trocar o dia. */
const UTC = { timeZone: "UTC" } as const

export const num = (v: unknown): number => {
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

export function money(value: unknown, opts: { sign?: boolean } = {}): string {
  const n = num(value)
  const s = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Math.abs(n))
  if (n < 0) return `−${s}`
  if (opts.sign && n > 0) return `+${s}`
  return s
}

export function compactMoney(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

export function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export const currentMonth = () => todayISO().slice(0, 7)

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number)
  const d = new Date(Date.UTC(y, m - 1 + delta, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
}

export function monthBounds(month: string): { from: string; to: string } {
  const [y, m] = month.split("-").map(Number)
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, "0")}` }
}

export function monthTitle(month: string): string {
  const [y, m] = month.split("-").map(Number)
  const name = new Intl.DateTimeFormat("pt-BR", { month: "long", ...UTC }).format(new Date(Date.UTC(y, m - 1, 15)))
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${y}`
}

export function monthName(month: string): string {
  return monthTitle(month).split(" ")[0]
}

export function shortDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", ...UTC }).format(new Date(iso))
}

export function fullDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", ...UTC }).format(new Date(iso))
}

export function weekdayShort(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short", ...UTC }).format(new Date(iso)).replace(".", "")
}

export const dayOfMonth = (iso: string) => new Date(iso).getUTCDate()

/** "Hoje · sexta, 13 nov" / "Ontem · ..." / "terça, 10 nov" */
export function dayHeading(isoDay: string): string {
  const label = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "short", ...UTC })
    .format(new Date(`${isoDay}T12:00:00Z`))
    .replace(".", "")
  const today = todayISO()
  const yesterday = new Date(`${today}T12:00:00Z`)
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  if (isoDay === today) return `Hoje · ${label}`
  if (isoDay === yesterday.toISOString().slice(0, 10)) return `Ontem · ${label}`
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function daysUntil(iso: string): number {
  const today = new Date(`${todayISO()}T12:00:00Z`).getTime()
  return Math.round((new Date(iso).getTime() - today) / 86_400_000)
}

export function initials(text: string): string {
  const words = text.replace(/[^\p{L}\p{N} ]/gu, "").trim().split(/\s+/)
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? words[0]?.[1] ?? "")).toUpperCase() || "•"
}

export const NATURE_LABEL: Record<Nature, string> = {
  ESSENTIAL: "Essencial",
  IMPORTANT: "Importante",
  SUPERFLUOUS: "Supérfluo",
}

export const RECURRING_LABEL: Record<RecurringType, string> = {
  FIXED: "Fixa",
  SUBSCRIPTION: "Assinatura",
  INSTALLMENT: "Parcelamento",
  LOAN: "Empréstimo",
  INCOME: "Receita fixa",
}

export const BILL_GROUP_LABEL: Record<BillGroup, string> = {
  ...RECURRING_LABEL,
  CARD: "Fatura",
}

export const FREQUENCY_LABEL: Record<Frequency, string> = {
  WEEKLY: "Semanal",
  MONTHLY: "Mensal",
  YEARLY: "Anual",
}

export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  CHECKING: "Conta corrente",
  SAVINGS: "Poupança",
  INVESTMENT: "Investimento",
  CREDIT_CARD: "Cartão de crédito",
  WALLET: "Dinheiro",
  OTHER: "Outra",
}

/** Paleta categórica do design (contraste validado no tema escuro). */
export const PALETTE = ["#8B8CFF", "#5CC8FF", "#6ED3A8", "#FF9F6B", "#F7C948", "#E68AD8", "#F47A8F", "#B48CFF", "#4FD1C5", "#9AA1AD"]
