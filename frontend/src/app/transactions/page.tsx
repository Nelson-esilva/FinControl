"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import {
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  CalendarIcon,
  FileText,
  Download,
  Edit,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  Upload,
  X,
} from "lucide-react"
import { DateRange } from "react-day-picker"
import {
  fetchTransactions,
  fetchAccounts,
  fetchCategories,
  createTransaction as apiCreateTransaction,
  updateTransaction as apiUpdateTransaction,
  deleteTransaction as apiDeleteTransaction,
  payTransaction as apiPayTransaction,
  hasApi,
  toNum,
} from "@/lib/api-data"

// ============================================
// STATUS BADGE COMPONENT
// ============================================

function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    COMPLETED: {
      label: "Pago",
      variant: "success" as const,
      icon: CheckCircle2,
    },
    PENDING: {
      label: "Pendente",
      variant: "warning" as const,
      icon: Clock,
    },
    CANCELLED: {
      label: "Cancelado",
      variant: "destructive" as const,
      icon: XCircle,
    },
    SCHEDULED: {
      label: "Agendado",
      variant: "info" as const,
      icon: CalendarIcon,
    },
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}

// ============================================
// TRANSACTION FORM COMPONENT
// ============================================

type TransactionFormInitial = {
  id: string
  amount: number
  description: string
  type: "INCOME" | "EXPENSE"
  accountId: string
  categoryId: string
  date: Date
  status: string
  installmentNumber?: number | null
  totalInstallments?: number | null
}

