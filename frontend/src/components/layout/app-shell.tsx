"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { QuickAddProvider } from "@/components/finance/quick-add"
import { Sidebar } from "./sidebar"
import { MobileHeader, MobileTabBar } from "./mobile-nav"

const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password"]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading } = useAuth()
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname?.startsWith(p + "/"))

  useEffect(() => {
    if (!loading && !isPublic && !user) router.replace("/login")
  }, [loading, user, isPublic, router])

  if (isPublic) return <div className="min-h-screen bg-background">{children}</div>

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando…</p>
      </div>
    )
  }

  return (
    <QuickAddProvider>
      <div className="min-h-screen bg-background lg:flex">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <MobileHeader />
          <main className="flex w-full flex-col gap-6 px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">
            {children}
          </main>
        </div>
        <MobileTabBar />
      </div>
    </QuickAddProvider>
  )
}
