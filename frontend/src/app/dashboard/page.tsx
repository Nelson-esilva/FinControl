"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Receipt,
  CreditCard,
  MoreHorizontal,
  Calendar,
  FileText,
} from "lucide-react"
import { formatCurrency, formatPercentage, formatRelativeDate } from "@/lib/utils"
import { fetchDashboard, type DashboardData } from "@/lib/api-data"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

// ============================================
// KPI CARDS COMPONENT
// ============================================

interface KPICardProps {
  title: string
  value: number
  change: number
  icon: React.ElementType
  format?: "currency" | "percentage" | "number"
}

function KPICard({ title, value, change, icon: Icon, format = "currency" }: KPICardProps) {
  const isPositive = change >= 0
  const formattedValue = format === "currency" 
    ? formatCurrency(value) 
    : format === "percentage" 
    ? formatPercentage(value)
    : value.toString()

  return (
    <Card className="card-hover">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{formattedValue}</p>
            <div className="flex items-center gap-1">
              <Badge
                variant={isPositive ? "success" : "destructive"}
                className="text-xs"
              >
                {isPositive ? (
                  <TrendingUp className="mr-1 h-3 w-3" />
                ) : (
                  <TrendingDown className="mr-1 h-3 w-3" />
                )}
                {formatPercentage(Math.abs(change))}
              </Badge>
              <span className="text-xs text-muted-foreground">vs mês anterior</span>
            </div>
          </div>
          <div className="rounded-xl bg-primary/10 p-3">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// CHART COMPONENTS
// ============================================

function BalanceAreaChart({ data }: { data: Array<{ month: string; income: number; expense: number; balance: number }> }) {
  if (!data?.length) {
    return (
      <div className="flex h-[350px] items-center justify-center text-muted-foreground text-sm">
        Cadastre transações para ver aqui o histórico de receitas e despesas dos últimos meses.
      </div>
    )
  }
  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: "#6b7280" }}
          dy={10}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: "#6b7280" }}
          tickFormatter={(value) => `R$ ${value / 1000}k`}
          dx={-10}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border bg-white p-3 shadow-lg">
                  <p className="font-medium mb-2">{label}</p>
                  {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-muted-foreground">
                        {entry.name === "income" && "Receitas"}
                        {entry.name === "expense" && "Despesas"}
                        {entry.name === "balance" && "Saldo"}
                      </span>
                      <span className="font-medium ml-auto">
                        {formatCurrency(entry.value as number)}
                      </span>
                    </div>
                  ))}
                </div>
              )
            }
            return null
          }}
        />
        <Area
          type="monotone"
          dataKey="income"
          stroke="#10b981"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorIncome)"
        />
        <Area
          type="monotone"
          dataKey="expense"
          stroke="#f43f5e"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorExpense)"
        />
        <Area
          type="monotone"
          dataKey="balance"
          stroke="#6366f1"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorBalance)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function CategoryDonutChart({ data }: { data: Array<{ name: string; value: number; color: string }> }) {
  const total = data.reduce((acc, curr) => acc + curr.value, 0)

  if (!data.length) {
    return (
      <div className="flex h-[280px] items-center justify-center text-muted-foreground text-sm">
        Nenhum gasto registrado neste mês. Suas despesas por categoria aparecerão aqui.
      </div>
    )
  }

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload
                const percentage = ((data.value / total) * 100).toFixed(1)
                return (
                  <div className="rounded-lg border bg-white p-3 shadow-lg">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: data.color }}
                      />
                      <span className="font-medium">{data.name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatCurrency(data.value)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {percentage}% do total
                    </p>
                  </div>
                )
              }
              return null
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-sm text-muted-foreground">Total</span>
        <span className="text-xl font-bold">{formatCurrency(total)}</span>
      </div>
    </div>
  )
}

// ============================================
// MAIN DASHBOARD PAGE
// ============================================

