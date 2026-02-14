"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import { Search, Plus, CalendarIcon } from "lucide-react"
import {
  fetchTransactions,
  fetchAccounts,
  fetchCategories,
  createTransaction as apiCreateTransaction,
  hasApi,
  toNum,
} from "@/lib/api-data"

const categoriesMock = [
  { id: "1", name: "Alimentação", color: "#f43f5e" },
  { id: "2", name: "Renda", color: "#10b981" },
  { id: "3", name: "Transporte", color: "#f59e0b" },
]
const accountsMock = [
  { id: "1", name: "Nubank", type: "CREDIT_CARD" },
  { id: "2", name: "Itaú", type: "CHECKING" },
]

function TransactionForm({
  onClose,
  onSuccess,
  categories,
  accounts,
}: {
  onClose: () => void
  onSuccess?: () => void
  categories: Array<{ id: string; name: string; color?: string }>
  accounts: Array<{ id: string; name: string }>
}) {
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE")
  const [accountId, setAccountId] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [date, setDate] = useState<Date>()
  const [status, setStatus] = useState("COMPLETED")
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
      setError("API não configurada (NEXT_PUBLIC_API_URL).")
      return
    }
    setSaving(true)
    try {
      const created = await apiCreateTransaction({
        amount: numAmount,
        date: date.toISOString().slice(0, 10),
        description: description.trim(),
        type,
        status: status as "COMPLETED" | "PENDING" | "SCHEDULED",
        accountId,
        categoryId,
      })
      if (created) {
        onSuccess?.()
        onClose()
      } else {
        setError("Falha ao criar transação.")
      }
    } catch {
      setError("Erro ao conectar com o backend.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error && <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">{error}</p>}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select value={type} onValueChange={(v) => setType(v as "INCOME" | "EXPENSE")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="EXPENSE">Despesa</SelectItem>
              <SelectItem value="INCOME">Receita</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Valor</Label>
          <Input type="number" step="0.01" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Descrição</Label>
        <Input placeholder="Ex: Supermercado" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color ?? "#6366f1" }} />
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
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {accounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
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
              <Button variant="outline" className={cn("w-full justify-start", !date && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? formatDate(date) : "Selecione"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="COMPLETED">Pago</SelectItem>
              <SelectItem value="PENDING">Pendente</SelectItem>
              <SelectItem value="SCHEDULED">Agendado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
      </div>
    </form>
  )
}

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [apiTransactions, setApiTransactions] = useState<Array<{
    id: string
    date: Date
    description: string
    category: { name: string }
    account: { name: string }
    amount: number
    type: string
    status: string
  }>>([])
  const [apiAccounts, setApiAccounts] = useState<Array<{ id: string; name: string }>>([])
  const [apiCategories, setApiCategories] = useState<Array<{ id: string; name: string; color?: string }>>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    if (!hasApi) {
      setLoading(false)
      return
    }
    Promise.all([fetchTransactions(), fetchAccounts(), fetchCategories()]).then(
      ([txs, accs, cats]) => {
        setApiTransactions(
          txs.map((t) => ({
            id: t.id,
            date: new Date(t.date),
            description: t.description,
            category: { name: t.category?.name ?? "" },
            account: { name: t.account?.name ?? "" },
            amount: t.type === "INCOME" ? toNum(t.amount) : -toNum(t.amount),
            type: t.type,
            status: t.status,
          }))
        )
        setApiAccounts(accs.map((a) => ({ id: a.id, name: a.name })))
        setApiCategories(cats.map((c) => ({ id: c.id, name: c.name, color: c.color })))
        setLoading(false)
      }
    ).catch(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const listCategories = hasApi && apiCategories.length > 0 ? apiCategories : categoriesMock
  const listAccounts = hasApi && apiAccounts.length > 0 ? apiAccounts : accountsMock
  const filtered = apiTransactions.filter((t) => {
    const matchSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchType = selectedType === "all" || t.type === selectedType
    return matchSearch && matchType
  })

  const totalIncome = filtered.filter((t) => t.type === "INCOME").reduce((a, t) => a + (t.amount > 0 ? t.amount : 0), 0)
  const totalExpense = filtered.filter((t) => t.type === "EXPENSE").reduce((a, t) => a + Math.abs(t.amount), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transações</h1>
          <p className="text-muted-foreground">Gerencie receitas e despesas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Nova Transação</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Nova Transação</DialogTitle>
            </DialogHeader>
            <TransactionForm
              onClose={() => setIsDialogOpen(false)}
              onSuccess={() => { load(); setIsDialogOpen(false) }}
              categories={listCategories}
              accounts={listAccounts}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <Select value={selectedType || "all"} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="INCOME">Receita</SelectItem>
                <SelectItem value="EXPENSE">Despesa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando…</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma transação.</TableCell></TableRow>
              ) : (
                filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="whitespace-nowrap">{formatDate(t.date)}</TableCell>
                    <TableCell className="font-medium">{t.description}</TableCell>
                    <TableCell>{t.category.name}</TableCell>
                    <TableCell>{t.account.name}</TableCell>
                    <TableCell className={t.amount >= 0 ? "text-emerald-600" : "text-rose-600"}>
                      {t.amount >= 0 ? "+" : ""}{formatCurrency(t.amount)}
                    </TableCell>
                    <TableCell><Badge variant="secondary">{t.status}</Badge></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex gap-4 text-sm">
        <span>Receitas: <strong className="text-emerald-600">{formatCurrency(totalIncome)}</strong></span>
        <span>Despesas: <strong className="text-rose-600">{formatCurrency(totalExpense)}</strong></span>
        <span>Mostrando {filtered.length} transações</span>
      </div>
    </div>
  )
}
