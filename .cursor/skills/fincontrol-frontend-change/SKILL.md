---
name: fincontrol-frontend-change
description: Implementa UI e cliente HTTP do FinControl (App Router, shadcn, api.ts). Use ao editar frontend/, páginas, layout, auth-context ou lib/api*.
---

# Mudança no frontend FinControl

1. Leia `../../../.agents/SYSTEM_MAP.md` (rotas de página). Se for dado/contrato, confirme o endpoint no backend antes de inventar shape.
2. Dados: `lib/api.ts` + `api-data.ts` / `api-recurring.ts`. Proibido segundo cliente HTTP. Não expanda `app/actions/` nem `lib/prisma.ts`.
3. Página em `src/app/<rota>/page.tsx`. Extraia só quando a tela vizinha já o faz. Primitivos: `components/ui/` (shadcn) e `cn()`.
4. Auth de navegação: `useAuth()` / `AppShell`. Rotas públicas: `/login`, `/signup`, `/forgot-password`, `/reset-password`.
5. BRL/`pt-BR` via `formatCurrency` e `formatDate`. Cores de receita/despesa: emerald/rose já usadas. Preserve dark mode.
6. Tipos em `src/types/index.ts` alinhados aos enums do backend (`PAYMENT`, não `TRANSFER`).
7. `hasApi` permanece como fallback de leitura. Mutação deve evidenciar falha (toast), não retornar `null` silencioso em fluxo crítico novo.
8. Valide conforme `../../../.agents/VALIDATION.md`. Não suba `next dev`.
