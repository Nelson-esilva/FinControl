"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PiggyBank, Eye, EyeOff, CheckCircle2 } from "lucide-react"

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")
  
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    
    if (!token) {
      setError("Token de recuperação inválido ou ausente.")
      return
    }
    
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.")
      return
    }
    
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.")
      return
    }
    
    setLoading(true)
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333"
      const response = await fetch(`${apiUrl}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || "Erro ao redefinir a senha.")
      }
      
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || "Erro de conexão. O token pode estar expirado.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center flex-col items-center gap-4">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
          <div className="space-y-2">
            <h3 className="text-xl font-medium">Senha Redefinida!</h3>
            <p className="text-sm text-muted-foreground text-center">
              Sua senha foi alterada com sucesso. Você já pode acessar sua conta com a nova senha.
            </p>
          </div>
        </div>
        <Button asChild className="w-full">
          <Link href="/login">Ir para o Login</Link>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!token && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 text-sm rounded-md border border-yellow-200 dark:border-yellow-800 mb-4">
          Aviso: Nenhum token de recuperação encontrado na URL.
        </div>
      )}
      
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md p-3">
          {error}
        </p>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="password">Nova Senha</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="pr-10"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
        <Input
          id="confirmPassword"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={loading}
        />
      </div>
      
      <Button type="submit" className="w-full mt-6" disabled={loading || !token}>
        {loading ? "Salvando…" : "Redefinir Senha"}
      </Button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted/30">
      <div className="w-full max-w-[400px] space-y-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <Link href="/" className="flex items-center gap-2 text-primary">
            <PiggyBank className="h-10 w-10" />
            <span className="text-2xl font-bold">FinControl</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            Criar Nova Senha
          </p>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Redefinição de Senha</CardTitle>
            <CardDescription>
              Crie uma nova senha segura para sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="text-center py-4 text-sm text-muted-foreground">Carregando formulário...</div>}>
              <ResetPasswordForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
