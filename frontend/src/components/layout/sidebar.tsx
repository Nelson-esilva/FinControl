"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  Target,
  Settings,
  Users,
  ChevronLeft,
  ChevronRight,
  PiggyBank,
  TrendingDown,
} from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"

interface SidebarProps {
  className?: string
}

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Visão geral das finanças",
  },
  {
    name: "Transações",
    href: "/transactions",
    icon: Receipt,
    description: "Gerenciar receitas e despesas",
  },
  {
    name: "Carteira",
    href: "/wallet",
    icon: Wallet,
    description: "Contas e cartões",
  },
  {
    name: "Orçamento",
    href: "/budget",
    icon: Target,
    description: "Metas e limites",
  },
  {
    name: "Despesas",
    href: "/expenses",
    icon: TrendingDown,
    description: "Fixas, parcelamentos e empréstimos",
  },
]

const bottomNavigationBase = [
  {
    name: "Configurações",
    href: "/settings",
    icon: Settings,
    description: "Preferências do sistema",
  },
]

const adminNavigation = [
  {
    name: "Usuários",
    href: "/users",
    icon: Users,
    description: "Gerenciar usuários do sistema",
  },
]

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const { isSuperUser } = useAuth()
  const bottomNavigation = [
    ...(isSuperUser ? adminNavigation : []),
    ...bottomNavigationBase,
  ]

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          "relative flex flex-col h-screen border-r bg-card transition-all duration-300",
          collapsed ? "w-[70px]" : "w-[260px]",
          className
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center border-b px-4">
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-3 transition-all duration-300",
              collapsed && "justify-center"
            )}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
              <PiggyBank className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-lg font-bold gradient-text">
                  FinControl
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Gestão Financeira
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Collapse Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-20 h-6 w-6 rounded-full border bg-background shadow-sm"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="flex flex-col gap-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return collapsed ? (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-[10px] opacity-70">
                      {item.description}
                    </span>
                  </div>
                </Link>
              )
            })}
          </nav>
        </ScrollArea>

        {/* Bottom Navigation */}
        <div className="border-t p-3">
          {bottomNavigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return collapsed ? (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.name}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </TooltipProvider>
  )
}
