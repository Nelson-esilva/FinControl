# FinControl - SaaS de Controle Financeiro Enterprise

Plataforma SaaS de Controle Financeiro de alto nível, desenvolvida com as tecnologias mais modernas de 2026.

## 🚀 Stack Tecnológica

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS v4
- **Componentes:** shadcn/ui, Radix UI, Lucide React
- **Gráficos:** Recharts
- **Backend:** Next.js Server Actions
- **Banco de Dados:** PostgreSQL
- **ORM:** Prisma (Schema-first)
- **Validação:** Zod + React Hook Form

## 📁 Estrutura do Projeto

```
fincontrol/
├── prisma/
│   └── schema.prisma          # Schema do banco de dados
├── src/
│   ├── app/
│   │   ├── actions/           # Server Actions
│   │   │   └── transactions.ts
│   │   ├── dashboard/         # Página Dashboard
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── transactions/      # Página de Transações
│   │   │   └── page.tsx
│   │   ├── wallet/            # Página Carteira
│   │   │   └── page.tsx
│   │   ├── budget/            # Página Orçamento
│   │   │   └── page.tsx
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                # Componentes shadcn/ui
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── calendar.tsx
│   │   │   ├── popover.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── tooltip.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── skeleton.tsx
│   │   │   └── sonner.tsx
│   │   ├── layout/            # Componentes de layout
│   │   │   ├── sidebar.tsx
│   │   │   └── top-bar.tsx
│   │   └── theme-provider.tsx
│   ├── lib/
│   │   ├── utils.ts           # Utilitários
│   │   └── prisma.ts          # Configuração Prisma
│   └── types/
│       └── index.ts           # Tipos TypeScript
├── .env.example
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

## 🛠️ Instalação

### 1. Clone o repositório

```bash
git clone <repository-url>
cd fincontrol
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações (ou use o `.env` já configurado para Docker).

### 4. Banco de dados com Docker

Suba o PostgreSQL com Docker (porta **5433** se a 5432 já estiver em uso):

```bash
docker compose up -d
```

O `.env` já deve conter:

```env
DATABASE_URL="postgresql://fincontrol:fincontrol_secret@localhost:5433/fincontrol?schema=public"
```

Gere o cliente Prisma e aplique as migrações:

```bash
npm run db:generate
npx prisma migrate dev
# ou: node node_modules/prisma/build/index.js migrate dev --name init
```

(Opcional) Abrir Prisma Studio:

```bash
npm run db:studio
```

### 5. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:3000` no seu navegador.

## 📊 Funcionalidades

### Dashboard (`/dashboard`)
- **Cards de KPI:** Saldo Total, Receitas, Despesas, Balanço Líquido
- **Gráfico Principal:** Evolução financeira dos últimos 12 meses (AreaChart)
- **Gráfico Secundário:** Distribuição de gastos por categoria (DonutChart)
- **Transações Recentes:** Lista das últimas 5 movimentações

### Gestão de Transações (`/transactions`)
- **Data Table:** Tabela avançada com filtros e ordenação
- **Filtros:** Busca por texto, intervalo de datas, categoria, tipo
- **Upload de Anexos:** Dropzone para faturas (PDF/IMG)
- **Parcelamento:** Suporte a compras parceladas

### Carteira (`/wallet`)
- **Gestão de Contas:** Contas corrente, poupança, investimentos, cartões
- **Visualização de Crédito:** Limite utilizado vs. disponível
- **Tabs:** Filtragem por tipo de conta

### Orçamento (`/budget`)
- **Metas por Categoria:** Definição de teto de gastos
- **Alertas Visuais:** Notificações aos 80% e 100%
- **Progresso Geral:** Visão consolidada de todos os orçamentos

## 🗄️ Modelagem de Dados

### Entidades Principais

- **User:** Dados de autenticação e preferências
- **Account:** Contas bancárias, cartões, investimentos
- **Transaction:** Receitas e despesas com suporte a parcelamento
- **Category:** Categorias de transações
- **Attachment:** Anexos vinculados às transações
- **Budget:** Orçamentos por categoria
- **Notification:** Notificações do sistema

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Produção
npm run start

# Lint
npm run lint

# Database
npm run db:generate    # Gerar cliente Prisma
npm run db:migrate     # Executar migrações
npm run db:studio      # Abrir Prisma Studio
```

## 🎨 Design System

### Paleta de Cores
- **Fundo:** Slate-50 (Light) / Slate-900 (Dark)
- **Receitas:** Emerald-500
- **Despesas:** Rose-500
- **Ações Primárias:** Indigo-600

### Tipografia
- **Fonte:** Inter

### Componentes
- Cards com sombra suave e hover effects
- Badges coloridos por categoria
- Progress bars com indicadores de status
- Gráficos responsivos com Recharts

## 🔐 Segurança

- Validação de dados com Zod
- SQL Injection prevention via Prisma ORM
- XSS protection via React
- CSRF protection via Next.js

## 📈 Próximos Passos

- [ ] Implementar autenticação com NextAuth.js
- [ ] Integrar com APIs bancárias (Open Banking)
- [ ] Implementar relatórios avançados
- [ ] Adicionar suporte a múltiplas moedas
- [ ] Implementar recorrência de transações
- [ ] Criar aplicativo mobile

## 📝 Licença

Este projeto está licenciado sob a licença MIT.

## 👥 Contribuição

Contribuições são bem-vindas! Por favor, abra uma issue ou pull request.

---

Desenvolvido com ❤️ pela equipe FinControl
