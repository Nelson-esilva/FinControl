/** Contrato com a API Nest (backend/src). Valores monetários chegam como número (2 casas). */

export type TransactionType = "INCOME" | "EXPENSE" | "PAYMENT"
export type TransactionStatus = "PENDING" | "COMPLETED" | "CANCELLED" | "SCHEDULED"
export type Nature = "ESSENTIAL" | "IMPORTANT" | "SUPERFLUOUS"
export type AccountType = "CHECKING" | "SAVINGS" | "INVESTMENT" | "CREDIT_CARD" | "WALLET" | "OTHER"
export type RecurringType = "FIXED" | "SUBSCRIPTION" | "INSTALLMENT" | "LOAN" | "INCOME"
export type RecurringStatus = "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED"
export type Frequency = "WEEKLY" | "MONTHLY" | "YEARLY"

export interface AccountRef {
  id: string
  name: string
  type: AccountType
  color?: string
}

export interface CategoryRef {
  id: string
  name: string
  color: string
  icon?: string
  type?: TransactionType
}

export interface Category extends CategoryRef {
  type: TransactionType
  description: string | null
  isDefault: boolean
}

export interface Transaction {
  id: string
  amount: number | string
  date: string
  description: string
  type: TransactionType
  status: TransactionStatus
  nature: Nature | null
  note: string | null
  tags: string[]
  installmentNumber: number | null
  totalInstallments: number | null
  parentTransactionId: string | null
  invoiceMonth: string | null
  recurringExpenseId: string | null
  source: "MANUAL" | "PLUGGY"
  accountId: string
  transferAccountId: string | null
  categoryId: string | null
  account: AccountRef
  transferAccount: AccountRef | null
  category: CategoryRef | null
}

export interface TransactionInput {
  amount: number
  date: string
  description: string
  type: TransactionType
  accountId: string
  transferAccountId?: string
  categoryId?: string
  nature?: Nature
  note?: string
  tags?: string[]
  totalInstallments?: number
  invoiceMonth?: string
  status?: TransactionStatus
}

export interface Invoice {
  month: string
  closingDate: string
  dueDate: string
  total: number
  paid: number
  remaining: number
  isOpen: boolean
}

export interface Account {
  id: string
  name: string
  type: AccountType
  institution: string | null
  initialBalance: number
  currentBalance: number
  creditLimit: number | null
  closingDay: number | null
  dueDate: number | null
  color: string
  icon: string
  isActive: boolean
  source: "MANUAL" | "PLUGGY"
  marketValue: number | null
  yieldAmount: number | null
  lastValuationAt: string | null
  openInvoice: Invoice | null
  closedInvoice: Invoice | null
  limitUsedPct: number | null
  netWorthValue: number
}

export interface AccountInput {
  name: string
  type: AccountType
  institution?: string
  initialBalance?: number
  creditLimit?: number
  closingDay?: number
  dueDate?: number
  color?: string
  isActive?: boolean
}

export interface Recurring {
  id: string
  name: string
  description: string | null
  type: RecurringType
  status: RecurringStatus
  amount: number
  frequency: Frequency
  dueDay: number
  startDate: string
  endDate: string | null
  firstInstallment: number
  totalInstallments: number | null
  interestRate: number | null
  color: string
  categoryId: string | null
  accountId: string | null
  category: CategoryRef | null
  account: AccountRef | null
  monthlyAmount: number
  paidCount: number
  remainingInstallments: number | null
  outstanding: number | null
  next: { month: string; dueDate: string; installmentNumber: number | null } | null
}

export interface RecurringInput {
  name: string
  description?: string
  type: RecurringType
  amount: number
  frequency?: Frequency
  dueDay: number
  startDate: string
  endDate?: string | null
  firstInstallment?: number
  totalInstallments?: number | null
  interestRate?: number | null
  categoryId?: string | null
  accountId?: string | null
  status?: RecurringStatus
}

export type BillGroup = "FIXED" | "SUBSCRIPTION" | "INSTALLMENT" | "LOAN" | "INCOME" | "CARD"

export interface Bill {
  id: string
  kind: "RECURRING" | "SCHEDULED" | "CARD_INVOICE"
  refId: string
  name: string
  group: BillGroup
  direction: "IN" | "OUT"
  amount: number
  dueDate: string
  isPaid: boolean
  isOverdue: boolean
  paidAmount: number
  transactionId: string | null
  paidVia: "MANUAL" | "EXTRACT" | null
  installmentNumber: number | null
  totalInstallments: number | null
  viaCard: boolean
  account: AccountRef | null
  category: CategoryRef | null
  color: string
  invoiceMonth: string | null
}

export interface BillsResponse {
  month: string
  items: Bill[]
  totals: {
    out: number
    outPaid: number
    outOpen: number
    in: number
    inReceived: number
    inOpen: number
    overdueCount: number
  }
}

export interface RecurringSummary {
  monthlyOut: number
  monthlyIn: number
  byType: Record<RecurringType, number>
  debtOutstanding: number
  count: number
}

export interface NetWorth {
  cash: number
  investments: number
  cards: number
  loans: number
  total: number
}

export interface Overview {
  month: string
  daysLeft: number
  freeToSpend: number
  perDay: number | null
  expectedIncome: number
  incomeReceived: number
  pendingIncome: number
  spent: number
  pendingCommitments: number
  commitmentsTotal: number
  avgSpent3m: number
  spentVsAvgPct: number | null
  netWorth: NetWorth
  upcoming: Bill[]
  overdue: Bill[]
  topCategories: { id: string | null; name: string; color: string; amount: number; pct: number }[]
  recent: Transaction[]
}

export type SpendingGroupBy = "category" | "account" | "nature" | "weekday" | "tag" | "merchant" | "phase"

export interface SpendingResponse {
  total: number
  count: number
  months: number
  previousTotal?: number
  groups: {
    key: string
    label: string
    color: string
    amount: number
    count: number
    pct: number | null
    previousAmount?: number
  }[]
}

export interface CashflowPoint {
  month: string
  label: string
  income: number
  expense: number
  net: number
}

export interface NetWorthSeries {
  current: NetWorth
  series: { month: string; label: string; value: number }[]
}

export interface BudgetMonth {
  month: string
  pacePct: number
  daysLeft: number
  totals: { limit: number; spent: number; remaining: number; pct: number }
  items: {
    id: string
    category: CategoryRef
    limit: number
    spent: number
    remaining: number
    pct: number
    status: "OK" | "AHEAD" | "OVER"
    perDayLeft: number
  }[]
  unbudgeted: { category: CategoryRef; spent: number }[]
}

export interface BillCandidate {
  id: string
  date: string
  description: string
  amount: number
  accountName: string
}
