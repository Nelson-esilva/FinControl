"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency } from "@/lib/utils"
import {
    Plus,
    MoreHorizontal,
    Edit,
    Trash2,
    Pause,
    Play,
    CheckCircle2,
    Repeat,
    CreditCard,
    Home,
    Landmark,
    Tv,
    CalendarDays,
    TrendingDown,
    DollarSign,
    AlertTriangle,
} from "lucide-react"
import { hasApi } from "@/lib/api-data"
import { fetchCategories } from "@/lib/api-data"
import {
    fetchRecurringExpenses,
    fetchRecurringSummary,
    createRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
    type ApiRecurringExpense,
    type RecurringSummary,
} from "@/lib/api-recurring"
import { fetchAccounts, type ApiAccount } from "@/lib/api-data"

// ============================================
// CONSTANTS
// ============================================
const typeLabels: Record<string, string> = {
    FIXED: "Fixa",
    INSTALLMENT: "Parcelamento",
    CREDIT_CARD: "Cartão",
    LOAN: "Empréstimo",
    SUBSCRIPTION: "Assinatura",
}

const typeIcons: Record<string, typeof Repeat> = {
    FIXED: Home,
    INSTALLMENT: Repeat,
    CREDIT_CARD: CreditCard,
    LOAN: Landmark,
    SUBSCRIPTION: Tv,
}

const statusLabels: Record<string, string> = {
    ACTIVE: "Ativa",
    PAUSED: "Pausada",
    COMPLETED: "Concluída",
    CANCELLED: "Cancelada",
}

const statusColors: Record<string, string> = {
    ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    PAUSED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    COMPLETED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    CANCELLED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
}

const frequencyLabels: Record<string, string> = {
    WEEKLY: "Semanal",
    MONTHLY: "Mensal",
    YEARLY: "Anual",
}

function toNum(v: unknown): number {
    if (typeof v === "number" && !Number.isNaN(v)) return v
    if (typeof v === "object" && v !== null && "toNumber" in (v as { toNumber?: () => number }))
        return (v as { toNumber: () => number }).toNumber()
    const n = Number(v)
    return Number.isNaN(n) ? 0 : n
}

// ============================================
// EXPENSE CARD
// ============================================
interface ExpenseCardProps {
    expense: ApiRecurringExpense
    onEdit: (e: ApiRecurringExpense) => void
    onDelete: (e: ApiRecurringExpense) => void
    onStatusChange: (e: ApiRecurringExpense, status: string) => void
}

