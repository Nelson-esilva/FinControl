---
name: fincontrol-cross-change
description: Planeja mudanças que atravessam Next.js e NestJS do FinControl (contrato de API, auth, schema, dashboard). Use quando a tarefa tocar frontend e backend ou alterar DTO/enum/rota consumida pela UI.
---

# Mudança transversal

1. Leia `../../../.agents/SYSTEM_MAP.md`, `../../../.agents/GOVERNANCE.md` e `../../../.agents/CONTEXT.md`. Depois os `AGENTS.md` só dos lados envolvidos.
2. Uma linha de fluxo: UI → `api*` → rota Nest → service → Prisma → resposta → página.
3. Ache o contrato com `rg` no símbolo/path (`/transactions`, `CreateTransactionDto`, `fetchTransactions`). Ignore `.next`/`dist`/`node_modules`.
4. Dono da regra: backend. React não recalcula saldo, alerta de orçamento ou quitação de fatura.
5. Contrato aditivo primeiro. Quebra (renomear enum, remover campo Decimal, mudar status) exige confirmação.
6. Auth/`USER_ID`/JWT é transversal: API + `auth-context` + chamadas `apiGet/Post` + services. Não faça metade.
7. Schema: backend primeiro; frontend schema só se o legado Server Actions ainda depender — declare.
8. Diff mínimo em cada lado. Validação: `../../../.agents/VALIDATION.md`. Entregue matriz: arquivo, mudança, checagem, se precisa deploy coordenado (Vercel+Render).
