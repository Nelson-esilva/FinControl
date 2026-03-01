"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

const TransactionType = {
  INCOME: 'INCOME',
  EXPENSE: 'EXPENSE',
  TRANSFER: 'TRANSFER'
} as const;

type TransactionType = typeof TransactionType[keyof typeof TransactionType];

const TransactionStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
} as const;

type TransactionStatus = typeof TransactionStatus[keyof typeof TransactionStatus];

// ============================================
// VALIDATION SCHEMAS
// ============================================

const transactionSchema = z.object({
  amount: z.number().positive("O valor deve ser maior que zero"),
  date: z.date(),
  description: z.string().min(1, "Descrição é obrigatória"),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER'] as const),
  status: z.string().default('COMPLETED'),
  accountId: z.string().uuid("Conta inválida"),
  categoryId: z.string().uuid("Categoria inválida"),
  installmentNumber: z.number().optional(),
  totalInstallments: z.number().optional(),
  isRecurring: z.boolean().default(false),
  recurringFrequency: z.string().optional(),
})

const updateTransactionSchema = transactionSchema.partial().extend({
  id: z.string().uuid(),
})

// ============================================
// TYPES
// ============================================

export type CreateTransactionInput = z.infer<typeof transactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>

interface ActionResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// ============================================
// CREATE TRANSACTION
// ============================================

export async function createTransaction(
  input: CreateTransactionInput,
  attachments?: File[]
): Promise<ActionResponse> {
  try {
    // Validate input
    const validatedData = transactionSchema.parse(input)

    // Start transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Create transaction
      const transaction = await tx.transaction.create({
        data: {
          amount: validatedData.amount,
          date: validatedData.date,
          description: validatedData.description,
          type: validatedData.type,
          status: validatedData.status,
          accountId: validatedData.accountId,
          categoryId: validatedData.categoryId,
          userId: "user-id", // TODO: Get from session
          installmentNumber: validatedData.installmentNumber,
          totalInstallments: validatedData.totalInstallments,
          isRecurring: validatedData.isRecurring,
          recurringFrequency: validatedData.recurringFrequency,
        },
      })

      // Update account balance
      const balanceChange =
        validatedData.type === TransactionType.INCOME
          ? validatedData.amount
          : -validatedData.amount

      await tx.account.update({
        where: { id: validatedData.accountId },
        data: {
          currentBalance: {
            increment: balanceChange,
          },
        },
      })

      // Handle attachments
      if (attachments && attachments.length > 0) {
        // TODO: Upload to S3/Supabase Storage
        // For now, we'll create attachment records with placeholder URLs
        const attachmentRecords = attachments.map((file) => ({
          url: `/uploads/${file.name}`, // Placeholder
          fileName: file.name,
          fileType: file.type,
          size: file.size,
          transactionId: transaction.id,
        }))

        await tx.attachment.createMany({
          data: attachmentRecords,
        })
      }

      // Create notification for budget alerts
      if (validatedData.type === TransactionType.EXPENSE) {
        await checkBudgetAlerts(tx, validatedData.categoryId, validatedData.amount)
      }

      return transaction
    })

    revalidatePath("/transactions")
    revalidatePath("/dashboard")

    return {
      success: true,
      data: result,
      message: "Transação criada com sucesso!",
    }
  } catch (error) {
    console.error("Error creating transaction:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => e.message).join(", "),
      }
    }

    return {
      success: false,
      error: "Erro ao criar transação. Tente novamente.",
    }
  }
}

// ============================================
// UPDATE TRANSACTION
// ============================================

