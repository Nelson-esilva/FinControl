"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { User, Camera } from "lucide-react"
import {
  fetchProfile,
  updateProfile,
  uploadProfileAvatar,
  hasApi,
  DEFAULT_USER_ID,
  type ApiProfile,
} from "@/lib/api-data"
import { apiUrl } from "@/lib/api"

export default function ProfilePage() {
  const [profile, setProfile] = useState<ApiProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!hasApi) {
      setLoading(false)
      return
    }
    let cancelled = false
    fetchProfile(DEFAULT_USER_ID).then((data) => {
      if (cancelled) return
      setProfile(data)
      if (data) {
        setName(data.name ?? "")
        setEmail(data.email ?? "")
        setPhone(data.phone ?? "")
      }
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!hasApi) {
      toast.error("Configure a conexão com o servidor para editar o perfil.")
      return
    }
    setSaving(true)
    const updated = await updateProfile(DEFAULT_USER_ID, { name: name || undefined, email: email || undefined, phone: phone || undefined })
    setSaving(false)
    if (updated) {
      setProfile(updated)
      toast.success("Perfil atualizado.")
    } else {
      toast.error("Não foi possível atualizar o perfil.")
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !hasApi) return
    setUploading(true)
    const result = await uploadProfileAvatar(DEFAULT_USER_ID, file)
    setUploading(false)
    e.target.value = ""
    if (result?.avatar && profile) {
      setProfile({ ...profile, avatar: result.avatar })
      toast.success("Foto atualizada.")
    } else {
      toast.error("Não foi possível enviar a foto.")
    }
  }

  const avatarUrl = profile?.avatar
    ? profile.avatar.startsWith("http")
      ? profile.avatar
      : apiUrl(profile.avatar)
    : null

  if (!hasApi) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Perfil</h1>
          <p className="text-muted-foreground">Seus dados e foto de perfil</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Configure a conexão com o servidor para ver e editar seu perfil.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Perfil</h1>
          <p className="text-muted-foreground">Seus dados e foto de perfil</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Carregando perfil…
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Perfil</h1>
        <p className="text-muted-foreground">Edite seu nome, e-mail, telefone e foto</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados pessoais</CardTitle>
          <CardDescription>Altere as informações exibidas na sua conta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Foto */}
          <div className="flex items-center gap-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarChange}
              disabled={uploading}
            />
            <Avatar className="h-24 w-24 border-4 border-border">
              <AvatarImage src={avatarUrl ?? undefined} alt="Foto do perfil" />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                <User className="h-10 w-10" />
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <p className="text-sm font-medium">Foto de perfil</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Camera className="mr-2 h-4 w-4" />
                {uploading ? "Enviando…" : "Alterar foto"}
              </Button>
              <p className="text-xs text-muted-foreground">JPG, PNG ou WebP. Máx. 5 MB.</p>
            </div>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                disabled={saving}
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando…" : "Salvar alterações"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
