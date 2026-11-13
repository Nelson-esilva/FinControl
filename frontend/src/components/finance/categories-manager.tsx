"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Action, Segmented } from "./ui"
import { inputClass } from "./form"
import { createCategory, deleteCategory, errorMessage, fetchCategories, updateCategory } from "@/lib/finance/client"
import { PALETTE } from "@/lib/finance/format"
import { useApi } from "@/lib/hooks/use-api"

export function CategoriesManager() {
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE")
  const { data: categories = [] } = useApi(() => fetchCategories(type), [type])
  const [name, setName] = useState("")
  const [color, setColor] = useState(PALETTE[0])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    try {
      await createCategory({ name: name.trim(), type, color })
      setName("")
      toast.success("Categoria criada.")
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Segmented
        label="Tipo de categoria"
        className="max-w-xs border"
        options={[
          { value: "EXPENSE", label: "Gastos" },
          { value: "INCOME", label: "Receitas" },
        ]}
        value={type}
        onChange={setType}
      />
      <div className="flex flex-col">
        {categories.map((c) => (
          <div key={c.id} className="flex min-h-12 items-center gap-3 border-b last:border-b-0">
            <input
              type="color"
              aria-label={`Cor de ${c.name}`}
              defaultValue={c.color}
              onBlur={(e) => e.target.value !== c.color && updateCategory(c.id, { color: e.target.value }).catch((err) => toast.error(errorMessage(err)))}
              className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent p-0"
            />
            <span className="flex-1 text-sm">{c.name}</span>
            <button
              type="button"
              aria-label={`Excluir ${c.name}`}
              onClick={() =>
                window.confirm(`Excluir a categoria “${c.name}”?`) &&
                deleteCategory(c.id)
                  .then(() => toast.success("Categoria excluída."))
                  .catch((err) => toast.error(errorMessage(err)))
              }
              className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-expense"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <form onSubmit={add} className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1.5" role="radiogroup" aria-label="Cor da nova categoria">
          {PALETTE.slice(0, 6).map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={color === c}
              aria-label={c}
              onClick={() => setColor(c)}
              className={cn("h-7 w-7 rounded-full ring-offset-2 ring-offset-card", color === c && "ring-2 ring-foreground")}
              style={{ background: c }}
            />
          ))}
        </div>
        <input className={`${inputClass} min-w-[180px] flex-1`} placeholder="Nova categoria" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
        <Action type="submit">Adicionar</Action>
      </form>
    </div>
  )
}
