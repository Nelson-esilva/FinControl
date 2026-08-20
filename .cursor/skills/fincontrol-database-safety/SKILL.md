---
name: fincontrol-database-safety
description: Altera ou revisa Prisma/schema/migrations do FinControl sem executar banco. Use ao editar *.prisma, saldo, Decimal, relações ou quando o usuário pedir migrate/generate/seed.
---

# Segurança de banco

Proibido executar: SQL, `prisma generate|migrate|db push|db pull|studio`, `npm run db:*`, seed, Docker Postgres, conexão Neon.

1. Dono: `backend/prisma/schema.prisma`. Não “sincronize” o schema do frontend por reflexo.
2. Se a tarefa é só código: use modelos já existentes. Não adicione campo/enum sem pedido.
3. Se a tarefa pede schema: edite o `.prisma`, descreva a migration em texto ou arquivo para revisão, **pare**. Peça o comando exato para gerar/aplicar.
4. Money permanece `Decimal(15,2)`. Índices em `[userId, date]`, `[userId, type]`, contas e categorias — não drop sem motivo.
5. `onDelete`: User cascade; Category→Transaction **Restrict**; Attachment cascade com a transação. Não afrouxar.
6. Seed (`backend/src/seed.ts`) não roda neste fluxo. Não apague `USER_ID` assumindo que o seed criou outro usuário.
7. Relato: “schema editado, migration não aplicada, generate não rodado”.
