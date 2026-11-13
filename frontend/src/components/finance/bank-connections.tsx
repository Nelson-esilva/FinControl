"use client"

import { useState } from "react"
import { RefreshCw, Unplug } from "lucide-react"
import { toast } from "sonner"
import { Action } from "./ui"
import { inputClass } from "./form"
import { errorMessage, notifyDataChanged } from "@/lib/finance/client"
import { fullDate } from "@/lib/finance/format"
import { fetchPluggyItems, registerPluggyItem, syncPluggyItem, unlinkPluggyItem } from "@/lib/api-data"
import { useApi } from "@/lib/hooks/use-api"

/** Pluggy é opcional: importa extrato de bancos conectados. O controle principal é manual. */
export function BankConnections() {
  const { data: items = [], reload } = useApi(() => fetchPluggyItems().catch(() => []), [])
  const [itemId, setItemId] = useState("")
  const [busy, setBusy] = useState(false)

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true)
    try {
      await fn()
      toast.success(ok)
      notifyDataChanged()
      await reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Opcional. Importa extrato e saldo de bancos conectados pelo Meu Pluggy. Contas conectadas ficam marcadas como “Banco conectado” e o saldo vem do banco.
      </p>
      <div className="flex flex-wrap gap-2">
        <input className={`${inputClass} min-w-[240px] flex-1 font-mono`} placeholder="Item ID (UUID)" value={itemId} onChange={(e) => setItemId(e.target.value)} disabled={busy} />
        <Action onClick={() => itemId.trim() && run(() => registerPluggyItem(itemId.trim()), "Conexão sincronizada.")} disabled={busy}>
          {busy ? "Sincronizando…" : "Conectar"}
        </Action>
      </div>
      {items.map((item) => (
        <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3">
          <div className="text-sm">
            <p className="font-medium">{item.connectorName ?? "Meu Pluggy"}</p>
            <p className="text-xs text-muted-foreground">
              {item.status ?? "—"}
              {item.lastSyncedAt ? ` · ${fullDate(item.lastSyncedAt)}` : ""}
            </p>
            {item.lastError && <p className="text-xs text-expense">{item.lastError}</p>}
          </div>
          <div className="flex gap-2">
            <Action onClick={() => run(() => syncPluggyItem(item.id), "Extrato atualizado.")} disabled={busy}>
              <RefreshCw /> Atualizar
            </Action>
            <Action
              variant="ghost"
              disabled={busy}
              onClick={() => window.confirm("Desvincular esta conexão? As contas importadas ficam inativas.") && run(() => unlinkPluggyItem(item.id), "Conexão removida.")}
            >
              <Unplug /> Desvincular
            </Action>
          </div>
        </div>
      ))}
    </div>
  )
}