function ExpenseCard({ expense, onEdit, onDelete, onStatusChange }: ExpenseCardProps) {
    const Icon = typeIcons[expense.type] || Repeat
    const amount = toNum(expense.amount)
    const hasInstallments = expense.totalInstallments && expense.totalInstallments > 0
    const installmentProgress = hasInstallments
        ? ((expense.currentInstallment || 1) / expense.totalInstallments!) * 100
        : null

    const nextDue = expense.nextDueDate ? new Date(expense.nextDueDate) : null
    const isOverdue = nextDue && nextDue < new Date() && expense.status === "ACTIVE"

    return (
        <Card className={`card-hover transition-all ${expense.status !== "ACTIVE" ? "opacity-60" : ""}`}>
            <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div
                            className="h-10 w-10 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${expense.color}20` }}
                        >
                            <Icon className="h-5 w-5" style={{ color: expense.color }} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm">{expense.name}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                    {typeLabels[expense.type] || expense.type}
                                </Badge>
                                <Badge className={`text-[10px] px-1.5 py-0 border-0 ${statusColors[expense.status]}`}>
                                    {statusLabels[expense.status]}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {hasApi && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onEdit(expense)}>
                                    <Edit className="mr-2 h-4 w-4" /> Editar
                                </DropdownMenuItem>
                                {expense.status === "ACTIVE" && (
                                    <DropdownMenuItem onClick={() => onStatusChange(expense, "PAUSED")}>
                                        <Pause className="mr-2 h-4 w-4" /> Pausar
                                    </DropdownMenuItem>
                                )}
                                {expense.status === "PAUSED" && (
                                    <DropdownMenuItem onClick={() => onStatusChange(expense, "ACTIVE")}>
                                        <Play className="mr-2 h-4 w-4" /> Reativar
                                    </DropdownMenuItem>
                                )}
                                {(expense.status === "ACTIVE" || expense.status === "PAUSED") && (
                                    <DropdownMenuItem onClick={() => onStatusChange(expense, "COMPLETED")}>
                                        <CheckCircle2 className="mr-2 h-4 w-4" /> Marcar como concluída
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => onDelete(expense)}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                {/* Amount & Frequency */}
                <div className="flex items-baseline justify-between mb-3">
                    <span className="text-xl font-bold">{formatCurrency(amount)}</span>
                    <span className="text-xs text-muted-foreground">
                        {frequencyLabels[expense.frequency] || expense.frequency}
                    </span>
                </div>

                {/* Installment Progress */}
                {hasInstallments && (
                    <div className="space-y-1.5 mb-3">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                                Parcela {expense.currentInstallment || 1} de {expense.totalInstallments}
                            </span>
                            <span className="font-medium">{Math.round(installmentProgress!)}%</span>
                        </div>
                        <Progress value={installmentProgress!} className="h-1.5" />
                    </div>
                )}

                {/* Card Name */}
                {expense.cardName && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                        <CreditCard className="h-3 w-3" />
                        <span>{expense.cardName}</span>
                    </div>
                )}

                {/* Category */}
                {expense.category && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                        <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: expense.category.color || "#6366f1" }}
                        />
                        <span>{expense.category.name}</span>
                    </div>
                )}

                {/* Next Due Date */}
                <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-1.5 text-xs">
                        <CalendarDays className="h-3 w-3 text-muted-foreground" />
                        {nextDue ? (
                            <span className={isOverdue ? "text-rose-600 font-medium" : "text-muted-foreground"}>
                                {isOverdue && <AlertTriangle className="h-3 w-3 inline mr-1" />}
                                Vence {nextDue.toLocaleDateString("pt-BR")}
                            </span>
                        ) : (
                            <span className="text-muted-foreground">Sem vencimento</span>
                        )}
                    </div>
                    {expense.dueDay && (
                        <span className="text-[10px] text-muted-foreground">
                            Dia {expense.dueDay}
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

// ============================================
// EXPENSE FORM
// ============================================
function ExpenseForm({
    onClose,
    onSuccess,
    categories,
    accounts,
    initial,
}: {
    onClose: () => void
    onSuccess?: () => void
    categories: Array<{ id: string; name: string; color?: string }>
    accounts: ApiAccount[]
    initial?: ApiRecurringExpense | null
}) {
    const isEdit = Boolean(initial)
    const [name, setName] = useState(initial?.name ?? "")
    const [type, setType] = useState<string>(initial?.type ?? "FIXED")
    const [amount, setAmount] = useState(initial ? String(toNum(initial.amount)) : "")
    const [frequency, setFrequency] = useState<string>(initial?.frequency ?? "MONTHLY")
    const [dueDay, setDueDay] = useState(initial?.dueDay ? String(initial.dueDay) : "")
    const [startDate, setStartDate] = useState(initial?.startDate?.slice(0, 10) ?? "")
    const [endDate, setEndDate] = useState(initial?.endDate?.slice(0, 10) ?? "")
    const [currentInstallment, setCurrentInstallment] = useState(
        initial?.currentInstallment ? String(initial.currentInstallment) : ""
    )
    const [totalInstallments, setTotalInstallments] = useState(
        initial?.totalInstallments ? String(initial.totalInstallments) : ""
    )
    const [interestRate, setInterestRate] = useState(
        initial?.interestRate ? String(initial.interestRate) : ""
    )
    const [cardName, setCardName] = useState(initial?.cardName ?? "")
    const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "")
    const [accountId, setAccountId] = useState((initial as any)?.accountId ?? "")
    const [description, setDescription] = useState(initial?.description ?? "")
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")

    const showInstallments = type === "INSTALLMENT" || type === "CREDIT_CARD"
    const showLoanFields = type === "LOAN"
    const showCardName = type === "CREDIT_CARD"

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        if (!name.trim()) { setError("Informe o nome."); return }
        const numAmount = parseFloat(amount)
        if (!amount || Number.isNaN(numAmount) || numAmount <= 0) { setError("Informe um valor válido."); return }
        if (!startDate) { setError("Informe a data de início."); return }

        setSaving(true)
        try {
            const body: Record<string, unknown> = {
                name: name.trim(),
                type,
                amount: numAmount,
                frequency,
                startDate,
                description: description || undefined,
                dueDay: dueDay ? parseInt(dueDay) : undefined,
                endDate: endDate || undefined,
                categoryId: categoryId || undefined,
                accountId: accountId || undefined,
            }
            if (showInstallments) {
                if (currentInstallment) body.currentInstallment = parseInt(currentInstallment)
                if (totalInstallments) body.totalInstallments = parseInt(totalInstallments)
            }
            if (showLoanFields && interestRate) {
                body.interestRate = parseFloat(interestRate)
            }
            if (showCardName && cardName) {
                body.cardName = cardName
            }

            if (isEdit && initial) {
                const updated = await updateRecurringExpense(initial.id, body as any)
                if (updated) { onSuccess?.(); onClose() }
                else setError("Falha ao atualizar.")
            } else {
                const created = await createRecurringExpense(body as any)
                if (created) { onSuccess?.(); onClose() }
                else setError("Falha ao criar.")
            }
        } catch {
            setError("Erro ao conectar ao servidor.")
        } finally {
            setSaving(false)
        }
    }

    return (
        <form className="space-y-4 max-h-[70vh] overflow-y-auto pr-1" onSubmit={handleSubmit}>
            {error && <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">{error}</p>}

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                    <Label>Nome</Label>
                    <Input placeholder="Ex: Aluguel, Netflix..." value={name} onChange={e => setName(e.target.value)} />
                </div>

                <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select value={type} onValueChange={setType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="FIXED">Despesa Fixa</SelectItem>
                            <SelectItem value="INSTALLMENT">Parcelamento</SelectItem>
                            <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
                            <SelectItem value="LOAN">Empréstimo</SelectItem>
                            <SelectItem value="SUBSCRIPTION">Assinatura</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Valor</Label>
                    <Input type="number" step="0.01" placeholder="0,00" value={amount} onChange={e => setAmount(e.target.value)} />
                </div>

                <div className="space-y-2">
                    <Label>Frequência</Label>
                    <Select value={frequency} onValueChange={setFrequency}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="WEEKLY">Semanal</SelectItem>
                            <SelectItem value="MONTHLY">Mensal</SelectItem>
                            <SelectItem value="YEARLY">Anual</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Dia de vencimento</Label>
                    <Input type="number" min="1" max="31" placeholder="1-31" value={dueDay} onChange={e => setDueDay(e.target.value)} />
                </div>

                <div className="space-y-2">
                    <Label>Data início</Label>
                    <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>

                <div className="space-y-2">
                    <Label>Data fim (opcional)</Label>
                    <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
            </div>

            {/* Installments fields */}
            {showInstallments && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div className="space-y-2">
                        <Label>Parcela atual</Label>
                        <Input type="number" min="1" placeholder="1" value={currentInstallment} onChange={e => setCurrentInstallment(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Total de parcelas</Label>
                        <Input type="number" min="1" placeholder="12" value={totalInstallments} onChange={e => setTotalInstallments(e.target.value)} />
                    </div>
                </div>
            )}

            {/* Card name */}
            {showCardName && (
                <div className="space-y-2 pt-2 border-t">
                    <Label>Nome do cartão</Label>
                    <Input placeholder="Ex: Nubank, Inter..." value={cardName} onChange={e => setCardName(e.target.value)} />
                </div>
            )}

            {/* Loan fields */}
            {showLoanFields && (
                <div className="space-y-2 pt-2 border-t">
                    <Label>Taxa de juros (% a.m.)</Label>
                    <Input type="number" step="0.01" placeholder="1.5" value={interestRate} onChange={e => setInterestRate(e.target.value)} />
                </div>
            )}

            {/* Category */}
            <div className="space-y-2">
                <Label>Categoria (opcional)</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                        {categories.map(cat => (
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

            {/* Account */}
            <div className="space-y-2">
                <Label>Conta para pagamento</Label>
                <Select value={accountId} onValueChange={setAccountId}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                        {accounts.map(acc => (
                            <SelectItem key={acc.id} value={acc.id}>
                                {acc.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
                <Label>Descrição (opcional)</Label>
                <Input placeholder="Observações..." value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                <Button type="submit" disabled={saving}>
                    {saving ? "Salvando…" : isEdit ? "Salvar alterações" : "Criar Despesa"}
                </Button>
            </div>
        </form>
    )
}

// ============================================
// MAIN PAGE
// ============================================
export default function ExpensesPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editing, setEditing] = useState<ApiRecurringExpense | null>(null)
    const [expenses, setExpenses] = useState<ApiRecurringExpense[]>([])
    const [summary, setSummary] = useState<RecurringSummary | null>(null)
    const [categories, setCategories] = useState<Array<{ id: string; name: string; color?: string }>>([])
    const [accounts, setAccounts] = useState<ApiAccount[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("ALL")

    const refetch = async () => {
        const [list, sum] = await Promise.all([
            fetchRecurringExpenses(),
            fetchRecurringSummary(),
        ])
        setExpenses(list)
        setSummary(sum)
    }

    useEffect(() => {
        if (!hasApi) { setLoading(false); return }
        Promise.all([
            fetchRecurringExpenses(),
            fetchRecurringSummary(),
            fetchCategories("EXPENSE"),
            fetchAccounts(),
        ]).then(([list, sum, cats, accs]) => {
            setExpenses(list)
            setSummary(sum)
            setCategories(cats.map(c => ({ id: c.id, name: c.name, color: c.color })))
            setAccounts(accs)
            setLoading(false)
        }).catch(() => setLoading(false))
    }, [])

    const filtered = activeTab === "ALL"
        ? expenses
        : expenses.filter(e => e.type === activeTab)

    const activeExpenses = filtered.filter(e => e.status === "ACTIVE")
    const otherExpenses = filtered.filter(e => e.status !== "ACTIVE")

    const handleDelete = async (exp: ApiRecurringExpense) => {
        if (!window.confirm(`Excluir "${exp.name}"?`)) return
        const ok = await deleteRecurringExpense(exp.id)
        if (ok) refetch()
    }

    const handleStatusChange = async (exp: ApiRecurringExpense, status: string) => {
        await updateRecurringExpense(exp.id, { status })
        refetch()
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Despesas</h1>
                    <p className="text-muted-foreground">
                        Gerencie suas despesas fixas, parcelamentos e empréstimos
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Nova Despesa
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[520px]">
                        <DialogHeader>
                            <DialogTitle>Nova Despesa</DialogTitle>
                        </DialogHeader>
                        <ExpenseForm
                            onClose={() => setIsDialogOpen(false)}
                            onSuccess={() => { refetch(); setIsDialogOpen(false) }}
                            categories={categories}
                            accounts={accounts}
                        />
                    </DialogContent>
                </Dialog>
                {/* Edit Dialog */}
                <Dialog open={editing !== null} onOpenChange={open => !open && setEditing(null)}>
                    <DialogContent className="sm:max-w-[520px]">
                        <DialogHeader>
                            <DialogTitle>Editar Despesa</DialogTitle>
                        </DialogHeader>
                        {editing && (
                            <ExpenseForm
                                onClose={() => setEditing(null)}
                                onSuccess={() => { refetch(); setEditing(null) }}
                                categories={categories}
                                accounts={accounts}
                                initial={editing}
                            />
                        )}
                    </DialogContent>
                </Dialog>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Mensal</p>
                                <p className="text-2xl font-bold text-rose-600">
                                    {formatCurrency(summary?.totalMonthly ?? 0)}
                                </p>
                            </div>
                            <div className="rounded-xl bg-rose-100 p-3 dark:bg-rose-900/30">
                                <DollarSign className="h-5 w-5 text-rose-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Despesas Fixas</p>
                                <p className="text-2xl font-bold">{formatCurrency(summary?.totalFixed ?? 0)}</p>
                                <p className="text-xs text-muted-foreground">{summary?.fixedCount ?? 0} ativas</p>
                            </div>
                            <div className="rounded-xl bg-blue-100 p-3 dark:bg-blue-900/30">
                                <Home className="h-5 w-5 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Parcelamentos</p>
                                <p className="text-2xl font-bold">{formatCurrency(summary?.totalInstallments ?? 0)}</p>
                                <p className="text-xs text-muted-foreground">{summary?.installmentsCount ?? 0} ativos</p>
                            </div>
                            <div className="rounded-xl bg-violet-100 p-3 dark:bg-violet-900/30">
                                <CreditCard className="h-5 w-5 text-violet-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Empréstimos</p>
                                <p className="text-2xl font-bold">{formatCurrency(summary?.totalLoans ?? 0)}</p>
                                <p className="text-xs text-muted-foreground">{summary?.loansCount ?? 0} ativos</p>
                            </div>
                            <div className="rounded-xl bg-amber-100 p-3 dark:bg-amber-900/30">
                                <Landmark className="h-5 w-5 text-amber-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="ALL">Todas</TabsTrigger>
                    <TabsTrigger value="FIXED">Fixas</TabsTrigger>
                    <TabsTrigger value="INSTALLMENT">Parcelamentos</TabsTrigger>
                    <TabsTrigger value="CREDIT_CARD">Cartão</TabsTrigger>
                    <TabsTrigger value="LOAN">Empréstimos</TabsTrigger>
                    <TabsTrigger value="SUBSCRIPTION">Assinaturas</TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Active Expenses */}
            {loading ? (
                <p className="text-muted-foreground py-8 text-center">Carregando…</p>
            ) : activeExpenses.length === 0 && otherExpenses.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <TrendingDown className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
                        <h3 className="font-semibold text-lg mb-1">Nenhuma despesa cadastrada</h3>
                        <p className="text-muted-foreground text-sm mb-4">
                            {hasApi
                                ? "Clique em \"Nova Despesa\" para começar a controlar seus gastos."
                                : "Configure a conexão com o servidor."}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {activeExpenses.length > 0 && (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {activeExpenses.map(exp => (
                                <ExpenseCard
                                    key={exp.id}
                                    expense={exp}
                                    onEdit={setEditing}
                                    onDelete={handleDelete}
                                    onStatusChange={handleStatusChange}
                                />
                            ))}
                        </div>
                    )}

                    {/* Inactive Expenses */}
                    {otherExpenses.length > 0 && (
                        <div>
                            <h2 className="text-sm font-medium text-muted-foreground mb-3">
                                Pausadas / Concluídas ({otherExpenses.length})
                            </h2>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {otherExpenses.map(exp => (
                                    <ExpenseCard
                                        key={exp.id}
                                        expense={exp}
                                        onEdit={setEditing}
                                        onDelete={handleDelete}
                                        onStatusChange={handleStatusChange}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Tip Card */}
            <Card className="bg-gradient-to-r from-rose-500 to-pink-600 text-white">
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="rounded-xl bg-white/20 p-3">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg mb-1">Controle suas despesas</h3>
                            <p className="text-rose-100 text-sm">
                                Cadastre todas as suas despesas fixas e parcelamentos para ter uma visão
                                clara de quanto do seu salário já está comprometido antes mesmo de gastar.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