export default function DashboardPage() {
  const [apiData, setApiData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchDashboard().then((data) => {
      if (!cancelled) {
        setApiData(data ?? null)
        setLoading(false)
      }
    }).catch(() => setLoading(false))
    return () => { cancelled = true }
  }, [])

  const totalBalance = apiData?.totalBalance ?? 0
  const monthlyIncome = apiData?.monthlyIncome ?? 0
  const monthlyExpense = apiData?.monthlyExpense ?? 0
  const monthlyBalance = apiData?.monthlyBalance ?? 0
  const monthlyChartData = apiData?.monthlySummary ?? []
  const recentList = apiData?.recentTransactions ?? []
  const categoryChartData = apiData?.categorySummary ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral da sua saúde financeira
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Este Mês
          </Button>
          <Link href="/transactions">
            <Button size="sm">
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Nova Transação
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><CardContent className="p-6 animate-pulse h-24 rounded" /></Card>
          ))}
        </div>
      ) : (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Saldo Total"
          value={totalBalance}
          change={12.5}
          icon={Wallet}
        />
        <KPICard
          title="Receitas do Mês"
          value={monthlyIncome}
          change={8.3}
          icon={ArrowUpRight}
        />
        <KPICard
          title="Despesas do Mês"
          value={monthlyExpense}
          change={-5.2}
          icon={ArrowDownRight}
        />
        <KPICard
          title="Balanço Líquido"
          value={monthlyBalance}
          change={15.7}
          icon={DollarSign}
        />
      </div>
      )}

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Histórico Financeiro</CardTitle>
              <CardDescription>
                Evolução de receitas, despesas e saldo nos últimos 12 meses
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-xs text-muted-foreground">Receitas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-rose-500" />
                <span className="text-xs text-muted-foreground">Despesas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-indigo-500" />
                <span className="text-xs text-muted-foreground">Saldo</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <BalanceAreaChart data={monthlyChartData} />
          </CardContent>
        </Card>

        {/* Category Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Gastos por Categoria</CardTitle>
            <CardDescription>
              Distribuição de despesas no mês atual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryDonutChart data={categoryChartData} />
            {categoryChartData.length > 0 && (
            <div className="mt-4 space-y-2">
              {categoryChartData.map((category) => (
                <div
                  key={category.name}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-muted-foreground">{category.name}</span>
                  </div>
                  <span className="font-medium">
                    {formatCurrency(category.value)}
                  </span>
                </div>
              ))}
            </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Transações Recentes</CardTitle>
              <CardDescription>
                Últimas movimentações da sua conta
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm">
              Ver todas
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentList.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Suas últimas movimentações aparecerão aqui.</p>
              ) : (
                recentList.map((transaction) => {
                  const date = typeof transaction.date === "string" ? new Date(transaction.date) : transaction.date
                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          className="h-10 w-10"
                          style={{
                            backgroundColor: `${(transaction as { categoryColor?: string }).categoryColor ?? "#6366f1"}20`,
                          }}
                        >
                          <AvatarFallback
                            style={{ color: (transaction as { categoryColor?: string }).categoryColor ?? "#6366f1" }}
                          >
                            {transaction.type === "income" ? (
                              <ArrowUpRight className="h-4 w-4" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4" />
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {transaction.description}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span
                              className="inline-flex items-center gap-1"
                              style={{ color: (transaction as { categoryColor?: string }).categoryColor ?? "#6366f1" }}
                            >
                              <div
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ backgroundColor: (transaction as { categoryColor?: string }).categoryColor ?? "#6366f1" }}
                              />
                              {transaction.category}
                            </span>
                            <span>•</span>
                            <span>{transaction.account}</span>
                            <span>•</span>
                            <span>{formatRelativeDate(date)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`font-medium ${
                            transaction.type === "income"
                              ? "text-emerald-600"
                              : "text-rose-600"
                          }`}
                        >
                          {transaction.type === "income" ? "+" : ""}
                          {formatCurrency(transaction.amount)}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo do Mês</CardTitle>
            <CardDescription>
              Comparativo com o mês anterior
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Meta de Economia</span>
                <span className="font-medium">75% atingida</span>
              </div>
              <Progress value={75} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Você economizou R$ 3.800 dos R$ 5.000 planejados
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Limite de Gastos</span>
                <span className="font-medium">82% utilizado</span>
              </div>
              <Progress 
                value={82} 
                className="h-2"
                indicatorClassName="bg-amber-500"
              />
              <p className="text-xs text-muted-foreground">
                R$ 8.200 de R$ 10.000 disponíveis
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Receipt className="h-4 w-4" />
                  <span className="text-xs">Total de Transações</span>
                </div>
                <p className="text-2xl font-bold">47</p>
                <p className="text-xs text-emerald-600">+12 vs mês anterior</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <CreditCard className="h-4 w-4" />
                  <span className="text-xs">Contas Ativas</span>
                </div>
                <p className="text-2xl font-bold">5</p>
                <p className="text-xs text-muted-foreground">3 bancos, 2 cartões</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
