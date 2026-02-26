"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { formatCurrency, formatPercentage } from "@/lib/utils"
import {
  Plus,
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Edit,
  Trash2,
  MoreHorizontal,
  PieChart,
} from "lucide-react"
import {
  fetchBudgets,
  fetchCategories,
  createBudget,
  updateBudget,
  deleteBudget,
  hasApi,
  toNum,
} from "@/lib/api-data"

const periodLabels: Record<string, string> = {
  WEEKLY: "Semanal",
  MONTHLY: "Mensal",
  YEARLY: "Anual",
  FIXED: "Fixas",
}

type BudgetRow = {
  id: string
  category: { name: string; color: string }
  amount: number
  spent: number
  period: string
  periodLabel: string
  alertAt80: boolean
  alertAt100: boolean
  categoryId: string
  startDate: string
  endDate: string
}

// ============================================
// BUDGET CARD COMPONENT
// ============================================

interface BudgetCardProps {
  budget: BudgetRow
  onEdit?: (budget: BudgetRow) => void
  onDelete?: (budget: BudgetRow) => void
}

function BudgetCard({ budget, onEdit, onDelete }: BudgetCardProps) {
  const percentage = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0
  const remaining = budget.amount - budget.spent
  const isNearLimit = percentage >= 80 && percentage < 100
  const isOverLimit = percentage >= 100

  return (
    <Card className="card-hover">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${budget.category.color}20` }}
            >
              <div
                className="h-5 w-5 rounded-full"
                style={{ backgroundColor: budget.category.color }}
              />
            </div>
            <div>
              <h3 className="font-semibold">{budget.category.name}</h3>
              <Badge variant="secondary" className="text-xs">
                {budget.periodLabel}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {hasApi && (onEdit || onDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit?.(budget)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDelete?.(budget)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {isOverLimit && (
              <AlertTriangle className="h-5 w-5 text-rose-500" />
            )}
            {isNearLimit && !isOverLimit && (
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            )}
            {!isNearLimit && !isOverLimit && percentage >= 50 && (
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            )}
            {!isNearLimit && !isOverLimit && percentage < 50 && (
              <TrendingDown className="h-5 w-5 text-emerald-500" />
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                {formatCurrency(budget.spent)} de {formatCurrency(budget.amount)}
              </span>
              <span
                className={`text-sm font-medium ${isOverLimit
                    ? "text-rose-600"
                    : isNearLimit
                      ? "text-amber-600"
                      : "text-emerald-600"
                  }`}
              >
                {formatPercentage(percentage)}
              </span>
            </div>
            <Progress
              value={Math.min(percentage, 100)}
              className="h-2"
              indicatorClassName={
                isOverLimit
                  ? "bg-rose-500"
                  : isNearLimit
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground mb-1">Restante</p>
              <p
                className={`font-semibold ${remaining < 0 ? "text-rose-600" : "text-emerald-600"
                  }`}
              >
                {formatCurrency(remaining)}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <p className="font-semibold text-sm">
                {isOverLimit ? (
                  <span className="text-rose-600">Excedido</span>
                ) : isNearLimit ? (
                  <span className="text-amber-600">Próximo do limite</span>
                ) : (
                  <span className="text-emerald-600">Dentro do orçamento</span>
                )}
              </p>
            </div>
          </div>

          {(isNearLimit || isOverLimit) && (
            <div
              className={`p-3 rounded-lg text-sm ${isOverLimit
                  ? "bg-rose-50 text-rose-700 dark:bg-rose-900/20"
                  : "bg-amber-50 text-amber-700 dark:bg-amber-900/20"
                }`}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">
                  {isOverLimit
                    ? "Você excedeu o orçamento!"
                    : "Você está próximo do limite!"}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// BUDGET FORM (CREATE / EDIT)
// ============================================

type BudgetFormInitial = {
  id: string
  categoryId: string
  amount: number
  period: string
  startDate: string
  endDate: string
  alertAt80: boolean
  alertAt100: boolean
}

function BudgetForm({
  onClose,
  onSuccess,
  categories: formCategories,
  initialBudget,
}: {
  onClose: () => void
  onSuccess?: () => void
  categories: Array<{ id: string; name: string; color?: string }>
  initialBudget?: BudgetFormInitial | null
}) {
  const isEdit = Boolean(initialBudget)
  const [categoryId, setCategoryId] = useState(initialBudget?.categoryId ?? "")
  const [amount, setAmount] = useState(initialBudget ? String(initialBudget.amount) : "")
  const [period, setPeriod] = useState(initialBudget?.period ?? "MONTHLY")
  const [startDate, setStartDate] = useState(initialBudget?.startDate ?? "")
  const [endDate, setEndDate] = useState(initialBudget?.endDate ?? "")
  const [alertAt80, setAlertAt80] = useState(initialBudget?.alertAt80 ?? true)
  const [alertAt100, setAlertAt100] = useState(initialBudget?.alertAt100 ?? true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const numAmount = parseFloat(amount)
    if (!amount || Number.isNaN(numAmount) || numAmount <= 0) {
      setError("Informe um valor válido.")
      return
    }
    if (!categoryId) {
      setError("Selecione a categoria.")
      return
    }
    if (!startDate || !endDate) {
      setError("Informe data de início e fim.")
      return
    }
    if (!hasApi) {
      setError("Não foi possível conectar. Verifique as configurações do aplicativo.")
      return
    }
    setSaving(true)
    try {
      const body = {
        amount: numAmount,
        categoryId,
        period,
        startDate,
        endDate,
        alertAt80,
        alertAt100,
      }
      if (isEdit && initialBudget) {
        const updated = await updateBudget(initialBudget.id, body)
        if (updated) {
          onSuccess?.()
          onClose()
        } else {
          setError("Falha ao atualizar orçamento.")
        }
      } else {
        const created = await createBudget(body)
        if (created) {
          onSuccess?.()
          onClose()
        } else {
          setError("Falha ao criar orçamento.")
        }
      }
    } catch {
      setError("Não foi possível conectar ao servidor. Tente novamente mais tarde.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">{error}</p>
      )}
      <div className="space-y-2">
        <Label>Categoria</Label>
        <Select value={categoryId} onValueChange={setCategoryId} disabled={isEdit}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione a categoria" />
          </SelectTrigger>
          <SelectContent>
            {formCategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: cat.color ?? "#6366f1" }}
                  />
                  {cat.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Valor do Orçamento</Label>
        <Input
          type="number"
          step="0.01"
          placeholder="0,00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Período</Label>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="WEEKLY">Semanal</SelectItem>
            <SelectItem value="MONTHLY">Mensal</SelectItem>
            <SelectItem value="YEARLY">Anual</SelectItem>
            <SelectItem value="FIXED">Fixas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data início</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Data fim</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="alert-80">Alerta aos 80%</Label>
            <p className="text-xs text-muted-foreground">
              Receber notificação ao atingir 80% do orçamento
            </p>
          </div>
          <Switch id="alert-80" checked={alertAt80} onCheckedChange={setAlertAt80} />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="alert-100">Alerta aos 100%</Label>
            <p className="text-xs text-muted-foreground">
              Receber notificação ao atingir 100% do orçamento
            </p>
          </div>
          <Switch id="alert-100" checked={alertAt100} onCheckedChange={setAlertAt100} />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Salvando…" : isEdit ? "Salvar alterações" : "Criar Orçamento"}
        </Button>
      </div>
    </form>
  )
}

// ============================================
// MAIN BUDGET PAGE
// ============================================

export default function BudgetPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<BudgetRow | null>(null)
  const [apiBudgets, setApiBudgets] = useState<BudgetRow[]>([])
  const [apiCategories, setApiCategories] = useState<Array<{ id: string; name: string; color?: string }>>([])
  const [loading, setLoading] = useState(true)

  const refetch = () => {
    if (!hasApi) return
    fetchBudgets().then((list) => {
      setApiBudgets(
        list.map((b) => ({
          id: b.id,
          category: {
            name: b.category?.name ?? "",
            color: b.category?.color ?? "#6366f1",
          },
          amount: toNum(b.amount),
          spent: typeof b.spent === "number" ? b.spent : 0,
          period: b.period ?? "MONTHLY",
          periodLabel: periodLabels[b.period ?? "MONTHLY"] ?? b.period ?? "Mensal",
          alertAt80: (b as { alertAt80?: boolean }).alertAt80 ?? true,
          alertAt100: (b as { alertAt100?: boolean }).alertAt100 ?? true,
          categoryId: b.categoryId,
          startDate: b.startDate?.slice?.(0, 10) ?? "",
          endDate: b.endDate?.slice?.(0, 10) ?? "",
        }))
      )
    })
  }

  useEffect(() => {
    if (!hasApi) {
      setLoading(false)
      return
    }
    Promise.all([fetchBudgets(), fetchCategories()])
      .then(([list, cats]) => {
        setApiBudgets(
          list.map((b) => ({
            id: b.id,
            category: {
              name: b.category?.name ?? "",
              color: b.category?.color ?? "#6366f1",
            },
            amount: toNum(b.amount),
            spent: typeof b.spent === "number" ? b.spent : 0,
            period: b.period ?? "MONTHLY",
            periodLabel: periodLabels[b.period ?? "MONTHLY"] ?? b.period ?? "Mensal",
            alertAt80: b.alertAt80 ?? true,
            alertAt100: b.alertAt100 ?? true,
            categoryId: b.categoryId,
            startDate: b.startDate?.slice?.(0, 10) ?? "",
            endDate: b.endDate?.slice?.(0, 10) ?? "",
          }))
        )
        setApiCategories(cats.map((c) => ({ id: c.id, name: c.name, color: c.color })))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const listBudgets: BudgetRow[] = apiBudgets
  const listCategories = apiCategories

  const totalBudget = listBudgets.reduce((acc, b) => acc + b.amount, 0)
  const totalSpent = listBudgets.reduce((acc, b) => acc + b.spent, 0)
  const totalRemaining = totalBudget - totalSpent
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  const exceededBudgets = listBudgets.filter((b) => b.spent > b.amount)
  const nearLimitBudgets = listBudgets.filter(
    (b) => b.amount > 0 && b.spent / b.amount >= 0.8 && b.spent <= b.amount
  )

  const toFormInitial = (row: BudgetRow): BudgetFormInitial => ({
    id: row.id,
    categoryId: row.categoryId,
    amount: row.amount,
    period: row.period,
    startDate: row.startDate,
    endDate: row.endDate,
    alertAt80: row.alertAt80,
    alertAt100: row.alertAt100,
  })

  const handleDelete = async (row: BudgetRow) => {
    if (!hasApi) return
    if (!window.confirm("Excluir este orçamento?")) return
    const ok = await deleteBudget(row.id)
    if (ok) refetch()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orçamento</h1>
          <p className="text-muted-foreground">
            Defina metas e controle seus gastos por categoria
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Orçamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Orçamento</DialogTitle>
            </DialogHeader>
            <BudgetForm
              onClose={() => setIsDialogOpen(false)}
              onSuccess={() => { refetch(); setIsDialogOpen(false) }}
              categories={listCategories}
            />
          </DialogContent>
        </Dialog>
        <Dialog open={editingBudget !== null} onOpenChange={(open) => !open && setEditingBudget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Orçamento</DialogTitle>
            </DialogHeader>
            {editingBudget && (
              <BudgetForm
                onClose={() => setEditingBudget(null)}
                onSuccess={() => { refetch(); setEditingBudget(null) }}
                categories={listCategories}
                initialBudget={toFormInitial(editingBudget)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Orçamento Total</p>
                <p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p>
              </div>
              <div className="rounded-xl bg-indigo-100 p-3">
                <Target className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Gasto</p>
                <p className="text-2xl font-bold text-rose-600">
                  {formatCurrency(totalSpent)}
                </p>
              </div>
              <div className="rounded-xl bg-rose-100 p-3">
                <TrendingDown className="h-5 w-5 text-rose-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Restante</p>
                <p
                  className={`text-2xl font-bold ${totalRemaining >= 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                >
                  {formatCurrency(totalRemaining)}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-100 p-3">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Utilização</p>
                <p
                  className={`text-2xl font-bold ${overallPercentage > 100
                      ? "text-rose-600"
                      : overallPercentage > 80
                        ? "text-amber-600"
                        : "text-emerald-600"
                    }`}
                >
                  {formatPercentage(overallPercentage)}
                </p>
              </div>
              <div className="rounded-xl bg-blue-100 p-3">
                <PieChart className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(exceededBudgets.length > 0 || nearLimitBudgets.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {exceededBudgets.length > 0 && (
            <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 dark:bg-rose-900/20 dark:border-rose-800">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                <h3 className="font-semibold text-rose-700 dark:text-rose-400">
                  Orçamentos Excedidos
                </h3>
              </div>
              <p className="text-sm text-rose-600 dark:text-rose-400">
                Você excedeu o orçamento em{" "}
                {exceededBudgets.map((b) => b.category.name).join(", ")}.
                Considere ajustar seus gastos.
              </p>
            </div>
          )}
          {nearLimitBudgets.length > 0 && (
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <h3 className="font-semibold text-amber-700 dark:text-amber-400">
                  Próximo do Limite
                </h3>
              </div>
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Você está próximo do limite em{" "}
                {nearLimitBudgets.map((b) => b.category.name).join(", ")}.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Progresso Geral</CardTitle>
          <CardDescription>
            Visão consolidada de todos os orçamentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {formatCurrency(totalSpent)} de {formatCurrency(totalBudget)}
              </span>
              <span
                className={`text-sm font-medium ${overallPercentage > 100
                    ? "text-rose-600"
                    : overallPercentage > 80
                      ? "text-amber-600"
                      : "text-emerald-600"
                  }`}
              >
                {formatPercentage(overallPercentage)}
              </span>
            </div>
            <Progress
              value={Math.min(overallPercentage, 100)}
              className="h-3"
              indicatorClassName={
                overallPercentage > 100
                  ? "bg-rose-500"
                  : overallPercentage > 80
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              }
            />
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="text-muted-foreground">
                    {listBudgets.filter((b) => b.amount > 0 && b.spent / b.amount < 0.8).length} dentro do orçamento
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                  <span className="text-muted-foreground">
                    {nearLimitBudgets.length} próximo do limite
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-rose-500" />
                  <span className="text-muted-foreground">
                    {exceededBudgets.length} excedido
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="text-muted-foreground col-span-full py-8 text-center">Carregando…</p>
        ) : listBudgets.length === 0 ? (
          <p className="text-muted-foreground col-span-full py-8 text-center">
            {hasApi
              ? "Nenhum orçamento. Clique em \"Novo Orçamento\" para criar."
              : "Configure a conexão com o servidor para gerenciar orçamentos."}
          </p>
        ) : (
          listBudgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onEdit={hasApi ? setEditingBudget : undefined}
              onDelete={hasApi ? handleDelete : undefined}
            />
          ))
        )}
      </div>

      {/* Tips */}
      <Card className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-white/20 p-3">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">
                Dica para economizar
              </h3>
              <p className="text-indigo-100 text-sm">
                Defina alertas de orçamento para receber notificações quando
                estiver próximo do limite. Isso ajuda a controlar seus gastos
                e evitar surpresas no final do mês.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
