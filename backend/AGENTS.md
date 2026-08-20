# Diretrizes do backend (`backend/`)

Leia `../AGENTS.md`. Skills: `.cursor/skills/fincontrol-backend-change/SKILL.md` e, se schema, `fincontrol-database-safety`.

## Padrão

- NestJS 10, Prisma 6, `class-validator`, `ValidationPipe` global (`whitelist`).
- `controller` → DTO → `service` → `PrismaService`. Módulo novo entra em `src/app.module.ts`.
- Não instancie `PrismaClient` fora de `src/prisma/prisma.service.ts`.
- DTOs com `@IsIn` para `INCOME|EXPENSE|PAYMENT` e status `PENDING|COMPLETED|CANCELLED|SCHEDULED`.

## Dinheiro e persistência

- `Decimal` + `prisma.$transaction` em create/update/delete que mexe saldo ou parcelas.
- Só `COMPLETED` incrementa `currentBalance`. `pay` promove `SCHEDULED`/`PENDING` e então move saldo.
- `USER_ID = 'user-id'` é débito compartilhado; não substitua por `dto.userId` solto.
- Schema dono: `prisma/schema.prisma`. Zero comandos Prisma sem autorização explícita.

## Auth e superfície HTTP

- `/auth/*` devolve `{ user }` sem JWT. Rotas de recurso estão abertas — não adicione `@Public` improvisado nem remova checagens futuras.
- CORS: `FRONTEND_URL` (lista) ou `true` em dev. Não alargar origem em produção por conveniência.
- Upload: Cloudinary se env completo; senão `uploads/` estático. Allowlist de tipo/tamanho.

## Validação

- `npx tsc --noEmit -p tsconfig.json`. Sem Jest no repo. Sem `start:dev`. Ver `../.agents/VALIDATION.md`.

## Code review

- Sinalize SQL interpolado, saldo fora de transação, `TRANSFER`, segundo PrismaClient, log de senha/token, DTO sem validação.
