# Validação segura — FinControl

Menor prova possível. Antes de rodar script, confira se ele abre Postgres, lê `.env` ou sobe servidor.

## Sempre

| Checagem | Uso |
| --- | --- |
| `git status --short` e `git diff -- <arquivos>` | Escopo |
| `git diff --check` | Espaço/conflito |
| `rg` no símbolo/rota | Consumidores |

## Backend (`backend/`)

1. `npx tsc --noEmit -p tsconfig.json` após mudança de tipos/DTO/módulo.
2. Não há ESLint/Jest versionados; não invente suíte. Se adicionar teste, deve mockar Prisma e não conectar.
3. `npm run build` (`nest build`) só se a mudança afetar composição ou entrega.

Não: `npm run start:dev`, `db:*`, `prisma *`, `npm install`, Docker, hit em `:3001`.

## Frontend (`frontend/`)

1. `npx tsc --noEmit` (script `build` também type-checka, mas é caro).
2. `npx next lint --file <arquivos>` se tocar UI; não `npm run lint` em todo o app por hábito.
3. `npm run build` apenas para rotas novas, `next.config`, ou entrega completa.

Não: `npm run dev`, browser, Prisma do frontend, `npm install`.

## Relato

Liste comandos e resultado. Se omitiu por banco/rede/segredo/autorização, diga; não substitua por “está ok”.
