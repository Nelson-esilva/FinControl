"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { TopBar } from "@/components/layout/top-bar"
import { useAuth } from "@/contexts/auth-context"

const AUTH_PATHS = ["/login", "/signup"]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading } = useAuth()
  const isAuthPage = AUTH_PATHS.some((p) => pathname === p || pathname?.startsWith(p + "/"))

  useEffect(() => {
    if (loading) return
    if (!isAuthPage && !user) {
      router.replace("/login")
    }
  }, [loading, user, isAuthPage, router])

  if (isAuthPage) {
    return <div className="min-h-screen bg-background">{children}</div>
  }

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando…</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto bg-background p-6">{children}</main>
      </div>
    </div>
  )
}
