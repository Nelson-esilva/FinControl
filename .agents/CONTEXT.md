# Contexto de domínio — FinControl

SaaS de gestão financeira pessoal (BRL, `pt-BR`). Visual: fintech limpa (indigo / emerald receita / rose despesa), Inter, dark default.

## Vocabulário

| Termo | Significado |
| --- | --- |
| Account | Conta corrente, poupança, investimento, cartão, carteira |
| Transaction | Lançamento: `INCOME`, `EXPENSE` ou `PAYMENT` |
| PAYMENT | Quitação (ex.: fatura de cartão), não é receita |
| RecurringExpense | Fixa, parcela, fatura, empréstimo, assinatura |
| Budget | Teto por categoria/período; alerta 80% e 100% |
| Installment | N lançamentos ligados por `parentTransactionId` |
| SUPERUSER | Vê `/users`; `USER` não. Só UI por enquanto |

## Invariantes de dinheiro

1. Persistência em `Decimal(15,2)`. Conversão JS: 2 casas; resto de centavos na 1ª parcela.
2. Saldo da conta (`currentBalance`) só muda em lançamento `COMPLETED` (incremento +income / −expense|payment) e na reversão correspondente.
3. Criar/editar/apagar lançamento que afeta saldo = `prisma.$transaction`.
4. Parcelas futuras: `SCHEDULED`, sem mover saldo até `pay`.
5. Cartão: limite e vencimento (`dueDate` dia 1–31) são da Account `CREDIT_CARD`; fatura recorrente é `RecurringType.CREDIT_CARD`.
6. Categoria de transação não pode ser apagada se houver lançamentos (`onDelete: Restrict`).

## Auth atual (não inventar NextAuth)

- Backend: bcrypt no `password` (`password_hash`); reset via token SHA-256 + Resend.
- Frontend: `POST /auth/login` → grava `{ id, email, name, role }` em `localStorage`.
- Sem JWT, sem cookie de sessão, sem header nas chamadas `apiGet/apiPost`.
- `NEXTAUTH_*` no `.env.example` do frontend está **não usado**.

## Dívidas — não “consertar” sem pedido

- `USER_ID = 'user-id'` nos services Nest.
- APIs sem guarda de autenticação/autorização.
- Server Actions + Prisma no frontend (`app/actions/transactions.ts` ainda cita `TRANSFER`).
- `payTransaction` em `api-data.ts` está inconsistente com `PATCH /transactions/:id/pay`.
- `AppShell` precisa tratar rotas públicas de reset/forgot junto com login/signup.

## Moeda e data

- Exibir com `formatCurrency` / `formatDate` (`src/lib/utils.ts`).
- Datas de negócio: calendário local; não converter com offset fixo sem contrato do campo.
- Dashboard agrega mês corrente vs anterior; preserve timezone consistente com o backend.

## Pacotes e runtime

- Node + TypeScript. Frontend: Next 15, React 19, Tailwind 3, Zod, Recharts, lucide.
- Backend: Nest 10, Prisma 6, class-validator, bcrypt, Cloudinary, Resend.
- Install frontend: `npm install --legacy-peer-deps` (documentado). Não rode por conta própria.
