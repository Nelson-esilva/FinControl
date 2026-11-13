# Mapa do FinControl

```text
browser (Next.js :3000)
  ├─ App Router  src/app/<rota>/page.tsx
  ├─ Auth UI     contexts/auth-context.tsx  → localStorage "fincontrol_user"
  ├─ HTTP        lib/api.ts  →  NEXT_PUBLIC_API_URL
  └─ Domínio     lib/finance/{client,types,format}.ts + lib/hooks/use-api.ts

NestJS API (:3001)
  ├─ main.ts     ValidationPipe + CORS (FRONTEND_URL)
  ├─ módulos     auth, users, accounts, categories, transactions,
  │              budgets, notifications, attachments, analytics,
  │              recurring-expenses, upload, pluggy (opcional)
  ├─ regras      ledger/rules.ts (puro) + accounts/ledger-balance.ts (saldo)
  ├─ Prisma      backend/prisma/schema.prisma  → PostgreSQL :5433
  └─ extras      Cloudinary (avatar/anexo) | uploads locais | Resend (reset)

Infra: docker-compose.yml | frontend → Vercel | backend → Render | DB → Neon (prod)
```

Um único git na raiz `FinControl/`. `npm` + lockfiles separados em `backend/` e `frontend/`.

## Backend (`backend/src/`)

| Área | Caminho | Rotas |
| --- | --- | --- |
| Auth | `auth/` | `POST /auth/{register,login,forgot-password,reset-password,change-password}` |
| Users | `users/` | `CRUD /users`, `POST /users/:id/avatar` |
| Accounts | `accounts/` | `CRUD /accounts` (resumo com fatura/rendimento), `GET/POST /accounts/:id/valuations`, `GET /accounts/:id/invoices/:month` |
| Categories | `categories/` | `CRUD /categories?type=` |
| Transactions | `transactions/` | `CRUD /transactions` (filtros q/tag/nature/installments), `PATCH :id/pay`, `PATCH :id/unpay`, `DELETE :id?scope=all`, `GET /transactions/tags` |
| Recurring | `recurring-expenses/` | CRUD + `summary`, `bills/:month`, `:id/candidates`, `:id/pay`, `:id/undo-pay` |
| Budgets | `budgets/` | `POST` (upsert por categoria), `GET ?month=`, `PUT/DELETE :id` |
| Analytics | `analytics/` | `GET overview`, `spending?groupBy=`, `cashflow`, `net-worth` |
| Pluggy | `pluggy/` | items, sync, webhooks (opcional; UI em Configurações) |
| Notifications | `notifications/` | list/read/`read-all` |
| Attachments | `attachments/` | por transação |
| Health | `health.controller.ts` | `GET /health` |

Padrão: `*.module.ts` + `*.controller.ts` + `*.service.ts` + `dto/`. Pipe global com `whitelist`.
Serviços de domínio ainda usam `const USER_ID = 'user-id'` — débito conhecido, não “corrija” de passagem.
Não há JWT/guard nas rotas. Login devolve `{ user }` sem token.

## Frontend (`frontend/src/`)

| Rota | Papel |
| --- | --- |
| `/` | Visão geral: livre para gastar, KPIs, próximos vencimentos |
| `/lancamentos` | Lançamentos por dia, busca, filtros, formulário |
| `/compromissos` | Contas do mês (lista/calendário/cadastrados), faturas, dívidas |
| `/orcamento` | Limite mensal por categoria + ritmo |
| `/patrimonio` | Contas, cartões, investimentos, patrimônio líquido |
| `/analises` | Onde / quando / por quê |
| `/users` | Lista (SUPERUSER) |
| `/profile`, `/settings` | Perfil e preferências |
| `/login`, `/signup`, `/forgot-password`, `/reset-password` | Auth pública |

- Shell: `components/layout/{app-shell,sidebar,mobile-nav}.tsx`. Lançamento rápido global (tecla N): `components/finance/quick-add.tsx`.
- Componentes de domínio: `components/finance/*`. Rotas antigas redirecionam em `next.config.js`.
- UI: shadcn em `components/ui/`; não copie esses primitivos.
- Cliente: `lib/api.ts` (get/post/put/delete/upload). Domínio em `lib/finance/client.ts`; `lib/api-data.ts` só usuários/perfil/Pluggy.
- `hasApi` cai para arrays vazios se `NEXT_PUBLIC_API_URL` faltar — preserve o fallback, não silencie erro de escrita sem necessidade.
- `DEFAULT_USER_ID = "user-id"` em `api-data.ts` espelha o backend.

## Prisma duplicado

| Arquivo | Status |
| --- | --- |
| `backend/prisma/schema.prisma` | **Fonte da verdade** (`UserRole`, `password_hash`, phone, reset token) |
| `frontend/prisma/schema.prisma` | Cópia incompleta; só relevante ao legado de Server Actions |

Não trate os dois como sincronizados. Migration vive no backend.

## Delimitar tarefa

- Só UI/estado: `frontend/` + tipos em `api-data` se o shape já existe.
- Regra, saldo, parcela, recorrência: `backend/` service + DTO; depois consumidor frontend.
- Schema/persistência: backend Prisma, sob política de banco.
- Auth de verdade (JWT/guard): os dois lados e `USER_ID`; é mudança transversal — use a skill cruzada.
- Não leia `frontend/PROJECT_SUMMARY.md`: descreve mock/NextAuth/TRANSFER e está errado.
