"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
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
  TrendingUp,
  Eye,
  EyeOff,
  MoreHorizontal,
  Edit,
  Trash2,
  RefreshCw,
  Unplug,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { fetchAccounts, createAccount, updateAccount, deleteAccount, hasApi, toNum, fetchPluggyItems, registerPluggyItem, syncPluggyItem, unlinkPluggyItem } from "@/lib/api-data"
import { toast } from "sonner"
import { formatDate } from "@/lib/utils"

const accountTypeConfig: Record<string, { label: string; icon: typeof Wallet }> = {
  CHECKING: { label: "Conta Corrente", icon: Landmark },
  SAVINGS: { label: "Poupança", icon: PiggyBank },
  INVESTMENT: { label: "Investimento", icon: TrendingUp },
  CREDIT_CARD: { label: "Cartão de Crédito", icon: CreditCard },
  WALLET: { label: "Dinheiro", icon: Wallet },
  OTHER: { label: "Outro", icon: Wallet },
}

type AccountRow = {
  id: string
  name: string
  type: string
  currentBalance: number
  creditLimit?: number
  color?: string
  source?: string
  isActive?: boolean
}

function AccountCard({ account, onEdit, onDelete }: { account: AccountRow; onEdit?: (account: AccountRow) => void; onDelete?: (account: AccountRow) => void }) {
  const [showBalance, setShowBalance] = useState(true)
  const isCreditCard = account.type === "CREDIT_CARD"
  const creditLimit = account.creditLimit ?? 0
  const usedCreditAmount = isCreditCard && account.currentBalance < 0 ? Math.abs(account.currentBalance) : 0
  const availableCredit = creditLimit - usedCreditAmount
  const utilizationRate = isCreditCard && creditLimit > 0 ? (usedCreditAmount / creditLimit) * 100 : 0
  const config = accountTypeConfig[account.type] ?? accountTypeConfig.OTHER
  const Icon = config.icon
  const color = account.color ?? "#6366f1"

  return (
    <Card className="card-hover">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="h-12 w-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${color}20` }}
            >
              <Icon className="h-6 w-6" style={{ color }} />
            </div>
            <div>
              <h3 className="font-semibold">{account.name}</h3>
              <div className="flex flex-wrap items-center gap-1 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {config.label}
                </Badge>
                {account.source === "PLUGGY" && (
                  <Badge variant="outline" className="text-xs">
                    Meu Pluggy
                  </Badge>
                )}
                {account.isActive === false && (
                  <Badge variant="secondary" className="text-xs text-muted-foreground">
                    Inativa
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowBalance(!showBalance)}
            >
              {showBalance ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
            </Button>
            {hasApi && (onEdit || onDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit?.(account)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => onDelete?.(account)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">{isCreditCard ? "Fatura Atual" : "Saldo"}</p>
            <p className={`text-2xl font-bold ${isCreditCard ? "text-rose-600" : account.currentBalance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {showBalance ? formatCurrency(account.currentBalance) : "R$ ••••••"}
            </p>
          </div>

          {isCreditCard && creditLimit > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Limite Utilizado</span>
                <span className="font-medium">{utilizationRate.toFixed(0)}%</span>
              </div>
              <Progress
                value={Math.min(utilizationRate, 100)}
                className="h-2"
                indicatorClassName={utilizationRate > 80 ? "bg-rose-500" : utilizationRate > 50 ? "bg-amber-500" : "bg-emerald-500"}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Utilizado: {formatCurrency(usedCreditAmount)}</span>
                <span>Disponível: {formatCurrency(availableCredit)}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function AccountForm({
  onClose,
  onSuccess,
  initialAccount,
}: {
  onClose: () => void
  onSuccess?: () => void
  initialAccount?: AccountRow | null
}) {
  const isEdit = Boolean(initialAccount)
  const [name, setName] = useState(initialAccount?.name ?? "")
  const [type, setType] = useState(initialAccount?.type ?? "CHECKING")
  const [initialBalance, setInitialBalance] = useState(initialAccount ? "" : "")
  const [color, setColor] = useState(initialAccount?.color ?? "#6366f1")
  const [creditLimit, setCreditLimit] = useState(initialAccount?.creditLimit != null ? String(initialAccount.creditLimit) : "")
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
      setError("Não foi possível conectar. Verifique as configurações do aplicativo.")
      return
    }
    setSaving(true)
    try {
      if (isEdit && initialAccount) {
        const updated = await updateAccount(initialAccount.id, {
          name: name.trim(),
          type,
          color: color || undefined,
          creditLimit: creditLimit ? parseFloat(creditLimit) : undefined,
        })
        if (updated) {
          onSuccess?.()
          onClose()
        } else {
          setError("Falha ao atualizar conta.")
        }
      } else {
        const created = await createAccount({
          name: name.trim(),
          type,
          initialBalance: initialBalance ? parseFloat(initialBalance) : 0,
          color: color || undefined,
          creditLimit: creditLimit ? parseFloat(creditLimit) : undefined,
        })
        if (created) {
          onSuccess?.()
          onClose()
        } else {
          setError("Falha ao criar conta.")
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
      {error && <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">{error}</p>}
      <div className="space-y-2">
        <Label>Nome da Conta</Label>
        <Input placeholder="Ex: Nubank, Itaú" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Tipo de Conta</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
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
      <div className={isEdit ? "space-y-2" : "grid grid-cols-2 gap-4"}>
        {!isEdit && (
          <div className="space-y-2">
            <Label>Saldo Inicial</Label>
            <Input type="number" step="0.01" placeholder="0,00" value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} />
          </div>
        )}
        <div className="space-y-2">
          <Label>Cor</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded border border-input bg-background p-1"
              title="Escolher cor"
            />
            <Input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="#6366f1"
              className="font-mono text-sm"
            />
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Limite de Crédito (opcional)</Label>
        <Input type="number" step="0.01" placeholder="0,00" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? "Salvando…" : isEdit ? "Salvar alterações" : "Criar Conta"}</Button>
      </div>
    </form>
  )
}

function nestErrorMessage(err: unknown, fallback: string): string {
  if (!(err instanceof Error)) return fallback
  try {
    const parsed = JSON.parse(err.message) as { message?: string | string[] }
    if (typeof parsed.message === "string") return parsed.message
    if (Array.isArray(parsed.message)) return parsed.message.join(" ")
  } catch {
    /* corpo não é JSON */
  }
  return err.message || fallback
}

function mapAccountRows(list: { id: string; name: string; type: string; currentBalance: unknown; creditLimit?: unknown; color?: string; source?: string; isActive?: boolean }[]): AccountRow[] {
  return list.map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    currentBalance: toNum(a.currentBalance),
    creditLimit: a.creditLimit != null ? toNum(a.creditLimit) : undefined,
    color: a.color,
    source: a.source,
    isActive: a.isActive,
  }))
}

export default function WalletPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<AccountRow | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [accounts, setAccounts] = useState<AccountRow[]>([])
  const [loading, setLoading] = useState(true)
  const [itemIdInput, setItemIdInput] = useState("")
  const [pluggyItems, setPluggyItems] = useState<Awaited<ReturnType<typeof fetchPluggyItems>>>([])
  const [pluggyBusy, setPluggyBusy] = useState(false)
  const [showConnected, setShowConnected] = useState(false)

  const handleDelete = async (account: AccountRow) => {
    if (!hasApi) return
    if (!window.confirm(`Excluir a conta "${account.name}"?`)) return
    const ok = await deleteAccount(account.id)
    if (ok) refetch()
  }

  const refetch = () => {
    if (!hasApi) return
    fetchAccounts().then((list) => setAccounts(mapAccountRows(list)))
    fetchPluggyItems()
      .then(setPluggyItems)
      .catch(() => setPluggyItems([]))
  }

  useEffect(() => {
    if (!hasApi) {
      setLoading(false)
      return
    }
    Promise.all([fetchAccounts(), fetchPluggyItems().catch(() => [])])
      .then(([list, items]) => {
        setAccounts(mapAccountRows(list))
        setPluggyItems(items)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleRegisterPluggy = async () => {
    const itemId = itemIdInput.trim()
    if (!itemId) {
      toast.error("Cole o Item ID da aplicação demo.")
      return
    }
    setPluggyBusy(true)
    try {
      const result = await registerPluggyItem(itemId)
      toast.success(
        `Importadas ${result.accountCount ?? result._count?.accounts ?? 0} contas e ${result.transactionCount ?? 0} lançamentos.`,
      )
      setItemIdInput("")
      refetch()
    } catch (err) {
      toast.error(nestErrorMessage(err, "Falha ao sincronizar o Meu Pluggy."))
    } finally {
      setPluggyBusy(false)
    }
  }

  const handleSyncPluggy = async (id: string) => {
    setPluggyBusy(true)
    try {
      const result = await syncPluggyItem(id)
      toast.success(`Sincronizado: ${result.accountCount ?? 0} contas, ${result.transactionCount ?? 0} lançamentos.`)
      refetch()
    } catch (err) {
      toast.error(nestErrorMessage(err, "Falha ao sincronizar."))
    } finally {
      setPluggyBusy(false)
    }
  }

  const handleUnlinkPluggy = async (id: string) => {
    if (!window.confirm("Desvincular esta conexão? As contas importadas ficam inativas; o consentimento no Meu Pluggy permanece.")) return
    setPluggyBusy(true)
    try {
      await unlinkPluggyItem(id)
      toast.success("Conexão desvinculada.")
      refetch()
    } catch (err) {
      toast.error(nestErrorMessage(err, "Falha ao desvincular."))
    } finally {
      setPluggyBusy(false)
    }
  }

  const filteredAccounts = activeTab === "all" ? accounts : accounts.filter((a) => a.type === activeTab)

  const totalBalance = accounts
    .filter((a) => a.type !== "CREDIT_CARD")
    .reduce((acc, a) => acc + a.currentBalance, 0)

  const totalCreditUsed = accounts
    .filter((a) => a.type === "CREDIT_CARD")
    .reduce((acc, a) => acc + (a.currentBalance < 0 ? Math.abs(a.currentBalance) : 0), 0)
  const totalCreditLimit = accounts
    .filter((a) => a.type === "CREDIT_CARD")
    .reduce((acc, a) => acc + (a.creditLimit ?? 0), 0)

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
            <AccountForm onClose={() => setIsDialogOpen(false)} onSuccess={() => { refetch(); setIsDialogOpen(false) }} />
          </DialogContent>
        </Dialog>
        <Dialog open={editingAccount !== null} onOpenChange={(open) => !open && setEditingAccount(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Conta</DialogTitle>
            </DialogHeader>
            {editingAccount && (
              <AccountForm
                onClose={() => setEditingAccount(null)}
                onSuccess={() => { refetch(); setEditingAccount(null) }}
                initialAccount={editingAccount}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {hasApi && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="grid grid-cols-1 items-start gap-x-3 gap-y-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="space-y-1.5">
                <CardTitle className="text-base">Meu Pluggy</CardTitle>
                <CardDescription>
                  Cole o Item ID da aplicação demo. O consentimento permanece no Meu Pluggy.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto justify-self-start px-1 py-0 text-xs text-muted-foreground hover:text-foreground sm:justify-self-center"
                onClick={() => setShowConnected((open) => !open)}
              >
                {showConnected ? "Ocultar conexões" : "Contas conectadas"}
              </Button>
              <Input
                value={itemIdInput}
                onChange={(e) => setItemIdInput(e.target.value)}
                placeholder="Item ID (UUID)"
                className="font-mono text-sm self-end"
                disabled={pluggyBusy}
              />
              <Button className="justify-self-start sm:justify-self-center" onClick={handleRegisterPluggy} disabled={pluggyBusy}>
                {pluggyBusy ? "Sincronizando…" : "Sincronizar"}
              </Button>
            </div>
            {showConnected && (
              pluggyItems.length > 0 ? (
                <ul className="space-y-2">
                  {pluggyItems.map((item) => (
                    <li key={item.id} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm">
                        <p className="font-medium">{item.connectorName ?? "Meu Pluggy"}</p>
                        <p className="text-muted-foreground font-mono text-xs">{item.pluggyItemId}</p>
                        <p className="text-muted-foreground text-xs">
                          {item.status ?? "—"}
                          {item.lastSyncedAt ? ` · ${formatDate(item.lastSyncedAt)}` : ""}
                          {item._count ? ` · ${item._count.accounts} contas` : ""}
                        </p>
                        {item.lastError && <p className="text-destructive text-xs">{item.lastError}</p>}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={pluggyBusy} onClick={() => handleSyncPluggy(item.id)}>
                          <RefreshCw className="mr-1 h-3 w-3" />
                          Atualizar
                        </Button>
                        <Button variant="ghost" size="sm" disabled={pluggyBusy} onClick={() => handleUnlinkPluggy(item.id)}>
                          <Unplug className="mr-1 h-3 w-3" />
                          Desvincular
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">Nenhuma conexão registrada.</p>
              )
            )}
          </CardContent>
        </Card>
      )}

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
            {loading ? (
              <p className="text-muted-foreground col-span-full py-8 text-center">Carregando…</p>
            ) : filteredAccounts.length === 0 ? (
              <p className="text-muted-foreground col-span-full py-8 text-center">
                {hasApi ? "Nenhuma conta cadastrada. Clique em \"Nova Conta\" para criar a primeira." : "Configure a conexão com o servidor para gerenciar suas contas."}
              </p>
            ) : (
              filteredAccounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onEdit={hasApi ? setEditingAccount : undefined}
                  onDelete={hasApi ? handleDelete : undefined}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
