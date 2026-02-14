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
import { Wallet as WalletIcon, Plus, CreditCard, Building2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { fetchAccounts, createAccount, hasApi, toNum } from "@/lib/api-data"

const accountTypeLabels: Record<string, string> = {
  CHECKING: "Conta Corrente",
  SAVINGS: "Poupança",
  CREDIT_CARD: "Cartão de Crédito",
  INVESTMENT: "Investimento",
  CASH: "Dinheiro",
}

function AccountForm({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) {
  const [name, setName] = useState("")
  const [type, setType] = useState("CHECKING")
  const [initialBalance, setInitialBalance] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!name.trim()) {
      setError("Informe o nome da conta.")
      return
    }
    if (!hasApi) {
      setError("API não configurada.")
      return
    }
    setSaving(true)
    try {
      const created = await createAccount({
        name: name.trim(),
        type,
        initialBalance: initialBalance ? parseFloat(initialBalance) : 0,
      })
      if (created) {
        onSuccess?.()
        onClose()
      } else {
        setError("Falha ao criar conta.")
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
        <Label>Nome</Label>
        <Input placeholder="Ex: Nubank" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Tipo</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="CHECKING">Conta Corrente</SelectItem>
            <SelectItem value="SAVINGS">Poupança</SelectItem>
            <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
            <SelectItem value="INVESTMENT">Investimento</SelectItem>
            <SelectItem value="CASH">Dinheiro</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Saldo inicial (opcional)</Label>
        <Input type="number" step="0.01" placeholder="0,00" value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
      </div>
    </form>
  )
}

export default function WalletPage() {
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string; type: string; currentBalance: number }>>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const load = () => {
    if (!hasApi) {
      setLoading(false)
      return
    }
    fetchAccounts()
      .then((list) => {
        setAccounts(
          list.map((a) => ({
            id: a.id,
            name: a.name,
            type: a.type,
            currentBalance: toNum(a.currentBalance),
          }))
        )
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const totalBalance = accounts.reduce((s, a) => s + a.currentBalance, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Carteira</h1>
          <p className="text-muted-foreground">Suas contas e saldos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Nova Conta</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Conta</DialogTitle>
            </DialogHeader>
            <AccountForm
              onClose={() => setIsDialogOpen(false)}
              onSuccess={() => { load(); setIsDialogOpen(false) }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WalletIcon className="h-5 w-5" />
            Saldo total
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{formatCurrency(totalBalance)}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <Card><CardContent className="p-6 text-muted-foreground">Carregando…</CardContent></Card>
        ) : accounts.length === 0 ? (
          <Card><CardContent className="p-6 text-muted-foreground">Nenhuma conta. Adicione uma conta acima.</CardContent></Card>
        ) : (
          accounts.map((acc) => (
            <Card key={acc.id} className="card-hover">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium">{acc.name}</CardTitle>
                {acc.type === "CREDIT_CARD" ? (
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                )}
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(acc.currentBalance)}</p>
                <p className="text-xs text-muted-foreground">{accountTypeLabels[acc.type] ?? acc.type}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
