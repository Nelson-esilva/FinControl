"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTheme } from "next-themes"
import { Moon, Sun, Monitor, Bell, Mail, User, Info } from "lucide-react"

const STORAGE_KEYS = {
  notificationsApp: "fincontrol_settings_notifications_app",
  notificationsEmail: "fincontrol_settings_notifications_email",
}

function useStoredBoolean(key: string, defaultValue: boolean): [boolean, (v: boolean) => void] {
  const [value, setValue] = useState(defaultValue)
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const stored = localStorage.getItem(key)
      if (stored !== null) setValue(stored === "true")
    } catch {
      // ignore
    }
  }, [key])
  const set = (v: boolean) => {
    setValue(v)
    try {
      localStorage.setItem(key, String(v))
    } catch {
      // ignore
    }
  }
  return [value, set]
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [notificationsApp, setNotificationsApp] = useStoredBoolean(STORAGE_KEYS.notificationsApp, true)
  const [notificationsEmail, setNotificationsEmail] = useStoredBoolean(STORAGE_KEYS.notificationsEmail, false)

  useEffect(() => setMounted(true), [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Ajuste preferências do aplicativo
        </p>
      </div>

      {/* Aparência */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5" />
            Aparência
          </CardTitle>
          <CardDescription>
            Escolha o tema de exibição da interface
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tema</Label>
            {mounted && (
              <Select
                value={theme ?? "system"}
                onValueChange={(v) => setTheme(v as "light" | "dark" | "system")}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system" className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    Sistema
                  </SelectItem>
                  <SelectItem value="light">
                    <Sun className="h-4 w-4 inline mr-2" />
                    Claro
                  </SelectItem>
                  <SelectItem value="dark">
                    <Moon className="h-4 w-4 inline mr-2" />
                    Escuro
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
            {!mounted && (
              <div className="h-9 w-[200px] rounded-md border bg-muted/50 animate-pulse" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notificações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
          </CardTitle>
          <CardDescription>
            Configure como deseja receber avisos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificações no app</Label>
              <p className="text-xs text-muted-foreground">
                Exibir alertas e lembretes na interface
              </p>
            </div>
            <Switch
              checked={notificationsApp}
              onCheckedChange={setNotificationsApp}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Notificações por e-mail
              </Label>
              <p className="text-xs text-muted-foreground">
                Receber resumos e alertas por e-mail
              </p>
            </div>
            <Switch
              checked={notificationsEmail}
              onCheckedChange={setNotificationsEmail}
            />
          </div>
        </CardContent>
      </Card>

      {/* Conta e Sobre */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Geral
          </CardTitle>
          <CardDescription>
            Acesso rápido e informações do aplicativo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link href="/profile">
            <Button variant="outline" className="w-full justify-start gap-2">
              <User className="h-4 w-4" />
              Editar perfil
            </Button>
          </Link>
          <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">FinControl</p>
            <p>Versão 1.0.0</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
