"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
    ChevronLeft,
    ChevronRight,
    Calendar,
    CheckCircle2,
    Clock,
    AlertCircle,
    Home,
    Repeat,
    CreditCard,
    Landmark,
    Tv,
    ArrowRight,
    Undo2
} from "lucide-react"

import { fetchBills, fetchBillCandidates, payBill, undoPayBill, type ApiBill, type ApiBillCandidate } from "@/lib/api-recurring"
import { fetchAccounts, hasApi, toNum, type ApiAccount } from "@/lib/api-data"
import { formatCurrency, formatDate } from "@/lib/utils"
import { toast } from "sonner"

const typeIcons: Record<string, typeof Repeat> = {
    FIXED: Home,
    INSTALLMENT: Repeat,
    CREDIT_CARD: CreditCard,
    LOAN: Landmark,
    SUBSCRIPTION: Tv,
}

function addMonths(date: Date, months: number) {
    const d = new Date(date)
    d.setMonth(d.getMonth() + months)
    return d
}

function toYearMonth(date: Date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    return `${y}-${m}`
}

function getMonthName(date: Date) {
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

export default function PayablePage() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [bills, setBills] = useState<ApiBill[]>([])
    const [accounts, setAccounts] = useState<ApiAccount[]>([])
    const [loading, setLoading] = useState(true)

    const [payingBill, setPayingBill] = useState<ApiBill | null>(null)
    const [candidates, setCandidates] = useState<ApiBillCandidate[]>([])
    const [selectedTx, setSelectedTx] = useState<string>("")
    const [selectedAccount, setSelectedAccount] = useState<string>("")
    const [loadingCandidates, setLoadingCandidates] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)

    const monthStr = toYearMonth(currentDate)

    const loadData = async () => {
        setLoading(true)
        if (!hasApi) {
            setLoading(false)
            return
        }
        try {
            const [fetchedBills, fetchedAccounts] = await Promise.all([
                fetchBills(monthStr),
                fetchAccounts(),
            ])
            setBills(fetchedBills)
            setAccounts(fetchedAccounts)
        } catch (err) {
            console.error(err)
        }
        setLoading(false)
    }

    useEffect(() => {
        loadData()
    }, [monthStr])

    useEffect(() => {
        if (!payingBill) {
            setCandidates([])
            setSelectedTx("")
            return
        }
        setSelectedAccount(payingBill.account?.id || accounts[0]?.id || "")
        let cancelled = false
        setLoadingCandidates(true)
        fetchBillCandidates(payingBill.recurringExpenseId, monthStr).then((list) => {
            if (cancelled) return
            setCandidates(list)
            setSelectedTx(list[0]?.id ?? "")
            setLoadingCandidates(false)
        }).catch(() => {
            if (cancelled) return
            setCandidates([])
            setSelectedTx("")
            setLoadingCandidates(false)
        })
        return () => { cancelled = true }
    }, [payingBill?.id, monthStr])

    const handlePrevMonth = () => setCurrentDate(prev => addMonths(prev, -1))
    const handleNextMonth = () => setCurrentDate(prev => addMonths(prev, 1))
    const handleToday = () => setCurrentDate(new Date())

    const handleLinkExtract = async () => {
        if (!payingBill || !selectedTx) return
        setIsProcessing(true)
        const success = await payBill(payingBill.recurringExpenseId, monthStr, { transactionId: selectedTx })
        setIsProcessing(false)
        if (success) {
            setPayingBill(null)
            toast.success("Pago e vinculado ao extrato.")
            loadData()
        } else {
            toast.error("Não foi possível vincular ao extrato.")
        }
    }

    const handleMarkPaid = async () => {
        if (!payingBill) return
        setIsProcessing(true)
        const success = await payBill(payingBill.recurringExpenseId, monthStr, {
            accountId: selectedAccount || undefined,
        })
        setIsProcessing(false)
        if (success) {
            setPayingBill(null)
            toast.success("Marcado como pago.")
            loadData()
        } else {
            toast.error("Não foi possível marcar como pago. Escolha uma conta.")
        }
    }

    const handleUndoPay = async (billId: string, recurringId: string) => {
        if (!confirm("Desfazer o pagamento deste mês? O extrato do banco, se houver, permanece.")) return
        setIsProcessing(true)
        const success = await undoPayBill(recurringId, monthStr)
        setIsProcessing(false)
        if (success) {
            toast.success("Pagamento desfeito.")
            loadData()
        } else {
            toast.error("Não foi possível desvincular.")
        }
    }

    const totalAmount = bills.reduce((acc, b) => acc + Number(b.amount), 0)
    const paidAmount = bills.filter(b => b.isPaid).reduce((acc, b) => acc + Number(b.amount), 0)
    const pendingAmount = totalAmount - paidAmount
    const progress = totalAmount === 0 ? 0 : (paidAmount / totalAmount) * 100

    const paidBills = bills.filter(b => b.isPaid)
    const pendingBills = bills.filter(b => !b.isPaid).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

    const todayDate = new Date()
    todayDate.setHours(0, 0, 0, 0)

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Contas a Pagar</h1>
                    <p className="text-muted-foreground">
                        Marque o que já pagou neste mês. Se achar no extrato, pode vincular; se não achar, marque mesmo assim.
                    </p>
                </div>

                <div className="flex items-center gap-2 bg-card border rounded-lg p-1 shadow-sm">
                    <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-2 px-3 font-medium min-w-[150px] justify-center capitalize">
                        <Calendar className="h-4 w-4 text-primary" />
                        {getMonthName(currentDate)}
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                    <Button variant="outline" size="sm" className="ml-2" onClick={handleToday}>
                        Hoje
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-l-4 border-l-primary shadow-sm bg-card text-card-foreground">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total do Mês</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{formatCurrency(totalAmount)}</div>
                        <p className="text-xs text-muted-foreground mt-1">{bills.length} contas no total</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-emerald-500 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-500">Pago</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-500">{formatCurrency(paidAmount)}</div>
                        <p className="text-xs text-muted-foreground mt-1">{paidBills.length} contas quitadas</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-rose-500 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-rose-600 dark:text-rose-500">Pendente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-rose-600 dark:text-rose-500">{formatCurrency(pendingAmount)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Faltam {pendingBills.length} contas</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="overflow-hidden">
                <div className="bg-muted p-4 space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                        <span className="text-emerald-600">Progresso de pagamentos</span>
                        <span>{Math.round(progress)}% Concluído</span>
                    </div>
                    <Progress value={progress} className="h-3 bg-emerald-100 [&>div]:bg-emerald-500 dark:bg-emerald-950/50" />
                </div>
            </Card>

            {loading ? (
                <div className="text-center py-12 text-muted-foreground">Carregando contas...</div>
            ) : bills.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
                        <h3 className="font-semibold text-lg mb-1">Sem contas mapeadas</h3>
                        <p className="text-muted-foreground text-sm">Nenhuma conta fixa salva para este mês.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <div className="md:col-span-2 space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            A Pagar <Badge variant="secondary">{pendingBills.length}</Badge>
                        </h3>
                        {pendingBills.length === 0 && (
                            <div className="p-8 border rounded-xl border-dashed text-center text-muted-foreground text-sm">
                                Todas as contas deste mês foram marcadas como pagas.
                            </div>
                        )}
                        <div className="grid gap-3">
                            {pendingBills.map(bill => {
                                const Icon = typeIcons[bill.type] || Repeat
                                const dueDateObj = new Date(bill.dueDate)
                                dueDateObj.setHours(0, 0, 0, 0)
                                const diffTime = dueDateObj.getTime() - todayDate.getTime()
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

                                let statusInfo = { text: "", color: "", bg: "", badge: null as React.ReactNode }

                                if (diffDays < 0) {
                                    statusInfo = { text: `Venceu há ${Math.abs(diffDays)} dias`, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-950/20", badge: <Badge variant="destructive" className="uppercase text-[10px]">Atrasada</Badge> }
                                } else if (diffDays === 0) {
                                    statusInfo = { text: "Vence hoje!", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/20", badge: <Badge variant="default" className="bg-amber-500 hover:bg-amber-600 uppercase text-[10px]">Alerta</Badge> }
                                } else if (diffDays <= 3) {
                                    statusInfo = { text: `Vence em ${diffDays} dias`, color: "text-amber-600", bg: "", badge: null }
                                } else {
                                    statusInfo = { text: `Vence em ${dueDateObj.toLocaleDateString('pt-BR')}`, color: "text-muted-foreground", bg: "", badge: null }
                                }

                                return (
                                    <div key={bill.id} className={`p-4 rounded-xl border flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between transition-shadow hover:shadow-md ${statusInfo.bg}`}>
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${bill.color || '#6366f1'}20` }}>
                                                <Icon className="h-6 w-6" style={{ color: bill.color || '#6366f1' }} />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-semibold">{bill.name}</h4>
                                                    {statusInfo.badge}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <span className="font-medium">{formatCurrency(Number(bill.amount))}</span>
                                                    <span className="text-muted-foreground text-xs px-1.5 py-0.5 rounded-md bg-muted">{bill.category?.name || "Sem categoria"}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-4 shrink-0 mt-2 sm:mt-0">
                                            <div className={`text-sm font-medium flex items-center gap-1.5 ${statusInfo.color}`}>
                                                {diffDays < 0 ? <AlertCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                                                {statusInfo.text}
                                            </div>

                                            <Dialog open={payingBill?.id === bill.id} onOpenChange={(open) => !open && setPayingBill(null)}>
                                                <DialogTrigger asChild>
                                                    <Button size="sm" onClick={() => setPayingBill(bill)} className="gap-2">
                                                        Marcar pago <ArrowRight className="h-3.5 w-3.5" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-md">
                                                    <DialogHeader>
                                                        <DialogTitle>Marcar como pago</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="space-y-4 py-4">
                                                        <div className="p-4 rounded-lg bg-muted flex items-center justify-between">
                                                            <div>
                                                                <p className="font-medium">{bill.name}</p>
                                                                <p className="text-sm text-muted-foreground">Vencimento: {new Date(bill.dueDate).toLocaleDateString('pt-BR')}</p>
                                                            </div>
                                                            <div className="text-xl font-bold">{formatCurrency(Number(bill.amount))}</div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium">Linha do extrato (opcional)</label>
                                                            {loadingCandidates ? (
                                                                <p className="text-sm text-muted-foreground">Buscando no extrato…</p>
                                                            ) : candidates.length === 0 ? (
                                                                <p className="text-sm text-muted-foreground">
                                                                    Nada parecido no extrato. Você pode marcar como pago mesmo assim.
                                                                </p>
                                                            ) : (
                                                                <Select value={selectedTx} onValueChange={setSelectedTx}>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Selecione o lançamento…" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {candidates.map((row) => (
                                                                            <SelectItem key={row.id} value={row.id}>
                                                                                {formatDate(row.date)} · {row.description} · {formatCurrency(toNum(row.amount))} ({row.accountName})
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            )}
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium">Conta (se marcar sem extrato)</label>
                                                            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Selecione a conta…" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {accounts.map((acc) => (
                                                                        <SelectItem key={acc.id} value={acc.id}>
                                                                            {acc.name}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="flex flex-col gap-2">
                                                            {candidates.length > 0 && (
                                                                <Button className="w-full" disabled={isProcessing || !selectedTx} onClick={handleLinkExtract}>
                                                                    {isProcessing ? "Salvando…" : "Vincular ao extrato"}
                                                                </Button>
                                                            )}
                                                            <Button
                                                                className="w-full"
                                                                variant={candidates.length > 0 ? "outline" : "default"}
                                                                disabled={isProcessing || !selectedAccount}
                                                                onClick={handleMarkPaid}
                                                            >
                                                                {isProcessing ? "Salvando…" : "Marcar como pago mesmo sem extrato"}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-emerald-600">
                            Pagas <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">{paidBills.length}</Badge>
                        </h3>
                        {paidBills.length === 0 && (
                            <div className="p-8 border rounded-xl border-dashed text-center text-muted-foreground text-sm">
                                Nenhum pagamento marcado ainda.
                            </div>
                        )}
                        <div className="grid gap-3">
                            {paidBills.map(bill => {
                                return (
                                    <div key={bill.id} className="p-3 rounded-xl border bg-muted/30 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-600 shrink-0">
                                                <CheckCircle2 className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-sm line-through opacity-70">{bill.name}</h4>
                                                <div className="text-xs text-muted-foreground flex gap-2">
                                                    <span>{formatCurrency(Number(bill.amount))}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-0 flex gap-1 items-center shadow-none">
                                                {bill.paidVia === "EXTRACT" ? "No extrato" : "Pago"}
                                            </Badge>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                                                onClick={() => handleUndoPay(bill.id, bill.recurringExpenseId)}
                                                disabled={isProcessing}
                                                title="Desfazer pagamento"
                                            >
                                                <Undo2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                </div>
            )}
        </div>
    )
}