export async function updateTransaction(
  input: UpdateTransactionInput
): Promise<ActionResponse> {
  try {
    const validatedData = updateTransactionSchema.parse(input)
    const { id, ...updateData } = validatedData

    const result = await prisma.$transaction(async (tx: any) => {
      // Get original transaction
      const originalTransaction = await tx.transaction.findUnique({
        where: { id },
      })

      if (!originalTransaction) {
        throw new Error("Transação não encontrada")
      }

      // Calculate balance adjustment
      let balanceAdjustment = 0

      if (updateData.amount !== undefined || updateData.type !== undefined) {
        const origAmount =
          typeof originalTransaction.amount === "object" && "toNumber" in originalTransaction.amount
            ? (originalTransaction.amount as { toNumber: () => number }).toNumber()
            : Number(originalTransaction.amount)
        // Reverse original transaction
        balanceAdjustment +=
          originalTransaction.type === TransactionType.INCOME ? -origAmount : origAmount

        // Apply new transaction
        const newType = updateData.type || originalTransaction.type
        const newAmountRaw = updateData.amount ?? originalTransaction.amount
        const newAmount =
          typeof newAmountRaw === "object" && newAmountRaw !== null && "toNumber" in newAmountRaw
            ? (newAmountRaw as { toNumber: () => number }).toNumber()
            : Number(newAmountRaw)
        balanceAdjustment += newType === TransactionType.INCOME ? newAmount : -newAmount
      }

      // Update transaction
      const transaction = await tx.transaction.update({
        where: { id },
        data: updateData,
      })

      // Update account balance if needed
      if (balanceAdjustment !== 0) {
        await tx.account.update({
          where: { id: originalTransaction.accountId },
          data: {
            currentBalance: {
              increment: balanceAdjustment,
            },
          },
        })
      }

      return transaction
    })

    revalidatePath("/transactions")
    revalidatePath("/dashboard")

    return {
      success: true,
      data: result,
      message: "Transação atualizada com sucesso!",
    }
  } catch (error) {
    console.error("Error updating transaction:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => e.message).join(", "),
      }
    }

    return {
      success: false,
      error: "Erro ao atualizar transação. Tente novamente.",
    }
  }
}

// ============================================
// DELETE TRANSACTION
// ============================================

export async function deleteTransaction(id: string): Promise<ActionResponse> {
  try {
    await prisma.$transaction(async (tx: any) => {
      // Get transaction
      const transaction = await tx.transaction.findUnique({
        where: { id },
      })

      if (!transaction) {
        throw new Error("Transação não encontrada")
      }

      // Reverse balance change
      const balanceChange =
        transaction.type === TransactionType.INCOME
          ? -transaction.amount
          : transaction.amount

      await tx.account.update({
        where: { id: transaction.accountId },
        data: {
          currentBalance: {
            increment: balanceChange,
          },
        },
      })

      // Delete attachments
      await tx.attachment.deleteMany({
        where: { transactionId: id },
      })

      // Delete transaction
      await tx.transaction.delete({
        where: { id },
      })
    })

    revalidatePath("/transactions")
    revalidatePath("/dashboard")

    return {
      success: true,
      message: "Transação excluída com sucesso!",
    }
  } catch (error) {
    console.error("Error deleting transaction:", error)
    return {
      success: false,
      error: "Erro ao excluir transação. Tente novamente.",
    }
  }
}

// ============================================
// GET TRANSACTIONS
// ============================================

export async function getTransactions(filters?: {
  startDate?: Date
  endDate?: Date
  categoryId?: string
  accountId?: string
  type?: TransactionType
  status?: TransactionStatus
}): Promise<ActionResponse> {
  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        AND: [
          filters?.startDate ? { date: { gte: filters.startDate } } : {},
          filters?.endDate ? { date: { lte: filters.endDate } } : {},
          filters?.categoryId ? { categoryId: filters.categoryId } : {},
          filters?.accountId ? { accountId: filters.accountId } : {},
          filters?.type ? { type: filters.type as any } : {},
          filters?.status ? { status: filters.status as any } : {},
        ],
      },
      include: {
        account: true,
        category: true,
        attachments: true,
      },
      orderBy: {
        date: "desc",
      },
    })

    return {
      success: true,
      data: transactions,
    }
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return {
      success: false,
      error: "Erro ao buscar transações. Tente novamente.",
    }
  }
}

// ============================================
// GET TRANSACTION BY ID
// ============================================

export async function getTransactionById(
  id: string
): Promise<ActionResponse> {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        account: true,
        category: true,
        attachments: true,
      },
    })

    if (!transaction) {
      return {
        success: false,
        error: "Transação não encontrada",
      }
    }

    return {
      success: true,
      data: transaction,
    }
  } catch (error) {
    console.error("Error fetching transaction:", error)
    return {
      success: false,
      error: "Erro ao buscar transação. Tente novamente.",
    }
  }
}

// ============================================
// UPLOAD ATTACHMENT
// ============================================

