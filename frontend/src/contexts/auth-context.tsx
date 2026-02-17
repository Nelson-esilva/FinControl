"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { useRouter } from "next/navigation"
import { apiPost, hasApi } from "@/lib/api"

const STORAGE_KEY = "fincontrol_user"

export type UserRole = "USER" | "SUPERUSER"

export interface LoggedUser {
  id: string
  email: string
  name: string | null
  role: UserRole
}

interface AuthContextValue {
  user: LoggedUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => void
  isSuperUser: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadStoredUser(): LoggedUser | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as LoggedUser
    return parsed?.id && parsed?.email ? parsed : null
  } catch {
    return null
  }
}

function saveUser(user: LoggedUser | null) {
  if (typeof window === "undefined") return
  if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  else localStorage.removeItem(STORAGE_KEY)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<LoggedUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setUser(loadStoredUser())
    setLoading(false)
  }, [])

  const login = useCallback(
    async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
      if (!hasApi) return { ok: false, error: "Configure a conexão com o servidor." }
      try {
        const res = await apiPost<{ user: LoggedUser }>("/auth/login", { email, password })
        const u = res?.user
        if (!u?.id) return { ok: false, error: "Resposta inválida." }
        setUser(u)
        saveUser(u)
        return { ok: true }
      } catch (e: unknown) {
        let msg = "E-mail ou senha inválidos."
        if (e instanceof Error && e.message) {
          try {
            const parsed = JSON.parse(e.message) as { message?: string }
            if (parsed?.message) msg = Array.isArray(parsed.message) ? parsed.message[0] : parsed.message
          } catch {
            if (e.message.length < 200) msg = e.message
          }
        }
        return { ok: false, error: msg }
      }
    },
    []
  )

  const logout = useCallback(() => {
    setUser(null)
    saveUser(null)
    router.replace("/login")
  }, [router])

  const value: AuthContextValue = {
    user,
    loading,
    login,
    logout,
    isSuperUser: user?.role === "SUPERUSER",
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
