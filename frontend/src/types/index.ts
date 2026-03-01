export const AccountType = {
  CHECKING: 'CHECKING',
  SAVINGS: 'SAVINGS',
  INVESTMENT: 'INVESTMENT',
  CREDIT_CARD: 'CREDIT_CARD',
  WALLET: 'WALLET',
  OTHER: 'OTHER'
} as const;
export type AccountType = typeof AccountType[keyof typeof AccountType];

export const TransactionType = {
  INCOME: 'INCOME',
  EXPENSE: 'EXPENSE',
  TRANSFER: 'TRANSFER'
} as const;
export type TransactionType = typeof TransactionType[keyof typeof TransactionType];

export const TransactionStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  SCHEDULED: 'SCHEDULED'
} as const;
export type TransactionStatus = typeof TransactionStatus[keyof typeof TransactionStatus];

export const NotificationType = {
  BUDGET_ALERT: 'BUDGET_ALERT',
  DUE_DATE: 'DUE_DATE',
  SYSTEM: 'SYSTEM',
  TRANSACTION: 'TRANSACTION'
} as const;
export type NotificationType = typeof NotificationType[keyof typeof NotificationType];

// ============================================
// USER TYPES
// ============================================
export interface User {
  id: string
  email: string
  name: string | null
  avatar: string | null
  createdAt: Date
  updatedAt: Date
}

// ============================================
// ACCOUNT TYPES
// ============================================
export interface Account {
  id: string
  name: string
  type: AccountType
  initialBalance: number
  currentBalance: number
  creditLimit: number | null
  dueDate: number | null
  color: string
  icon: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  userId: string
}

export interface AccountWithStats extends Account {
  usedCredit?: number
  availableCredit?: number
  utilizationRate?: number
}

// ============================================
// CATEGORY TYPES
// ============================================
export interface Category {
  id: string
  name: string
  type: TransactionType
  color: string
  icon: string
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
  userId: string
}

// ============================================
// TRANSACTION TYPES
// ============================================
export interface Transaction {
  id: string
  amount: number
  date: Date
  description: string
  type: TransactionType
  status: TransactionStatus
  installmentNumber: number | null
  totalInstallments: number | null
  parentTransactionId: string | null
  isRecurring: boolean
  recurringFrequency: string | null
  createdAt: Date
  updatedAt: Date
  userId: string
  accountId: string
  categoryId: string
  account: Account
  category: Category
  attachments: Attachment[]
}

export interface TransactionWithRelations extends Transaction {
  account: Account
  category: Category
  attachments: Attachment[]
}

export interface CreateTransactionInput {
  amount: number
  date: Date
  description: string
  type: TransactionType
  status: TransactionStatus
  accountId: string
  categoryId: string
  installmentNumber?: number
  totalInstallments?: number
  isRecurring?: boolean
  recurringFrequency?: string
  attachments?: File[]
}

// ============================================
// ATTACHMENT TYPES
// ============================================
export interface Attachment {
  id: string
  url: string
  fileName: string
  fileType: string
  size: number
  createdAt: Date
  transactionId: string
}

// ============================================
// BUDGET TYPES
// ============================================
export interface Budget {
  id: string
  amount: number
  period: string
  startDate: Date
  endDate: Date
  alertAt80: boolean
  alertAt100: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  userId: string
  categoryId: string
  category: Category
}

export interface BudgetWithSpending extends Budget {
  spent: number
  remaining: number
  percentage: number
  isNearLimit: boolean
  isOverLimit: boolean
}

// ============================================
// NOTIFICATION TYPES
// ============================================
export interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  isRead: boolean
  data: Record<string, unknown> | null
  createdAt: Date
  userId: string
}

// ============================================
// DASHBOARD TYPES
// ============================================
export interface DashboardKPI {
  totalBalance: number
  monthlyIncome: number
  monthlyExpense: number
  netBalance: number
  balanceChange: number
  incomeChange: number
  expenseChange: number
  netChange: number
}

export interface MonthlyData {
  month: string
  income: number
  expense: number
  balance: number
}

export interface CategorySpending {
  category: Category
  amount: number
  percentage: number
}

// ============================================
// CHART TYPES
// ============================================
export interface ChartDataPoint {
  name: string
  value: number
  color?: string
}

export interface AreaChartData {
  month: string
  income: number
  expense: number
  balance: number
}

// ============================================
// FILTER TYPES
// ============================================
export interface TransactionFilters {
  search?: string
  startDate?: Date
  endDate?: Date
  categoryId?: string
  accountId?: string
  type?: TransactionType
  status?: TransactionStatus
}

// ============================================
// API RESPONSE TYPES
// ============================================
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
