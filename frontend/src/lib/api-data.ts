/**
 * Dados da API para dashboard, transações, contas e orçamentos.
 * Usado quando NEXT_PUBLIC_API_URL está definido.
 */

import { apiGet, apiPost, apiPut, apiDelete, hasApi } from "./api"

function toNum(v: unknown): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v
  if (typeof v === "object" && v !== null && "toNumber" in (v as { toNumber?: () => number }))
    return (v as { toNumber: () => number }).toNumber()
  const n = Number(v)
  return Number.isNaN(n) ? 0 : n
}

export interface DashboardData {
  totalBalance: number
  monthlyIncome: number
  monthlyExpense: number
  monthlyBalance: number
  monthlySummary?: Array<{ month: string; income: number; expense: number; balance: number }>
  recentTransactions: Array<{
    id: string
    description: string
    category: string
    categoryColor: string
    account: string
    date: string
    amount: number
    type: string
  }>
  categorySummary: Array<{ name: string; value: number; color: string }>
}

export async function fetchDashboard(): Promise<DashboardData | null> {
  if (!hasApi) return null
  try {
    const data = await apiGet<DashboardData>("/dashboard")
    return data
  } catch {
    return null
  }
}

export interface ApiTransaction {
  id: string
  amount: number | { toNumber?: () => number }
  date: string
  description: string
  type: string
  status: string
  accountId: string
  categoryId: string
  account?: { name: string; id: string; type?: string }
  category?: { name: string; id: string; color?: string }
}

export interface ApiAccount {
  id: string
  name: string
  type: string
  currentBalance: number | { toNumber?: () => number }
  creditLimit?: number | { toNumber?: () => number } | null
  color?: string
}

export interface ApiCategory {
  id: string
  name: string
  type: string
  color?: string
}

export interface ApiBudget {
  id: string
  amount: number | { toNumber?: () => number }
  period: string
  startDate: string
  endDate: string
  categoryId: string
  category?: ApiCategory
  spent?: number
  alertAt80?: boolean
  alertAt100?: boolean
}

export async function fetchTransactions(params?: {
  type?: string
  accountId?: string
  categoryId?: string
  from?: string
  to?: string
}): Promise<ApiTransaction[]> {
  if (!hasApi) return []
  try {
    const q = new URLSearchParams()
    if (params?.type) q.set("type", params.type)
    if (params?.accountId) q.set("accountId", params.accountId)
    if (params?.categoryId) q.set("categoryId", params.categoryId)
    if (params?.from) q.set("from", params.from)
    if (params?.to) q.set("to", params.to)
    const path = q.toString() ? `/transactions?${q}` : "/transactions"
    const list = await apiGet<ApiTransaction[]>(path)
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export async function fetchAccounts(): Promise<ApiAccount[]> {
  if (!hasApi) return []
  try {
    const list = await apiGet<ApiAccount[]>("/accounts")
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export async function fetchCategories(type?: "INCOME" | "EXPENSE"): Promise<ApiCategory[]> {
  if (!hasApi) return []
  try {
    const path = type ? `/categories?type=${type}` : "/categories"
    const list = await apiGet<ApiCategory[]>(path)
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export async function fetchBudgets(): Promise<ApiBudget[]> {
  if (!hasApi) return []
  try {
    const list = await apiGet<ApiBudget[]>("/budgets")
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export async function createTransaction(body: {
  amount: number
  date: string
  description: string
  type: string
  status?: string
  accountId: string
  categoryId: string
  installmentNumber?: number
  totalInstallments?: number
}): Promise<ApiTransaction | null> {
  if (!hasApi) return null
  try {
    const created = await apiPost<ApiTransaction>("/transactions", body)
    return created
  } catch {
    return null
  }
}

export async function updateTransaction(
  id: string,
  body: {
    amount?: number
    date?: string
    description?: string
    type?: string
    status?: string
    accountId?: string
    categoryId?: string
    installmentNumber?: number
    totalInstallments?: number
  }
): Promise<ApiTransaction | null> {
  if (!hasApi) return null
  try {
    const updated = await apiPut<ApiTransaction>(`/transactions/${id}`, body)
    return updated
  } catch {
    return null
  }
}

export async function deleteTransaction(id: string): Promise<boolean> {
  if (!hasApi) return false
  try {
    await apiDelete(`/transactions/${id}`)
    return true
  } catch {
    return false
  }
}

export async function createAccount(body: {
  name: string
  type: string
  initialBalance?: number
  color?: string
  creditLimit?: number
  dueDate?: number
}): Promise<ApiAccount | null> {
  if (!hasApi) return null
  try {
    const created = await apiPost<ApiAccount>("/accounts", body)
    return created
  } catch {
    return null
  }
}

export async function updateAccount(
  id: string,
  body: { name?: string; type?: string; color?: string; creditLimit?: number; dueDate?: number }
): Promise<ApiAccount | null> {
  if (!hasApi) return null
  try {
    const updated = await apiPut<ApiAccount>(`/accounts/${id}`, body)
    return updated
  } catch {
    return null
  }
}

export async function deleteAccount(id: string): Promise<boolean> {
  if (!hasApi) return false
  try {
    await apiDelete(`/accounts/${id}`)
    return true
  } catch {
    return false
  }
}

export async function createCategory(body: {
  name: string
  type: string
  color?: string
}): Promise<ApiCategory | null> {
  if (!hasApi) return null
  try {
    const created = await apiPost<ApiCategory>("/categories", body)
    return created
  } catch {
    return null
  }
}

export async function createBudget(body: {
  amount: number
  categoryId: string
  period?: string
  startDate: string
  endDate: string
  alertAt80?: boolean
  alertAt100?: boolean
}): Promise<ApiBudget | null> {
  if (!hasApi) return null
  try {
    const created = await apiPost<ApiBudget>("/budgets", body)
    return created
  } catch {
    return null
  }
}

export async function updateBudget(
  id: string,
  body: {
    amount?: number
    categoryId?: string
    period?: string
    startDate?: string
    endDate?: string
    alertAt80?: boolean
    alertAt100?: boolean
  }
): Promise<ApiBudget | null> {
  if (!hasApi) return null
  try {
    const updated = await apiPut<ApiBudget>(`/budgets/${id}`, body)
    return updated
  } catch {
    return null
  }
}

export async function deleteBudget(id: string): Promise<boolean> {
  if (!hasApi) return false
  try {
    await apiDelete(`/budgets/${id}`)
    return true
  } catch {
    return false
  }
}

export { toNum, hasApi }
