"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { FormDialog } from "./form-dialog"
import { TransactionForm, type TransactionPrefill } from "./transaction-form"
import type { Transaction } from "@/lib/finance/types"

interface QuickAddValue {
  open: (prefill?: TransactionPrefill) => void
  edit: (tx: Transaction) => void
}

const QuickAddContext = createContext<QuickAddValue | null>(null)

export function useQuickAdd() {
  const ctx = useContext(QuickAddContext)
  if (!ctx) throw new Error("useQuickAdd fora do QuickAddProvider")
  return ctx
}

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null
  return !!el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))
}

/** Lançamento rápido global: botão "Novo lançamento" e atalho N em qualquer tela. */
export function QuickAddProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ open: boolean; prefill?: TransactionPrefill; editing?: Transaction; key: number }>({
    open: false,
    key: 0,
  })

  const open = useCallback((prefill?: TransactionPrefill) => setState((s) => ({ open: true, prefill, key: s.key + 1 })), [])
  const edit = useCallback((tx: Transaction) => setState((s) => ({ open: true, editing: tx, key: s.key + 1 })), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "n" || e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return
      if (document.querySelector("[role=dialog]")) return
      e.preventDefault()
      open()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  const title = state.editing ? "Editar lançamento" : "Novo lançamento"

  return (
    <QuickAddContext.Provider value={{ open, edit }}>
      {children}
      <FormDialog open={state.open} onOpenChange={(o) => setState((s) => ({ ...s, open: o }))} title={title}>
        <TransactionForm
          key={state.key}
          editing={state.editing}
          prefill={state.prefill}
          autoFocus
          onDone={() => setState((s) => ({ ...s, open: false }))}
        />
      </FormDialog>
    </QuickAddContext.Provider>
  )
}
