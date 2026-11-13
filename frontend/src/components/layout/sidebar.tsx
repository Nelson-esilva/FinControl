"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { LogOut, Moon, Plus, Settings, Sun, User, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { useQuickAdd } from "@/components/finance/quick-add"
import { NAV_ITEMS, isActive } from "./nav-items"

const linkClass = (active: boolean) =>
  cn(
    "flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    active ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
  )

export function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 rounded-lg px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">F</span>
      <span className="text-base font-semibold">FinControl</span>
    </Link>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const { isSuperUser, logout, user } = useAuth()
  const { resolvedTheme, setTheme } = useTheme()
  const quickAdd = useQuickAdd()

  return (
    <aside className="sticky top-0 hidden h-screen w-[232px] shrink-0 flex-col gap-6 border-r px-4 py-6 lg:flex">
      <Brand />
      <button
        type="button"
        onClick={() => quickAdd.open()}
        className="flex min-h-11 items-center justify-between rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Novo lançamento
        </span>
        <kbd className="rounded border border-primary-foreground/30 px-1.5 text-[11px] font-medium opacity-70">N</kbd>
      </button>
      <nav aria-label="Principal" className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href)
          return (
            <Link key={item.href} href={item.href} className={linkClass(active)} aria-current={active ? "page" : undefined}>
              <item.icon className="h-[18px] w-[18px]" aria-hidden />
              {item.name}
            </Link>
          )
        })}
      </nav>
      <nav aria-label="Sistema" className="mt-auto flex flex-col gap-0.5">
        {isSuperUser && (
          <Link href="/users" className={linkClass(isActive(pathname, "/users"))}>
            <Users className="h-[18px] w-[18px]" aria-hidden /> Usuários
          </Link>
        )}
        <Link href="/settings" className={linkClass(isActive(pathname, "/settings"))}>
          <Settings className="h-[18px] w-[18px]" aria-hidden /> Configurações
        </Link>
        <Link href="/profile" className={linkClass(isActive(pathname, "/profile"))}>
          <User className="h-[18px] w-[18px]" aria-hidden />
          <span className="truncate">{user?.name ?? "Perfil"}</span>
        </Link>
        <div className="flex gap-1">
          <button
            type="button"
            className={cn(linkClass(false), "flex-1")}
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            {resolvedTheme === "dark" ? <Sun className="h-[18px] w-[18px]" aria-hidden /> : <Moon className="h-[18px] w-[18px]" aria-hidden />}
            Tema
          </button>
          <button type="button" className={cn(linkClass(false), "flex-1")} onClick={() => logout()}>
            <LogOut className="h-[18px] w-[18px]" aria-hidden /> Sair
          </button>
        </div>
      </nav>
    </aside>
  )
}
