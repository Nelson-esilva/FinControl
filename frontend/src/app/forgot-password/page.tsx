"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PiggyBank, ArrowLeft } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setMessage("")
    if (!email.trim()) {
      setError("Preencha o e-mail.")
      return
    }
    setLoading(true)
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333"
      const response = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || "Erro ao tentar enviar o e-mail.")
      }
      
      setMessage("Se o e-mail existir, um link de recuperação foi enviado.")
      setEmail("")
    } catch (err: any) {
      setError(err.message || "Erro de conexão.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted/30">
      <div className="w-full max-w-[400px] space-y-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <Link href="/" className="flex items-center gap-2 text-primary">
            <PiggyBank className="h-10 w-10" />
            <span className="text-2xl font-bold">FinControl</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            Recuperação de Acesso
          </p>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Esqueceu sua senha?</CardTitle>
            <CardDescription>
              Digite seu e-mail para receber um link de recuperação
            </CardDescription>
          </CardHeader>
          <CardContent>
            {message ? (
              <div className="space-y-4">
                <p className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-md border border-green-200 dark:border-green-800">
                  {message}
                </p>
                <Button asChild className="w-full" variant="outline">
                  <Link href="/login">Voltar para o Login</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 rounded-md p-3">
                    {error}
                  </p>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Enviando…" : "Enviar Link de Recuperação"}
                </Button>
                
                <div className="pt-2">
                  <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar para o Login
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
