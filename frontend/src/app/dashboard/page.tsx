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
// MOCK DATA
// ============================================

const monthlyData = [
  { month: "Jan", income: 8500, expense: 6200, balance: 2300 },
  { month: "Fev", income: 9200, expense: 5800, balance: 3400 },
  { month: "Mar", income: 8800, expense: 7100, balance: 1700 },
  { month: "Abr", income: 9500, expense: 6400, balance: 3100 },
  { month: "Mai", income: 10200, expense: 6900, balance: 3300 },
  { month: "Jun", income: 9800, expense: 7200, balance: 2600 },
  { month: "Jul", income: 10500, expense: 6800, balance: 3700 },
  { month: "Ago", income: 11000, expense: 7500, balance: 3500 },
  { month: "Set", income: 10800, expense: 7100, balance: 3700 },
  { month: "Out", income: 11500, expense: 7800, balance: 3700 },
  { month: "Nov", income: 11200, expense: 7600, balance: 3600 },
  { month: "Dez", income: 12000, expense: 8200, balance: 3800 },
]

const categoryData = [
  { name: "Alimentação", value: 2450, color: "#f43f5e" },
  { name: "Transporte", value: 1200, color: "#f59e0b" },
  { name: "Moradia", value: 2800, color: "#8b5cf6" },
  { name: "Lazer", value: 850, color: "#06b6d4" },
  { name: "Saúde", value: 650, color: "#10b981" },
  { name: "Outros", value: 250, color: "#6b7280" },
]

const recentTransactions = [
  {
    id: "1",
    description: "Supermercado Extra",
    category: "Alimentação",
    categoryColor: "#f43f5e",
    account: "Nubank",
    date: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
    amount: -450.5,
    type: "expense",
    hasAttachment: true,
  },
  {
    id: "2",
    description: "Salário Mensal",
    category: "Renda",
    categoryColor: "#10b981",
    account: "Itaú",
    date: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    amount: 8500.0,
    type: "income",
    hasAttachment: false,
  },
  {
    id: "3",
    description: "Uber - Viagem",
    category: "Transporte",
    categoryColor: "#f59e0b",
    account: "Nubank",
    date: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    amount: -28.9,
    type: "expense",
    hasAttachment: false,
  },
  {
    id: "4",
    description: "Netflix Assinatura",
    category: "Lazer",
    categoryColor: "#06b6d4",
    account: "Nubank",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    amount: -39.9,
    type: "expense",
    hasAttachment: true,
  },
  {
    id: "5",
    description: "Freelance Projeto",
    category: "Renda Extra",
    categoryColor: "#10b981",
    account: "Itaú",
    date: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    amount: 2500.0,
    type: "income",
    hasAttachment: true,
  },
]

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

function BalanceAreaChart() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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

function CategoryDonutChart({ data }: { data?: Array<{ name: string; value: number; color: string }> }) {
  const chartData = data?.length ? data : categoryData
  const total = chartData.reduce((acc, curr) => acc + curr.value, 0)

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
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

  const totalBalance = apiData?.totalBalance ?? 45680.5
  const monthlyIncome = apiData?.monthlyIncome ?? 12000
  const monthlyExpense = apiData?.monthlyExpense ?? 8200
  const monthlyBalance = apiData?.monthlyBalance ?? 3800
  const recentList = apiData?.recentTransactions?.length ? apiData.recentTransactions : recentTransactions
  const categoryChartData = apiData?.categorySummary?.length ? apiData.categorySummary : categoryData

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
            <BalanceAreaChart />
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
              {recentList.map((transaction) => {
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
              );})}
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