function TransactionForm({
  onClose,
  onSuccess,
  categories: formCategories,
  accounts: formAccounts,
  initialTransaction,
}: {
  onClose: () => void
  onSuccess?: () => void
  categories: Array<{ id: string; name: string; color?: string }>
  accounts: Array<{ id: string; name: string; type?: string }>
  initialTransaction?: TransactionFormInitial | null
}) {
  const isEdit = Boolean(initialTransaction)
  const [isInstallment, setIsInstallment] = useState(Boolean(initialTransaction?.installmentNumber))
  const [date, setDate] = useState<Date | undefined>(initialTransaction?.date)
  const [attachments, setAttachments] = useState<File[]>([])
  const [amount, setAmount] = useState(initialTransaction ? String(Math.abs(initialTransaction.amount)) : "")
  const [description, setDescription] = useState(initialTransaction?.description ?? "")
  const [type, setType] = useState<"INCOME" | "EXPENSE">(initialTransaction?.type ?? "EXPENSE")
  const [accountId, setAccountId] = useState(initialTransaction?.accountId ?? "")
  const [categoryId, setCategoryId] = useState(initialTransaction?.categoryId ?? "")
  const [status, setStatus] = useState(initialTransaction?.status ?? "COMPLETED")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    setAttachments((prev) => [...prev, ...files])
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setAttachments((prev) => [...prev, ...files])
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const numAmount = parseFloat(amount)
    if (!amount || Number.isNaN(numAmount) || numAmount <= 0) {
      setError("Informe um valor válido.")
      return
    }
    if (!description.trim()) {
      setError("Informe a descrição.")
      return
    }
    if (!accountId || !categoryId) {
      setError("Selecione conta e categoria.")
      return
    }
    if (!date) {
      setError("Selecione a data.")
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
        date: date.toISOString().slice(0, 10),
        description: description.trim(),
        type,
        status: status as "COMPLETED" | "PENDING" | "SCHEDULED",
        accountId,
        categoryId,
      }
      if (isEdit && initialTransaction) {
        const updated = await apiUpdateTransaction(initialTransaction.id, body)
        if (updated) {
          onSuccess?.()
          onClose()
        } else {
          setError("Falha ao atualizar transação.")
        }
      } else {
        const created = await apiCreateTransaction(body)
        if (created) {
          onSuccess?.()
          onClose()
        } else {
          setError("Falha ao criar transação.")
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
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select value={type} onValueChange={(v) => setType(v as "INCOME" | "EXPENSE")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EXPENSE">Despesa</SelectItem>
              <SelectItem value="INCOME">Receita</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Valor</Label>
          <Input
            type="number"
            step="0.01"
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Descrição</Label>
        <Input
          placeholder="Ex: Supermercado Extra"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
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
          <Label>Conta</Label>
          <Select value={accountId} onValueChange={setAccountId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {formAccounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? formatDate(date) : "Selecione"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="COMPLETED">Pago</SelectItem>
              <SelectItem value="PENDING">Pendente</SelectItem>
              <SelectItem value="SCHEDULED">Agendado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="installment"
          checked={isInstallment}
          onCheckedChange={setIsInstallment}
        />
        <Label htmlFor="installment">Compra parcelada</Label>
      </div>

      {isInstallment && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Parcela Atual</Label>
            <Input type="number" min={1} placeholder="1" />
          </div>
          <div className="space-y-2">
            <Label>Total de Parcelas</Label>
            <Input type="number" min={1} placeholder="12" />
          </div>
        </div>
      )}

      {/* File Upload */}
      <div className="space-y-2">
        <Label>Anexos</Label>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer"
        >
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Arraste arquivos aqui ou clique para selecionar
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, JPG, PNG (max. 10MB)
            </p>
          </label>
        </div>

        {attachments.length > 0 && (
          <div className="space-y-2">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-muted rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm truncate max-w-[200px]">
                    {file.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => removeAttachment(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Salvando…" : isEdit ? "Salvar alterações" : "Salvar Transação"}
        </Button>
      </div>
    </form>
  )
}

// ============================================
// MAIN TRANSACTIONS PAGE
// ============================================

type TransactionRow = {
  id: string
  date: Date
  description: string
  category: { name: string; color?: string }
  account: { name: string; type?: string }
  amount: number
  type: string
  status: string
  hasAttachment?: boolean
  installmentNumber: number | null
  totalInstallments: number | null
  categoryId?: string
  accountId?: string
}

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<TransactionRow | null>(null)
  const [apiTransactions, setApiTransactions] = useState<TransactionRow[]>([])
  const [apiAccounts, setApiAccounts] = useState<Array<{ id: string; name: string; type?: string }>>([])
  const [apiCategories, setApiCategories] = useState<Array<{ id: string; name: string; color?: string }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hasApi) {
      setLoading(false)
      return
    }
    let cancelled = false
    const from = dateRange?.from ? dateRange.from.toISOString().slice(0, 10) : undefined
    const to = dateRange?.to ? dateRange.to.toISOString().slice(0, 10) : undefined
    Promise.all([
      fetchTransactions({ from, to }),
      fetchAccounts(),
      fetchCategories(),
    ]).then(([txs, accs, cats]) => {
      if (cancelled) return
      setApiTransactions(
        txs.map((t) => ({
          id: t.id,
          date: new Date(t.date),
          description: t.description,
          category: {
            name: t.category?.name ?? "",
            color: t.category?.color,
          },
          account: { name: t.account?.name ?? "", type: t.account?.type },
          amount: t.type === "INCOME" ? toNum(t.amount) : -toNum(t.amount),
          type: t.type,
          status: t.status,
          hasAttachment: false,
          installmentNumber: (t as { installmentNumber?: number | null }).installmentNumber ?? null,
          totalInstallments: (t as { totalInstallments?: number | null }).totalInstallments ?? null,
          categoryId: t.categoryId ?? (t.category as { id?: string })?.id,
          accountId: t.accountId ?? (t.account as { id?: string })?.id,
        }))
      )
      setApiAccounts(accs.map((a) => ({ id: a.id, name: a.name, type: (a as { type?: string }).type })))
      setApiCategories(cats.map((c) => ({ id: c.id, name: c.name, color: (c as { color?: string }).color })))
      setLoading(false)
    }).catch(() => setLoading(false))
    return () => { cancelled = true }
  }, [dateRange?.from?.toISOString(), dateRange?.to?.toISOString()])

  const refetchTransactions = () => {
    if (!hasApi) return
    const from = dateRange?.from ? dateRange.from.toISOString().slice(0, 10) : undefined
    const to = dateRange?.to ? dateRange.to.toISOString().slice(0, 10) : undefined
    fetchTransactions({ from, to }).then((txs) =>
      setApiTransactions(
        txs.map((t) => ({
          id: t.id,
          date: new Date(t.date),
          description: t.description,
          category: {
            name: t.category?.name ?? "",
            color: t.category?.color,
          },
          account: { name: t.account?.name ?? "", type: t.account?.type },
          amount: t.type === "INCOME" ? toNum(t.amount) : -toNum(t.amount),
          type: t.type,
          status: t.status,
          hasAttachment: false,
          installmentNumber: (t as { installmentNumber?: number | null }).installmentNumber ?? null,
          totalInstallments: (t as { totalInstallments?: number | null }).totalInstallments ?? null,
          categoryId: t.categoryId ?? (t.category as { id?: string })?.id,
          accountId: t.accountId ?? (t.account as { id?: string })?.id,
        }))
      )
    )
  }

  const listTransactions: TransactionRow[] = apiTransactions
  const listCategories = apiCategories
  const listAccounts = apiAccounts

  const filteredTransactions = listTransactions.filter((t) => {
    const matchesSearch = t.description
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    const matchesCategory =
      selectedCategory === "all" || t.category.name === selectedCategory
    const matchesType = selectedType === "all" || t.type === selectedType
    return matchesSearch && matchesCategory && matchesType
  })

  const totalIncome = filteredTransactions
    .filter((t) => t.type === "INCOME")
    .reduce((acc, t) => acc + (t.amount > 0 ? t.amount : 0), 0)

  const totalExpense = filteredTransactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((acc, t) => acc + Math.abs(t.amount), 0)

  const toFormInitial = (row: TransactionRow): TransactionFormInitial => ({
    id: row.id,
    amount: Math.abs(row.amount),
    description: row.description,
    type: row.type as "INCOME" | "EXPENSE",
    accountId: row.accountId ?? listAccounts.find((a) => a.name === row.account.name)?.id ?? "",
    categoryId: row.categoryId ?? listCategories.find((c) => c.name === row.category.name)?.id ?? "",
    date: row.date,
    status: row.status,
    installmentNumber: row.installmentNumber,
    totalInstallments: row.totalInstallments,
  })

  const handleDelete = async (row: TransactionRow) => {
    if (!hasApi) return
    if (!window.confirm("Excluir esta transação?")) return
    const ok = await apiDeleteTransaction(row.id)
    if (ok) refetchTransactions()
  }

  const handlePay = async (row: TransactionRow) => {
    if (!hasApi) return
    if (!window.confirm("Confirmar o pagamento desta operação? O saldo da conta será atualizado.")) return
    const updated = await apiPayTransaction(row.id)
    if (updated) refetchTransactions()
    else alert("Erro ao tentar baixar a parcela, verifique se já não encontra-se paga.")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transações</h1>
          <p className="text-muted-foreground">
            Gerencie suas receitas e despesas
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Transação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Nova Transação</DialogTitle>
            </DialogHeader>
            <TransactionForm
              onClose={() => setIsDialogOpen(false)}
              onSuccess={() => { refetchTransactions(); setIsDialogOpen(false) }}
              categories={listCategories}
              accounts={listAccounts}
            />
          </DialogContent>
        </Dialog>
        <Dialog open={editingTransaction !== null} onOpenChange={(open) => !open && setEditingTransaction(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Editar Transação</DialogTitle>
            </DialogHeader>
            {editingTransaction && (
              <TransactionForm
                onClose={() => setEditingTransaction(null)}
                onSuccess={() => { refetchTransactions(); setEditingTransaction(null) }}
                categories={listCategories}
                accounts={listAccounts}
                initialTransaction={toFormInitial(editingTransaction)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Receitas</p>
                <p className="text-xl font-bold text-emerald-600">
                  {formatCurrency(totalIncome)}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-100 p-3">
                <ArrowUpRight className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Despesas</p>
                <p className="text-xl font-bold text-rose-600">
                  {formatCurrency(totalExpense)}
                </p>
              </div>
              <div className="rounded-xl bg-rose-100 p-3">
                <ArrowDownRight className="h-5 w-5 text-rose-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Balanço</p>
                <p
                  className={`text-xl font-bold ${totalIncome - totalExpense >= 0
                      ? "text-emerald-600"
                      : "text-rose-600"
                    }`}
                >
                  {formatCurrency(totalIncome - totalExpense)}
                </p>
              </div>
              <div className="rounded-xl bg-indigo-100 p-3">
                <CreditCard className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar transações..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
                      </>
                    ) : (
                      formatDate(dateRange.from)
                    )
                  ) : (
                    "Período"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            <Select value={selectedCategory || "all"} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {listCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
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

            <Select value={selectedType || "all"} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="INCOME">Receita</SelectItem>
                <SelectItem value="EXPENSE">Despesa</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Conta</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Carregando…
                  </TableCell>
                </TableRow>
              ) : listTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {hasApi ? "Nenhuma transação cadastrada. Clique em \"Nova Transação\" para registrar a primeira." : "Configure a conexão com o servidor para ver e criar transações."}
                  </TableCell>
                </TableRow>
              ) : filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum resultado para os filtros aplicados.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(transaction.date)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {transaction.description}
                        </span>
                        {transaction.installmentNumber && (
                          <span className="text-xs text-muted-foreground">
                            Parcela {transaction.installmentNumber} de{" "}
                            {transaction.totalInstallments}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="gap-1"
                        style={{
                          borderColor: transaction.category.color,
                          color: transaction.category.color,
                        }}
                      >
                        <div
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: transaction.category.color }}
                        />
                        {transaction.category.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        {transaction.account.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`font-medium ${transaction.type === "INCOME"
                            ? "text-emerald-600"
                            : "text-rose-600"
                          }`}
                      >
                        {transaction.type === "INCOME" ? "+" : ""}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={transaction.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {transaction.hasAttachment && (
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {transaction.status !== "COMPLETED" && (
                              <DropdownMenuItem className="text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50 cursor-pointer" onClick={() => handlePay(transaction)}>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Marcar Pago
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => hasApi && setEditingTransaction(transaction)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled>
                              <FileText className="mr-2 h-4 w-4" />
                              Ver Anexo
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(transaction)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {filteredTransactions.length} de {listTransactions.length}{" "}
          transações
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            Anterior
          </Button>
          <Button variant="outline" size="sm" disabled>
            Próximo
          </Button>
        </div>
      </div>
    </div>
  )
}
