/**
 * Cliente de domínio. Leitura sem API configurada devolve vazio (fallback de hasApi);
 * escrita sempre lança erro com a mensagem do backend.
 */
import { apiDelete, apiGet, apiPatch, apiPost, apiPut, hasApi } from "@/lib/api"
import { todayISO } from "./format"
import type {
  Account,
  AccountInput,
  BillCandidate,
  BillsResponse,
  BudgetMonth,
  CashflowPoint,
  Category,
  NetWorthSeries,
  Overview,
  Recurring,
  RecurringInput,
  RecurringSummary,
  SpendingGroupBy,
  SpendingResponse,
  Transaction,
  TransactionInput,
} from "./types"

/** Extrai a mensagem do erro do Nest ({ message }) lançado por api.ts. */
export function errorMessage(err: unknown, fallback = "Algo deu errado."): string {
  const raw = err instanceof Error ? err.message : String(err ?? "")
  try {
    const parsed = JSON.parse(raw) as { message?: string | string[] }
    if (Array.isArray(parsed.message)) return parsed.message.join(" ")
    if (parsed.message) return parsed.message
  } catch {
    /* não era JSON */
  }
  return raw || fallback
}

const qs = (params: Record<string, string | number | undefined | null>) => {
  const s = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") s.set(k, String(v))
  const out = s.toString()
  return out ? `?${out}` : ""
}

async function read<T>(path: string, empty: T): Promise<T> {
  if (!hasApi) return empty
  return apiGet<T>(path)
}

function requireApi() {
  if (!hasApi) throw new Error("API não configurada (NEXT_PUBLIC_API_URL).")
}

/** Avisa as telas abertas que os dados mudaram (useApi recarrega). */
export function notifyDataChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("fincontrol:changed"))
}

async function write<T>(fn: () => Promise<T>): Promise<T> {
  requireApi()
  const result = await fn()
  notifyDataChanged()
  return result
}

// ---------- Lançamentos ----------
export interface TransactionQuery {
  from?: string
  to?: string
  type?: string
  accountId?: string
  categoryId?: string
  nature?: string
  tag?: string
  q?: string
  installments?: "1"
}
export const fetchTransactions = (f: TransactionQuery = {}) =>
  read<Transaction[]>(`/transactions${qs({ ...f })}`, [])
export const fetchTags = () => read<string[]>("/transactions/tags", [])
export const createTransaction = (body: TransactionInput) => write(() => apiPost<Transaction>("/transactions", body))
export const updateTransaction = (id: string, body: Partial<TransactionInput>) =>
  write(() => apiPut<Transaction>(`/transactions/${id}`, body))
export const payTransaction = (id: string) => write(() => apiPatch<Transaction>(`/transactions/${id}/pay`))
export const unpayTransaction = (id: string) => write(() => apiPatch<Transaction>(`/transactions/${id}/unpay`))
export const deleteTransaction = (id: string, scope: "one" | "all" = "one") =>
  write(() => apiDelete(`/transactions/${id}${qs({ scope })}`))

// ---------- Contas ----------
export const fetchAccounts = () => read<Account[]>(`/accounts${qs({ today: todayISO() })}`, [])
export const createAccount = (body: AccountInput) => write(() => apiPost<Account>("/accounts", body))
export const updateAccount = (id: string, body: Partial<AccountInput>) =>
  write(() => apiPut<Account>(`/accounts/${id}`, body))
export const deleteAccount = (id: string) => write(() => apiDelete(`/accounts/${id}`))
export const addValuation = (id: string, value: number, date?: string) =>
  write(() => apiPost(`/accounts/${id}/valuations`, { value, date }))

// ---------- Categorias ----------
export const fetchCategories = (type?: "INCOME" | "EXPENSE") =>
  read<Category[]>(`/categories${qs({ type })}`, [])
export const createCategory = (body: { name: string; type: "INCOME" | "EXPENSE"; color?: string }) =>
  write(() => apiPost<Category>("/categories", body))
export const updateCategory = (id: string, body: { name?: string; color?: string }) =>
  write(() => apiPut<Category>(`/categories/${id}`, body))
export const deleteCategory = (id: string) => write(() => apiDelete(`/categories/${id}`))

// ---------- Compromissos ----------
export const fetchRecurring = () => read<Recurring[]>(`/recurring-expenses${qs({ today: todayISO() })}`, [])
export const fetchRecurringSummary = () =>
  read<RecurringSummary | null>("/recurring-expenses/summary", null)
export const fetchBills = (month: string) =>
  read<BillsResponse | null>(`/recurring-expenses/bills/${month}${qs({ today: todayISO() })}`, null)
export const fetchBillCandidates = (id: string, month: string) =>
  read<BillCandidate[]>(`/recurring-expenses/${id}/candidates${qs({ month })}`, [])
export const createRecurring = (body: RecurringInput) => write(() => apiPost<Recurring>("/recurring-expenses", body))
export const updateRecurring = (id: string, body: Partial<RecurringInput>) =>
  write(() => apiPut<Recurring>(`/recurring-expenses/${id}`, body))
export const deleteRecurring = (id: string) => write(() => apiDelete(`/recurring-expenses/${id}`))
export const payRecurring = (
  id: string,
  body: { month: string; accountId?: string; transactionId?: string; amount?: number; date?: string },
) => write(() => apiPost(`/recurring-expenses/${id}/pay`, body))
export const undoPayRecurring = (id: string, month: string) =>
  write(() => apiPost(`/recurring-expenses/${id}/undo-pay`, { month }))

// ---------- Orçamento ----------
export const fetchBudgetMonth = (month: string) =>
  read<BudgetMonth | null>(`/budgets${qs({ month, today: todayISO() })}`, null)
export const upsertBudget = (categoryId: string, amount: number) =>
  write(() => apiPost("/budgets", { categoryId, amount }))
export const deleteBudget = (id: string) => write(() => apiDelete(`/budgets/${id}`))

// ---------- Análises ----------
export const fetchOverview = (month: string) =>
  read<Overview | null>(`/analytics/overview${qs({ month, today: todayISO() })}`, null)
export const fetchSpending = (from: string, to: string, groupBy: SpendingGroupBy, compare = false) =>
  read<SpendingResponse | null>(`/analytics/spending${qs({ from, to, groupBy, compare: compare ? 1 : undefined })}`, null)
export const fetchCashflow = (months = 6) =>
  read<CashflowPoint[]>(`/analytics/cashflow${qs({ months, today: todayISO() })}`, [])
export const fetchNetWorth = (months = 12) =>
  read<NetWorthSeries | null>(`/analytics/net-worth${qs({ months, today: todayISO() })}`, null)
