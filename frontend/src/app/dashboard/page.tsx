"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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

const recentTransactionsMock = [
  { id: "1", description: "Supermercado Extra", category: "Alimentação", categoryColor: "#f43f5e", account: "Nubank", date: new Date(Date.now() - 1000 * 60 * 30), amount: -450.5, type: "expense" },
  { id: "2", description: "Salário Mensal", category: "Renda", categoryColor: "#10b981", account: "Itaú", date: new Date(Date.now() - 1000 * 60 * 60 * 2), amount: 8500, type: "income" },
]

function KPICard({ title, value, change, icon: Icon }: { title: string; value: number; change: number; icon: React.ElementType }) {
  const isPositive = change >= 0
  return (
    <Card className="card-hover">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{formatCurrency(value)}</p>
            <Badge variant={isPositive ? "success" : "destructive"} className="text-xs">
              {isPositive ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
              {formatPercentage(Math.abs(change))}
            </Badge>
          </div>
          <div className="rounded-xl bg-primary/10 p-3">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

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
  const recentList = apiData?.recentTransactions?.length ? apiData.recentTransactions : recentTransactionsMock
  const categoryChartData = apiData?.categorySummary?.length ? apiData.categorySummary : categoryData

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral da sua saúde financeira</p>
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

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><CardContent className="p-6 animate-pulse h-24 rounded" /></Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard title="Saldo Total" value={totalBalance} change={12.5} icon={Wallet} />
          <KPICard title="Receitas do Mês" value={monthlyIncome} change={8.3} icon={ArrowUpRight} />
          <KPICard title="Despesas do Mês" value={monthlyExpense} change={-5.2} icon={ArrowDownRight} />
          <KPICard title="Balanço Líquido" value={monthlyBalance} change={15.7} icon={DollarSign} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Histórico Financeiro</CardTitle>
            <CardDescription>Evolução nos últimos 12 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `R$ ${v / 1000}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Area type="monotone" dataKey="income" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                <Area type="monotone" dataKey="expense" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.3} />
                <Area type="monotone" dataKey="balance" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Gastos por Categoria</CardTitle>
            <CardDescription>Distribuição no mês</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={categoryChartData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={2} dataKey="value">
                  {categoryChartData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {categoryChartData.map((c) => (
                <div key={c.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="text-muted-foreground">{c.name}</span>
                  </div>
                  <span className="font-medium">{formatCurrency(c.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Transações Recentes</CardTitle>
            <CardDescription>Últimas movimentações</CardDescription>
          </div>
          <Link href="/transactions">
            <Button variant="ghost" size="sm">Ver todas</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentList.map((t) => {
              const date = typeof t.date === "string" ? new Date(t.date) : t.date
              const color = (t as { categoryColor?: string }).categoryColor ?? "#6366f1"
              return (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10" style={{ backgroundColor: `${color}20` }}>
                      <AvatarFallback style={{ color }}>{t.type === "income" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{t.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span style={{ color }}>{t.category}</span>
                        <span>•</span>
                        <span>{t.account}</span>
                        <span>•</span>
                        <span>{formatRelativeDate(date)}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`font-medium ${t.type === "income" ? "text-emerald-600" : "text-rose-600"}`}>
                    {t.type === "income" ? "+" : ""}{formatCurrency(t.amount)}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
