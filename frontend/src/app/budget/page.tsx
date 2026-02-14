"use client"

import { useState } from "react"
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
  Calendar,
  PieChart,
} from "lucide-react"

// ============================================
// MOCK DATA
// ============================================

const budgets = [
  {
    id: "1",
    category: { name: "Alimentação", color: "#f43f5e", icon: "ShoppingCart" },
    amount: 2500,
    spent: 2100,
    period: "Mensal",
    alertAt80: true,
    alertAt100: true,
  },
  {
    id: "2",
    category: { name: "Transporte", color: "#f59e0b", icon: "Car" },
    amount: 800,
    spent: 650,
    period: "Mensal",
    alertAt80: true,
    alertAt100: true,
  },
  {
    id: "3",
    category: { name: "Lazer", color: "#06b6d4", icon: "Gamepad2" },
    amount: 600,
    spent: 720,
    period: "Mensal",
    alertAt80: true,
    alertAt100: true,
  },
  {
    id: "4",
    category: { name: "Saúde", color: "#10b981", icon: "Heart" },
    amount: 500,
    spent: 200,
    period: "Mensal",
    alertAt80: true,
    alertAt100: true,
  },
  {
    id: "5",
    category: { name: "Moradia", color: "#8b5cf6", icon: "Home" },
    amount: 3000,
    spent: 2800,
    period: "Mensal",
    alertAt80: true,
    alertAt100: true,
  },
  {
    id: "6",
    category: { name: "Compras", color: "#ec4899", icon: "ShoppingBag" },
    amount: 400,
    spent: 150,
    period: "Mensal",
    alertAt80: true,
    alertAt100: true,
  },
]

const categories = [
  { id: "1", name: "Alimentação", color: "#f43f5e" },
  { id: "2", name: "Transporte", color: "#f59e0b" },
  { id: "3", name: "Lazer", color: "#06b6d4" },
  { id: "4", name: "Saúde", color: "#10b981" },
  { id: "5", name: "Moradia", color: "#8b5cf6" },
  { id: "6", name: "Compras", color: "#ec4899" },
  { id: "7", name: "Educação", color: "#6366f1" },
  { id: "8", name: "Outros", color: "#6b7280" },
]

// ============================================
// BUDGET CARD COMPONENT
// ============================================

interface BudgetCardProps {
  budget: typeof budgets[0]
}

function BudgetCard({ budget }: BudgetCardProps) {
  const percentage = (budget.spent / budget.amount) * 100
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
                {budget.period}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1">
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
                className={`text-sm font-medium ${
                  isOverLimit
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
                className={`font-semibold ${
                  remaining < 0 ? "text-rose-600" : "text-emerald-600"
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
              className={`p-3 rounded-lg text-sm ${
                isOverLimit
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
// NEW BUDGET FORM
// ============================================

function NewBudgetForm({ onClose }: { onClose: () => void }) {
  return (
    <form className="space-y-4">
      <div className="space-y-2">
        <Label>Categoria</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Selecione a categoria" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: cat.color }}
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
        <Input type="number" step="0.01" placeholder="0,00" />
      </div>

      <div className="space-y-2">
        <Label>Período</Label>
        <Select defaultValue="MONTHLY">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="WEEKLY">Semanal</SelectItem>
            <SelectItem value="MONTHLY">Mensal</SelectItem>
            <SelectItem value="YEARLY">Anual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="alert-80">Alerta aos 80%</Label>
            <p className="text-xs text-muted-foreground">
              Receber notificação ao atingir 80% do orçamento
            </p>
          </div>
          <Switch id="alert-80" defaultChecked />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="alert-100">Alerta aos 100%</Label>
            <p className="text-xs text-muted-foreground">
              Receber notificação ao atingir 100% do orçamento
            </p>
          </div>
          <Switch id="alert-100" defaultChecked />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">Criar Orçamento</Button>
      </div>
    </form>
  )
}

// ============================================
// MAIN BUDGET PAGE
// ============================================

export default function BudgetPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const totalBudget = budgets.reduce((acc, b) => acc + b.amount, 0)
  const totalSpent = budgets.reduce((acc, b) => acc + b.spent, 0)
  const totalRemaining = totalBudget - totalSpent
  const overallPercentage = (totalSpent / totalBudget) * 100

  const exceededBudgets = budgets.filter((b) => b.spent > b.amount)
  const nearLimitBudgets = budgets.filter(
    (b) => b.spent / b.amount >= 0.8 && b.spent <= b.amount
  )

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
            <NewBudgetForm onClose={() => setIsDialogOpen(false)} />
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
                  className={`text-2xl font-bold ${
                    totalRemaining >= 0 ? "text-emerald-600" : "text-rose-600"
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
                  className={`text-2xl font-bold ${
                    overallPercentage > 100
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
        <div className="space-y-3">
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
                className={`text-sm font-medium ${
                  overallPercentage > 100
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
                    {budgets.filter((b) => b.spent / b.amount < 0.8).length} dentro do orçamento
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
        {budgets.map((budget) => (
          <BudgetCard key={budget.id} budget={budget} />
        ))}
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
