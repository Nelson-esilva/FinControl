# FinControl — instruções para agentes

App fullstack de controle financeiro (BRL). `backend/` = API NestJS + Prisma (dono dos dados). `frontend/` = Next.js 15 (UI). Antes de editar, leia o `AGENTS.md` da pasta alvo; o mais próximo do arquivo vence.

## Contexto sob demanda (não carregue tudo)

| Precisa de | Abra |
| --- | --- |
| Mapa, rotas, o que não expandir | `.agents/SYSTEM_MAP.md` |
| Glossário, dinheiro, dívidas conhecidas | `.agents/CONTEXT.md` |
| O que pode/não pode executar | `.agents/GOVERNANCE.md` |
| Como validar sem efeito colateral | `.agents/VALIDATION.md` |
| API Nest / saldo / DTO | `.cursor/skills/fincontrol-backend-change` |
| Página, shadcn, `api.ts` | `.cursor/skills/fincontrol-frontend-change` |
| Os dois lados ou contrato | `.cursor/skills/fincontrol-cross-change` |
| Schema/migration | `.cursor/skills/fincontrol-database-safety` |

Não leia `frontend/PROJECT_SUMMARY.md`. Não copie README para o contexto.

## Inegociáveis

1. Nenhum SQL, Prisma (`generate`, `migrate`, `db *`, `studio`), seed ou cliente de banco sem o comando exato autorizado.
2. Nenhum `.env*`, segredo, Cloudinary/Resend/AWS. Só informe nomes de variável que o código já exige.
3. Sem Docker, deploy (Vercel/Render), push, `npm install` ou troca de lockfile sem pedido.
4. Sem Git destrutivo. Não reverter, formatar em massa nem incluir arquivo fora do pedido.
5. `backend/prisma/schema.prisma` é a fonte da verdade. Não trate `frontend/prisma` como schema vivo.
6. Regra de dinheiro no backend: `Decimal`, `prisma.$transaction`, saldo só com status `COMPLETED`.
7. Não “corrija” `USER_ID = 'user-id'`, JWT ausente, Server Actions ou NextAuth por conta própria.
8. Preserve `pt-BR`, BRL e o isolamento lógico por `userId`.

## Fluxo econômico

1. `git status --short` na raiz `FinControl/`.
2. `rg` no símbolo/rota; exclua `node_modules`, `.next`, `dist`, `uploads`.
3. Leia alvo + DTO/tipo + um vizinho + consumidor (`api-data` / `api-recurring`). Pare.
4. Backend = dono da regra. Frontend = apresentação e chamada HTTP (`lib/api.ts`).
5. Diff mínimo, tipado, reversível. Enums: `INCOME|EXPENSE|PAYMENT`.
6. Valide o arquivo/módulo; typecheck se tipos mudaram. Sem `--fix` no repositório. Sem `dev`/browser.
7. Entregue: arquivos, checagens feitas, checagens omitidas (Prisma, Docker, env), riscos.

## Qualidade

- Causa, não sintoma. Contrato público atualizado nos dois lados ou declarado.
- Validar na fronteira (DTO). Não logar senha, token de reset ou payload de usuário.
- Comentário só para invariante de saldo/parcela/auth — não narrar código.
- Sucesso só com evidência. Falta de autorização ≠ “testei no banco”.
