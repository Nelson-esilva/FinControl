"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"
import {
  Plus,
  Wallet,
  CreditCard,
  Landmark,
  PiggyBank,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Edit,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react"

// ============================================
// MOCK DATA
// ============================================

const accounts = [
  {
    id: "1",
    name: "Nubank",
    type: "CREDIT_CARD",
    currentBalance: -1250.5,
    creditLimit: 8000,
    color: "#8b05be",
    icon: CreditCard,
    dueDate: 15,
    transactions: 24,
  },
  {
    id: "2",
    name: "Itaú Conta Corrente",
    type: "CHECKING",
    currentBalance: 15420.75,
    color: "#ff7f00",
    icon: Landmark,
    transactions: 18,
  },
  {
    id: "3",
    "name": "XP Investimentos",
    type: "INVESTMENT",
    currentBalance: 45230.0,
    color: "#000000",
    icon: TrendingUp,
    transactions: 5,
  },
  {
    id: "4",
    name: "Nubank Poupança",
    type: "SAVINGS",
    currentBalance: 12500.0,
    color: "#8b05be",
    icon: PiggyBank,
    transactions: 3,
  },
  {
    id: "5",
    name: "Carteira",
    type: "WALLET",
    currentBalance: 350.0,
    color: "#10b981",
    icon: Wallet,
    transactions: 12,
  },
]

const recentAccountTransactions = [
  {
    id: "1",
    description: "Supermercado Extra",
    date: new Date("2024-12-15"),
    amount: -450.5,
    account: "Nubank",
  },
  {
    id: "2",
    description: "Depósito",
    date: new Date("2024-12-14"),
    amount: 5000.0,
    account: "Itaú Conta Corrente",
  },
  {
    id: "3",
    description: "Compra de CDB",
    date: new Date("2024-12-13"),
    amount: -5000.0,
    account: "XP Investimentos",
  },
  {
    id: "4",
    description: "Transferência",
    date: new Date("2024-12-12"),
    amount: 1000.0,
    account: "Nubank Poupança",
  },
]

// ============================================
// ACCOUNT TYPE CONFIG
// ============================================

const accountTypeConfig = {
  CHECKING: { label: "Conta Corrente", color: "bg-blue-500" },
  SAVINGS: { label: "Poupança", color: "bg-emerald-500" },
  INVESTMENT: { label: "Investimento", color: "bg-violet-500" },
  CREDIT_CARD: { label: "Cartão de Crédito", color: "bg-rose-500" },
  WALLET: { label: "Dinheiro", color: "bg-amber-500" },
  OTHER: { label: "Outro", color: "bg-gray-500" },
}

// ============================================
// ACCOUNT CARD COMPONENT
// ============================================

interface AccountCardProps {
  account: typeof accounts[0]
}

function AccountCard({ account }: AccountCardProps) {
  const [showBalance, setShowBalance] = useState(true)
  const isCreditCard = account.type === "CREDIT_CARD"
  const usedCredit = isCreditCard ? Math.abs(account.currentBalance) : 0
  const availableCredit = isCreditCard ? (account.creditLimit || 0) - usedCredit : 0
  const utilizationRate = isCreditCard && account.creditLimit
    ? (usedCredit / account.creditLimit) * 100
    : 0

  const Icon = account.icon

  return (
    <Card className="card-hover">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="h-12 w-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${account.color}20` }}
            >
              <Icon className="h-6 w-6" style={{ color: account.color }} />
            </div>
            <div>
              <h3 className="font-semibold">{account.name}</h3>
              <Badge variant="secondary" className="text-xs">
                {accountTypeConfig[account.type as keyof typeof accountTypeConfig]?.label}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowBalance(!showBalance)}
            >
              {showBalance ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {isCreditCard ? "Fatura Atual" : "Saldo"}
            </p>
            <p
              className={`text-2xl font-bold ${
                isCreditCard
                  ? "text-rose-600"
                  : account.currentBalance >= 0
                  ? "text-emerald-600"
                  : "text-rose-600"
              }`}
            >
              {showBalance ? formatCurrency(account.currentBalance) : "R$ ••••••"}
            </p>
          </div>

          {isCreditCard && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Limite Utilizado</span>
                <span className="font-medium">{utilizationRate.toFixed(0)}%</span>
              </div>
              <Progress
                value={utilizationRate}
                className="h-2"
                indicatorClassName={
                  utilizationRate > 80
                    ? "bg-rose-500"
                    : utilizationRate > 50
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                }
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Utilizado: {formatCurrency(usedCredit)}</span>
                <span>Disponível: {formatCurrency(availableCredit)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Vencimento: dia {account.dueDate}
              </p>
            </div>
          )}

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Transações (mês)</span>
              <span className="font-medium">{account.transactions}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// NEW ACCOUNT FORM
// ============================================

function NewAccountForm({ onClose }: { onClose: () => void }) {
  return (
    <form className="space-y-4">
      <div className="space-y-2">
        <Label>Nome da Conta</Label>
        <Input placeholder="Ex: Nubank, Itaú, etc." />
      </div>

      <div className="space-y-2">
        <Label>Tipo de Conta</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CHECKING">Conta Corrente</SelectItem>
            <SelectItem value="SAVINGS">Poupança</SelectItem>
            <SelectItem value="INVESTMENT">Investimento</SelectItem>
            <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
            <SelectItem value="WALLET">Dinheiro</SelectItem>
            <SelectItem value="OTHER">Outro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Saldo Inicial</Label>
          <Input type="number" step="0.01" placeholder="0,00" />
        </div>
        <div className="space-y-2">
          <Label>Cor</Label>
          <Input type="color" defaultValue="#6366f1" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Limite de Crédito (opcional)</Label>
        <Input type="number" step="0.01" placeholder="0,00" />
      </div>

      <div className="space-y-2">
        <Label>Dia do Vencimento (opcional)</Label>
        <Input type="number" min={1} max={31} placeholder="15" />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">Criar Conta</Button>
      </div>
    </form>
  )
}

// ============================================
// MAIN WALLET PAGE
// ============================================

export default function WalletPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  const filteredAccounts = activeTab === "all"
    ? accounts
    : accounts.filter((a) => a.type === activeTab.toUpperCase())

  const totalBalance = accounts
    .filter((a) => a.type !== "CREDIT_CARD")
    .reduce((acc, a) => acc + a.currentBalance, 0)

  const totalCreditUsed = accounts
    .filter((a) => a.type === "CREDIT_CARD")
    .reduce((acc, a) => acc + Math.abs(a.currentBalance), 0)

  const totalCreditLimit = accounts
    .filter((a) => a.type === "CREDIT_CARD")
    .reduce((acc, a) => acc + (a.creditLimit || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Carteira</h1>
          <p className="text-muted-foreground">
            Gerencie suas contas e cartões
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Conta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Conta</DialogTitle>
            </DialogHeader>
            <NewAccountForm onClose={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saldo Total</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(totalBalance)}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-100 p-3">
                <Wallet className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fatura Cartões</p>
                <p className="text-2xl font-bold text-rose-600">
                  {formatCurrency(totalCreditUsed)}
                </p>
              </div>
              <div className="rounded-xl bg-rose-100 p-3">
                <CreditCard className="h-5 w-5 text-rose-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Limite Total</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {formatCurrency(totalCreditLimit)}
                </p>
              </div>
              <div className="rounded-xl bg-indigo-100 p-3">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Accounts Grid */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="CHECKING">Contas</TabsTrigger>
          <TabsTrigger value="CREDIT_CARD">Cartões</TabsTrigger>
          <TabsTrigger value="INVESTMENT">Investimentos</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAccounts.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
          <CardDescription>
            Últimas movimentações entre contas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentAccountTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      transaction.amount >= 0
                        ? "bg-emerald-100"
                        : "bg-rose-100"
                    }`}
                  >
                    {transaction.amount >= 0 ? (
                      <ArrowUpRight className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <ArrowDownRight className="h-5 w-5 text-rose-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.account} •{" "}
                      {transaction.date.toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <span
                  className={`font-medium ${
                    transaction.amount >= 0
                      ? "text-emerald-600"
                      : "text-rose-600"
                  }`}
                >
                  {transaction.amount >= 0 ? "+" : ""}
                  {formatCurrency(transaction.amount)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
