import { BarChart3, CalendarDays, Home, LineChart, ListOrdered, PieChart, type LucideIcon } from "lucide-react"

export interface NavItem {
  name: string
  short: string
  href: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { name: "Visão geral", short: "Início", href: "/", icon: Home },
  { name: "Lançamentos", short: "Lançam.", href: "/lancamentos", icon: ListOrdered },
  { name: "Compromissos", short: "Contas", href: "/compromissos", icon: CalendarDays },
  { name: "Orçamento", short: "Orçam.", href: "/orcamento", icon: PieChart },
  { name: "Patrimônio", short: "Patrim.", href: "/patrimonio", icon: BarChart3 },
  { name: "Análises", short: "Análises", href: "/analises", icon: LineChart },
]

export const isActive = (pathname: string | null, href: string) =>
  href === "/" ? pathname === "/" : !!pathname && (pathname === href || pathname.startsWith(`${href}/`))
