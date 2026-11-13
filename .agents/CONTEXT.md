# Contexto de domínio — FinControl

SaaS de gestão financeira pessoal (BRL, `pt-BR`). Visual FinControl 2.0 (design no Claude Design): dark default, Inter, primária #8B8CFF, receita azul `income`, gasto laranja `expense`, alerta `warning`.

## Vocabulário

| Termo | Significado |
| --- | --- |
| Account | Conta corrente, poupança, investimento, cartão, carteira |
| Transaction | Lançamento: `INCOME`, `EXPENSE` ou `PAYMENT` |
| PAYMENT | Transferência entre contas próprias (`accountId` → `transferAccountId`): fatura, aporte, resgate. Nunca é gasto nem receita |
| RecurringExpense | Compromisso: `FIXED`, `SUBSCRIPTION`, `INSTALLMENT` (carnê), `LOAN`, `INCOME` (salário). Pagar cria lançamento real e move saldo |
| Budget | Limite mensal por categoria (vale todo mês) + ritmo esperado |
| Nature | Por quê do gasto: `ESSENTIAL`, `IMPORTANT`, `SUPERFLUOUS` |
| AccountValuation | Valor de mercado de investimento; rendimento = valor − aplicado |
| Installment | N lançamentos ligados por `parentTransactionId` |
| SUPERUSER | Vê `/users`; `USER` não. Só UI por enquanto |

## Invariantes de dinheiro

1. Persistência em `Decimal(15,2)`. Conversão JS: 2 casas; resto de centavos na 1ª parcela.
2. Saldo da conta (`currentBalance`) só muda em lançamento `COMPLETED` (incremento +income / −expense|payment) e na reversão correspondente.
3. Criar/editar/apagar lançamento que afeta saldo = `prisma.$transaction`.
4. Parcelas futuras fora do cartão: `SCHEDULED`, sem mover saldo até `pay`. No cartão: todas `COMPLETED` (dívida na compra), uma por `invoiceMonth`.
5. Cartão: `closingDay`/`dueDate` na Account `CREDIT_CARD`; fatura = soma das compras por `invoiceMonth` (mês de fechamento) − PAYMENTs com o mesmo `invoiceMonth`.
7. Saldo só muda via `applyTransactionEffects` (`accounts/ledger-balance.ts`). Regras de data/parcela/fatura em `ledger/rules.ts` (datas de negócio às 12:00 UTC).
6. Categoria de transação não pode ser apagada se houver lançamentos (`onDelete: Restrict`).

## Auth atual (não inventar NextAuth)

- Backend: bcrypt no `password` (`password_hash`); reset via token SHA-256 + Resend.
- Frontend: `POST /auth/login` → grava `{ id, email, name, role }` em `localStorage`.
- Sem JWT, sem cookie de sessão, sem header nas chamadas `apiGet/apiPost`.
- `NEXTAUTH_*` no `.env.example` do frontend está **não usado**.

## Dívidas — não “consertar” sem pedido

- `USER_ID = 'user-id'` nos services Nest.
- APIs sem guarda de autenticação/autorização.
- Contas Pluggy: pagamento de fatura importado do extrato entra como EXPENSE (pode duplicar gasto do cartão).

## Moeda e data

- Exibir com `formatCurrency` / `formatDate` (`src/lib/utils.ts`).
- Datas de negócio: calendário local; não converter com offset fixo sem contrato do campo.
- Dashboard agrega mês corrente vs anterior; preserve timezone consistente com o backend.

## Pacotes e runtime

- Node + TypeScript. Frontend: Next 15, React 19, Tailwind 3, Zod, Recharts, lucide.
- Backend: Nest 10, Prisma 6, class-validator, bcrypt, Cloudinary, Resend.
- Install frontend: `npm install --legacy-peer-deps` (documentado). Não rode por conta própria.
