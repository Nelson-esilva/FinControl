"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Monitor, Moon, Sun } from "lucide-react"
import { PageHeader, Panel, PanelTitle, Segmented } from "@/components/finance/ui"
import { CategoriesManager } from "@/components/finance/categories-manager"
import { BankConnections } from "@/components/finance/bank-connections"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <>
      <PageHeader title="Configurações" />
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Panel aria-label="Aparência">
            <PanelTitle>Aparência</PanelTitle>
            {mounted && (
              <Segmented
                label="Tema"
                className="border"
                options={[
                  { value: "dark", label: "Escuro" },
                  { value: "light", label: "Claro" },
                  { value: "system", label: "Sistema" },
                ]}
                value={(theme ?? "dark") as "dark" | "light" | "system"}
                onChange={setTheme}
              />
            )}
            <div className="mt-3 flex gap-4 text-xs text-muted-foreground" aria-hidden>
              <span className="flex items-center gap-1"><Moon className="h-3.5 w-3.5" /> padrão</span>
              <span className="flex items-center gap-1"><Sun className="h-3.5 w-3.5" /> claro</span>
              <span className="flex items-center gap-1"><Monitor className="h-3.5 w-3.5" /> segue o sistema</span>
            </div>
          </Panel>
          <Panel aria-label="Conexões bancárias">
            <PanelTitle>Conexões bancárias</PanelTitle>
            <BankConnections />
          </Panel>
          <Panel aria-label="Conta">
            <PanelTitle>Conta</PanelTitle>
            <Link href="/profile" className="text-sm font-medium text-primary hover:underline">
              Editar perfil e senha
            </Link>
            <p className="mt-3 text-xs text-muted-foreground">FinControl 2.0</p>
          </Panel>
        </div>
        <Panel aria-label="Categorias">
          <PanelTitle>Categorias</PanelTitle>
          <CategoriesManager />
        </Panel>
      </div>
    </>
  )
}
