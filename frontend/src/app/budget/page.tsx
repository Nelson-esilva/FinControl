"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Progress } from "@/components/ui/progress"
import { Plus, PiggyBank } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { fetchBudgets, fetchCategories, createBudget, hasApi, toNum } from "@/lib/api-data"

function BudgetForm({
  onClose,
  onSuccess,
  categories,
}: {
  onClose: () => void
  onSuccess?: () => void
  categories: Array<{ id: string; name: string }>
}) {
  const [amount, setAmount] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [period, setPeriod] = useState("MONTHLY")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
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
      setError("API não configurada.")
      return
    }
    setSaving(true)
    try {
      const created = await createBudget({
        amount: numAmount,
        categoryId,
        period,
        startDate,
        endDate,
      })
      if (created) {
        onSuccess?.()
        onClose()
      } else {
        setError("Falha ao criar orçamento.")
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
      <div className="space-y-2">
        <Label>Valor (R$)</Label>
        <Input type="number" step="0.01" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Categoria</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Período</Label>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="MONTHLY">Mensal</SelectItem>
            <SelectItem value="WEEKLY">Semanal</SelectItem>
            <SelectItem value="YEARLY">Anual</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Início</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Fim</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
      </div>
    </form>
  )
}

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<Array<{
    id: string
    amount: number
    period: string
    startDate: string
    endDate: string
    categoryName: string
  }>>([])
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const load = () => {
    if (!hasApi) {
      setLoading(false)
      return
    }
    Promise.all([fetchBudgets(), fetchCategories()])
      .then(([buds, cats]) => {
        setBudgets(
          buds.map((b) => ({
            id: b.id,
            amount: toNum(b.amount),
            period: b.period,
            startDate: b.startDate,
            endDate: b.endDate,
            categoryName: b.category?.name ?? "—",
          }))
        )
        setCategories(cats.map((c) => ({ id: c.id, name: c.name })))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orçamento</h1>
          <p className="text-muted-foreground">Defina limites por categoria</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Novo Orçamento</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Orçamento</DialogTitle>
            </DialogHeader>
            <BudgetForm
              onClose={() => setIsDialogOpen(false)}
              onSuccess={() => { load(); setIsDialogOpen(false) }}
              categories={categories}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <Card><CardContent className="p-6 text-muted-foreground">Carregando…</CardContent></Card>
        ) : budgets.length === 0 ? (
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <PiggyBank className="h-10 w-10" />
              <p>Nenhum orçamento. Adicione um orçamento acima.</p>
            </CardContent>
          </Card>
        ) : (
          budgets.map((b) => (
            <Card key={b.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">{b.categoryName}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {b.startDate} — {b.endDate} · {b.period}
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(b.amount)}</p>
                <Progress value={0} className="mt-2" />
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
