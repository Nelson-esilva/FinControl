"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Plus, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { useQuickAdd } from "@/components/finance/quick-add"
import { NAV_ITEMS, isActive } from "./nav-items"
import { Brand } from "./sidebar"

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/90 px-2 backdrop-blur lg:hidden">
      <Brand />
      <Link
        href="/settings"
        aria-label="Configurações"
        className="flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary"
      >
        <Settings className="h-5 w-5" />
      </Link>
    </header>
  )
}

/** Barra inferior: 5 destinos + botão de lançamento rápido. */
export function MobileTabBar() {
  const pathname = usePathname()
  const quickAdd = useQuickAdd()
  const items = NAV_ITEMS.filter((i) => i.href !== "/analises")
  return (
    <>
      <button
        type="button"
        aria-label="Novo lançamento"
        onClick={() => quickAdd.open()}
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-black/40 lg:hidden"
      >
        <Plus className="h-6 w-6" />
      </button>
      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        {items.map((item) => {
          const active = isActive(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <item.icon className="h-5 w-5" aria-hidden />
              {item.short}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
