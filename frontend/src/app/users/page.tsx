"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { fetchUsers, type ApiUserListItem } from "@/lib/api-data"
import { Users as UsersIcon } from "lucide-react"

export default function UsersPage() {
  const router = useRouter()
  const { isSuperUser } = useAuth()
  const [list, setList] = useState<ApiUserListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSuperUser) {
      router.replace("/dashboard")
      return
    }
    fetchUsers().then((data) => {
      setList(data ?? [])
      setLoading(false)
    })
  }, [isSuperUser, router])

  if (!isSuperUser) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Usuários</h1>
        <p className="text-muted-foreground">
          Gerencie os usuários do sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5" />
            Lista de usuários
          </CardTitle>
          <CardDescription>
            Todos os usuários cadastrados na plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Carregando…</p>
          ) : list.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhum usuário encontrado.</p>
          ) : (
            <div className="space-y-3">
              {list.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user.name ? user.name.slice(0, 2).toUpperCase() : user.email.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.name ?? "—"}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <Badge variant={user.role === "SUPERUSER" ? "default" : "secondary"}>
                    {user.role === "SUPERUSER" ? "Superusuário" : "Usuário"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
