---
name: fincontrol-backend-change
description: Implementa ou altera APIs NestJS do FinControl (módulos, DTO, PrismaService, saldo). Use ao editar backend/, controllers, services, DTOs ou regras de transação/conta/orçamento/recorrência.
---

# Mudança no backend FinControl

1. Leia `../../../.agents/SYSTEM_MAP.md` (rotas) e, se tocar dinheiro, `../../../.agents/CONTEXT.md`. Governança: `../../../.agents/GOVERNANCE.md`.
2. Localize o módulo existente (`src/<domínio>/`). Não crie pasta paralela para o mesmo recurso.
3. Controller só adapta HTTP. Validação no DTO (`class-validator` + `@IsIn` nos enums). Regra e Prisma no service.
4. Injete `PrismaService`. Escritas que movem saldo ou criam N parcelas: `this.prisma.$transaction`.
5. Preserve `USER_ID = 'user-id'` salvo o pedido ser auth real. Não leia `userId` do body sem contrato.
6. Schema: só `backend/prisma/schema.prisma`. Entregue migration como arquivo se pedida; não execute Prisma.
7. Rastreie consumidores em `frontend/src/lib/api-data.ts` e `api-recurring.ts`. Se o shape mudar, atualize no mesmo trabalho ou declare bloqueio.
8. Valide conforme `../../../.agents/VALIDATION.md`. Relato: arquivos, checagens, Prisma/Docker não rodados.
