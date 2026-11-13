/**
 * Usuários, perfil e conexões bancárias (Pluggy).
 * Dados financeiros ficam em src/lib/finance/client.ts.
 */

import { apiGet, apiPost, apiPut, apiDelete, apiPatch, apiUpload, hasApi } from "./api"

/** ID do usuário atual (até implementar autenticação real). */
export const DEFAULT_USER_ID = "user-id"

/** Cadastra novo usuário. Em erro lança exceção (ex.: e-mail já cadastrado). */
export async function registerUser(body: {
  name: string
  email: string
  password: string
}): Promise<void> {
  await apiPost("/auth/register", body)
}

function toNum(v: unknown): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v
  if (typeof v === "object" && v !== null && "toNumber" in (v as { toNumber?: () => number }))
    return (v as { toNumber: () => number }).toNumber()
  const n = Number(v)
  return Number.isNaN(n) ? 0 : n
}

// ========== Perfil e Usuários ==========

export type ApiUserRole = "USER" | "SUPERUSER"

export interface ApiProfile {
  id: string
  email: string
  name: string | null
  phone: string | null
  avatar: string | null
  role?: ApiUserRole
  createdAt: string
  updatedAt: string
}

export interface ApiUserListItem extends ApiProfile {
  role: ApiUserRole
}

export async function fetchUsers(): Promise<ApiUserListItem[] | null> {
  if (!hasApi) return null
  try {
    const data = await apiGet<ApiUserListItem[]>("/users")
    return Array.isArray(data) ? data : []
  } catch {
    return null
  }
}

export async function fetchProfile(userId: string): Promise<ApiProfile | null> {
  if (!hasApi) return null
  try {
    const data = await apiGet<ApiProfile>(`/users/${userId}`)
    return data
  } catch {
    return null
  }
}

export async function updateProfile(
  userId: string,
  body: { name?: string; email?: string; phone?: string }
): Promise<ApiProfile | null> {
  if (!hasApi) return null
  try {
    const updated = await apiPut<ApiProfile>(`/users/${userId}`, body)
    return updated
  } catch {
    return null
  }
}

export async function uploadProfileAvatar(userId: string, file: File): Promise<{ avatar: string } | null> {
  if (!hasApi) return null
  try {
    const formData = new FormData()
    formData.append("avatar", file)
    const result = await apiUpload<{ avatar: string }>(`/users/${userId}/avatar`, formData)
    return result
  } catch {
    return null
  }
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ ok: boolean; message?: string }> {
  if (!hasApi) return { ok: false, message: 'API não configurada.' }
  try {
    const res = await apiPost<{ message: string }>("/auth/change-password", { userId, currentPassword, newPassword })
    return { ok: true, message: res?.message }
  } catch (err: any) {
    return { ok: false, message: err?.response?.data?.message || err.message || 'Erro ao alterar a senha.' }
  }
}

export { toNum, hasApi }

export interface ApiPluggyItem {
  id: string
  pluggyItemId: string
  connectorName?: string | null
  status?: string | null
  executionStatus?: string | null
  lastSyncedAt?: string | null
  lastError?: string | null
  accountCount?: number
  transactionCount?: number
  _count?: { accounts: number }
}

export async function fetchPluggyItems(): Promise<ApiPluggyItem[]> {
  if (!hasApi) return []
  const list = await apiGet<ApiPluggyItem[]>("/pluggy/items")
  return Array.isArray(list) ? list : []
}

export async function registerPluggyItem(itemId: string): Promise<ApiPluggyItem> {
  return apiPost<ApiPluggyItem>("/pluggy/items", { itemId })
}

export async function syncPluggyItem(id: string): Promise<ApiPluggyItem> {
  return apiPost<ApiPluggyItem>(`/pluggy/items/${id}/sync`, {})
}

/** Usa POST /pluggy/items/:id/sync em cada conexão — já existe no backend em execução. */
export async function syncAllPluggyItems(ids: string[]): Promise<{
  itemCount: number
  accountCount: number
  transactionCount: number
  errors: string[]
}> {
  let accountCount = 0
  let transactionCount = 0
  const errors: string[] = []
  for (const id of ids) {
    try {
      const result = await syncPluggyItem(id)
      accountCount += result.accountCount ?? 0
      transactionCount += result.transactionCount ?? 0
    } catch (err) {
      errors.push(err instanceof Error ? err.message : id)
    }
  }
  if (ids.length > 0 && errors.length === ids.length) {
    throw new Error(errors[0] || "Falha ao sincronizar as contas.")
  }
  return { itemCount: ids.length, accountCount, transactionCount, errors }
}

export async function unlinkPluggyItem(id: string): Promise<void> {
  await apiDelete(`/pluggy/items/${id}`)
}
