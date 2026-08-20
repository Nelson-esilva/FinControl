# Governança de agentes — FinControl

## Autoridade

O pedido define o objetivo, não autoriza efeitos colaterais. Código no escopo pode ser editado;
dados, ambiente, dependências e serviços externos exigem permissão explícita para o comando exato.

## Matriz

### Permitido no escopo pedido

- Ler código, manifests e docs, excluindo `.env*`, credenciais e dumps.
- Editar fontes e testes necessários à mudança.
- Typecheck/lint estático nos arquivos alterados, sem `--fix` em massa.
- Fixtures sintéticas, sem dados reais de usuários.
- Preparar migration/schema como artefato de revisão, sem aplicar nem gerar cliente.

### Exige autorização imediata e explícita

- Qualquer Prisma: `generate`, `migrate`, `db push/pull`, `studio`, scripts `db:*`.
- `npm install`, troca de lockfile ou versão de dependência (`--legacy-peer-deps` incluso).
- Docker/Compose, `npm run dev`/`start`, E2E, conexão a Postgres/Neon, Cloudinary, Resend.
- Deploy (Vercel/Render), push, CI, alteração de `render.yaml`/`vercel.json`/Dockerfiles.
- Ampliar CORS, tornar rota pública, ou “consertar” auth/`USER_ID` se não for o pedido.

### Proibido

- SQL ad hoc, cliente de banco, seed contra base compartilhada.
- Criar, copiar, imprimir ou editar `.env`, `.env.*`, chaves Cloudinary/Resend/AWS/Supabase.
- Usar dados reais em teste; logar senha, token de reset, e-mail+payload completo.
- Git destrutivo, revert de trabalho alheio, format-all, commit/push sem pedido.

## Dados financeiros e PII

- Isolamento por `userId` é invariante. Não misture contas/transações entre usuários.
- Autorização de UI (`role`, esconder menu) não substitui guarda na API — quando auth de API for
  introduzida, preserve-a; até lá, não finja que `localStorage` é segurança.
- Validar entrada no DTO. Uploads: allowlist de tipo/tamanho; não confiar no filename do cliente.
- Não persistir valor monetário como `float`. Não recalcular saldo “no olho”; derive do efeito da transação.

## Contratos

Toda mudança de rota, DTO, enum, status, campo Decimal ou shape de dashboard deve listar:

1. produtor (módulo Nest);
2. consumidores (`api.ts` / `api-data.ts` / `api-recurring.ts` / páginas);
3. compatibilidade;
4. teste possível sem banco.

Prefira mudança aditiva. Remoção de campo exige pedido explícito.

## Economia

- Uma fonte por regra: `AGENTS.md` (invariantes), este arquivo (permissão), skills (fluxo).
- Pare de investigar quando houver evidência para um diff pequeno.

## Conclusão

Tarefa concluída = diff no pedido + contrato rastreado + checagens seguras + limitações declaradas.
Falta de autorização externa não impede entregar código para revisão; deve ser dita.
