# Diretrizes do frontend (`frontend/`)

Leia `../AGENTS.md`. Skill: `.cursor/skills/fincontrol-frontend-change/SKILL.md`.

## Padrão

- Next.js 15 App Router, React 19, Tailwind, shadcn (`src/components/ui`), alias `@/`.
- HTTP: `src/lib/api.ts`. Domínio: `api-data.ts`, `api-recurring.ts`. Sem Axios extra.
- Não cresça `src/app/actions/` nem `src/lib/prisma.ts` (legado; schema local defasado).
- Páginas em `src/app/<rota>/page.tsx`. Layout: `app-shell` + `sidebar` + `top-bar`.

## Auth e rotas

- `AuthProvider` + `localStorage` chave `fincontrol_user`. Sem Bearer nas chamadas.
- Públicas: `/login`, `/signup`, `/forgot-password`, `/reset-password`. Privadas pelo `AppShell`.
- `/users` só faz sentido para `SUPERUSER` — esconder menu não é autorização de API.
- Ignore `NEXTAUTH_*` do `.env.example`; não instale NextAuth sem pedido.

## UX e tipos

- `pt-BR` + BRL (`formatCurrency`, `formatDate`). Dark default (`next-themes`).
- Toast: Sonner já no layout. Loading/empty/error nas listas.
- Enums iguais ao backend (`PAYMENT`, não `TRANSFER` das Server Actions).

## Validação

- `npx tsc --noEmit`; lint só nos arquivos tocados. Sem `next dev`. Ver `../.agents/VALIDATION.md`.

## Code review

- Sinalize fetch solto na página, primitivo shadcn duplicado, quebra de dark mode, mutação que engole erro, uso novo de Prisma no Next.
