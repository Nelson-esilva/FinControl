/**
 * API functions for recurring expenses module.
 */
import { apiGet, apiPost, apiPut, apiDelete, hasApi } from "./api"

export interface ApiRecurringExpense {
    id: string
    name: string
    description: string | null
    type: "FIXED" | "INSTALLMENT" | "CREDIT_CARD" | "LOAN" | "SUBSCRIPTION"
    status: "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED"
    amount: number | { toNumber?: () => number }
    frequency: "WEEKLY" | "MONTHLY" | "YEARLY"
    dueDay: number | null
    startDate: string
    endDate: string | null
    currentInstallment: number | null
    totalInstallments: number | null
    interestRate: number | null
    cardName: string | null
    color: string
    icon: string
    nextDueDate: string | null
    categoryId: string | null
    category?: { id: string; name: string; color?: string } | null
    createdAt: string
    updatedAt: string
}

export interface RecurringSummary {
    totalMonthly: number
    totalFixed: number
    totalInstallments: number
    totalLoans: number
    fixedCount: number
    installmentsCount: number
    loansCount: number
    totalCount: number
}

export async function fetchRecurringExpenses(params?: {
    type?: string
    status?: string
}): Promise<ApiRecurringExpense[]> {
    if (!hasApi) return []
    try {
        const q = new URLSearchParams()
        if (params?.type) q.set("type", params.type)
        if (params?.status) q.set("status", params.status)
        const path = q.toString() ? `/recurring-expenses?${q}` : "/recurring-expenses"
        const list = await apiGet<ApiRecurringExpense[]>(path)
        return Array.isArray(list) ? list : []
    } catch {
        return []
    }
}

export async function fetchRecurringSummary(): Promise<RecurringSummary | null> {
    if (!hasApi) return null
    try {
        return await apiGet<RecurringSummary>("/recurring-expenses/summary")
    } catch {
        return null
    }
}

export async function createRecurringExpense(body: {
    name: string
    type: string
    amount: number
    startDate: string
    description?: string
    frequency?: string
    dueDay?: number
    endDate?: string
    currentInstallment?: number
    totalInstallments?: number
    interestRate?: number
    cardName?: string
    color?: string
    icon?: string
    categoryId?: string
    accountId?: string
}): Promise<ApiRecurringExpense | null> {
    if (!hasApi) return null
    try {
        return await apiPost<ApiRecurringExpense>("/recurring-expenses", body)
    } catch {
        return null
    }
}

export async function updateRecurringExpense(
    id: string,
    body: Partial<{
        name: string
        type: string
        amount: number
        status: string
        description: string
        frequency: string
        dueDay: number
        startDate: string
        endDate: string
        currentInstallment: number
        totalInstallments: number
        interestRate: number
        cardName: string
        color: string
        icon: string
        categoryId: string
        accountId: string
    }>
): Promise<ApiRecurringExpense | null> {
    if (!hasApi) return null
    try {
        return await apiPut<ApiRecurringExpense>(`/recurring-expenses/${id}`, body)
    } catch {
        return null
    }
}

export async function deleteRecurringExpense(id: string): Promise<boolean> {
    if (!hasApi) return false
    try {
        await apiDelete(`/recurring-expenses/${id}`)
        return true
    } catch {
        return false
    }
}
