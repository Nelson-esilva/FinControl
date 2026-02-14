# FintechApp – FinControl

Aplicação fullstack de controle financeiro: **frontend** (Next.js) e **backend** (NestJS) com PostgreSQL, orquestrados via Docker.

## Estrutura

```
FintechApp/
├── backend/          # API NestJS (Prisma, REST)
├── frontend/         # App Next.js
└── docker-compose.yml
```

## Rodar tudo com Docker (recomendado)

Na raiz do projeto:

```bash
docker compose up -d
```

- **Frontend:** http://localhost:3000  
- **Backend (API):** http://localhost:3001  
- **PostgreSQL:** localhost:5433 (usuário `fincontrol`, senha `fincontrol_secret`, DB `fincontrol`)

Para ver logs:

```bash
docker compose logs -f
```

Para parar:

```bash
docker compose down
```

## Backend (NestJS)

- **Porta:** 3001  
- **Banco:** PostgreSQL (Prisma). Migrações rodam no startup do container.  
- **Endpoints principais:**
  - `GET/POST /users`
  - `GET/POST /accounts`
  - `GET/POST /categories`
  - `GET/POST /transactions`
  - `GET/POST /budgets`
  - `GET /notifications`, `PATCH /notifications/:id/read`
  - `GET /attachments/transaction/:transactionId`

### Rodar backend localmente

```bash
cd backend
cp .env.example .env
# Ajuste DATABASE_URL se precisar (ex: localhost:5433)
npm install
npx prisma generate
npx prisma migrate deploy
npm run start:dev
```

## Frontend (Next.js)

- **Porta:** 3000  
- **Variável:** `NEXT_PUBLIC_API_URL=http://localhost:3001` (para chamar o backend).  
- No Docker, o compose já define essa variável.

### Rodar frontend localmente

```bash
cd frontend
cp .env.example .env
# Garanta NEXT_PUBLIC_API_URL=http://localhost:3001
npm install --legacy-peer-deps
npm run dev
```

O frontend usa o cliente em `src/lib/api.ts` (`apiGet`, `apiPost`, etc.) para consumir o backend quando `NEXT_PUBLIC_API_URL` estiver definido.

## Resumo dos serviços

| Serviço   | Porta | Descrição        |
|-----------|-------|------------------|
| frontend | 3000  | App Next.js      |
| backend  | 3001  | API NestJS       |
| postgres | 5433  | Banco PostgreSQL |