export async function uploadAttachment(
  transactionId: string,
  file: File
): Promise<ActionResponse> {
  try {
    // TODO: Implement actual S3/Supabase Storage upload
    // For now, create a placeholder attachment record

    const attachment = await prisma.attachment.create({
      data: {
        url: `/uploads/${file.name}`, // Placeholder
        fileName: file.name,
        fileType: file.type,
        size: file.size,
        transactionId,
      },
    })

    return {
      success: true,
      data: attachment,
      message: "Anexo enviado com sucesso!",
    }
  } catch (error) {
    console.error("Error uploading attachment:", error)
    return {
      success: false,
      error: "Erro ao enviar anexo. Tente novamente.",
    }
  }
}

// ============================================
// DELETE ATTACHMENT
// ============================================

export async function deleteAttachment(id: string): Promise<ActionResponse> {
  try {
    await prisma.attachment.delete({
      where: { id },
    })

    return {
      success: true,
      message: "Anexo excluído com sucesso!",
    }
  } catch (error) {
    console.error("Error deleting attachment:", error)
    return {
      success: false,
      error: "Erro ao excluir anexo. Tente novamente.",
    }
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function checkBudgetAlerts(
  tx: any,
  categoryId: string,
  amount: number
) {
  // Get current month's budget for category
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const budget = await tx.budget.findFirst({
    where: {
      categoryId,
      startDate: { lte: startOfMonth },
      endDate: { gte: endOfMonth },
      isActive: true,
    },
  })

  if (!budget) return

  // Calculate total spent in category
  const totalSpent = await tx.transaction.aggregate({
    where: {
      categoryId,
      type: TransactionType.EXPENSE,
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
      status: TransactionStatus.COMPLETED,
    },
    _sum: {
      amount: true,
    },
  })

  const spent = totalSpent._sum.amount?.toNumber() || 0
  const budgetAmount = budget.amount.toNumber()
  const percentage = (spent / budgetAmount) * 100

  // Check for 80% alert
  if (budget.alertAt80 && percentage >= 80 && percentage < 100) {
    await tx.notification.create({
      data: {
        title: "Orçamento próximo do limite",
        message: `Você atingiu ${percentage.toFixed(0)}% do orçamento de ${budget.categoryId}`,
        type: "BUDGET_ALERT",
        userId: budget.userId,
        data: {
          budgetId: budget.id,
          categoryId,
          percentage,
        },
      },
    })
  }

  // Check for 100% alert
  if (budget.alertAt100 && percentage >= 100) {
    await tx.notification.create({
      data: {
        title: "Orçamento excedido",
        message: `Você excedeu o orçamento de ${budget.categoryId}`,
        type: "BUDGET_ALERT",
        userId: budget.userId,
        data: {
          budgetId: budget.id,
          categoryId,
          percentage,
        },
      },
    })
  }
}

// ============================================
// GET DASHBOARD DATA
// ============================================

export async function getDashboardData(): Promise<ActionResponse> {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Get total balance
    const accounts = await prisma.account.findMany({
      where: { isActive: true },
    })
    const totalBalance = accounts.reduce(
      (acc: any, account: any) => acc + account.currentBalance.toNumber(),
      0
    )

    // Get monthly income
    const monthlyIncome = await prisma.transaction.aggregate({
      where: {
        type: TransactionType.INCOME,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        status: TransactionStatus.COMPLETED,
      },
      _sum: {
        amount: true,
      },
    })

    // Get monthly expense
    const monthlyExpense = await prisma.transaction.aggregate({
      where: {
        type: TransactionType.EXPENSE,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        status: TransactionStatus.COMPLETED,
      },
      _sum: {
        amount: true,
      },
    })

    // Get recent transactions
    const recentTransactions = await prisma.transaction.findMany({
      take: 5,
      orderBy: { date: "desc" },
      include: {
        account: true,
        category: true,
        attachments: true,
      },
    })

    // Get category spending
    const categorySpending = await prisma.transaction.groupBy({
      by: ["categoryId"],
      where: {
        type: TransactionType.EXPENSE,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        status: TransactionStatus.COMPLETED,
      },
      _sum: {
        amount: true,
      },
    })

    return {
      success: true,
      data: {
        totalBalance,
        monthlyIncome: monthlyIncome._sum.amount?.toNumber() || 0,
        monthlyExpense: monthlyExpense._sum.amount?.toNumber() || 0,
        netBalance:
          (monthlyIncome._sum.amount?.toNumber() || 0) -
          (monthlyExpense._sum.amount?.toNumber() || 0),
        recentTransactions,
        categorySpending,
      },
    }
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return {
      success: false,
      error: "Erro ao buscar dados do dashboard. Tente novamente.",
    }
  }
}
