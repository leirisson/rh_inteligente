# CLAUDE.md — Convoca (rh_inteligente)

> Documento vivo. Atualizar sempre que uma spec for implementada, padrão mudar ou obstáculo relevante for resolvido.

---

## 1. Visão Geral

**Produto:** Convoca — plataforma de matching de vagas onde um agente de IA contacta candidatos proativamente via WhatsApp/e-mail, conduz triagem conversacional e encaminha aprovados ao recrutador.

**Repositório:** `rh_inteligente/` (raiz do git)
**Projeto principal:** `Convoca/api/` — API Fastify/TypeScript

---

## 2. Stack Tecnológico

| Camada | Tecnologia | Versão | Observações |
|--------|-----------|--------|-------------|
| Runtime | Node.js + TypeScript | Node 20, TS 5.x | |
| API | Fastify | ^5.x | v5 com fastify-type-provider-zod v7 e Zod v4 |
| Validação | Zod + fastify-type-provider-zod | ^4.x / ^7.x | Schema de rotas e env vars |
| ORM | Prisma | ^5.x | Singleton em `src/lib/prisma.ts` |
| Banco | PostgreSQL + pgvector | pg16 + pgvector 0.8.3 | Via Docker `pgvector/pgvector:pg16` |
| Logging | Pino | ^8.x | JSON em produção, pino-pretty em dev |
| LLM | OpenRouter (Claude) | — | Config em `src/lib/llm.ts`, sem chamadas até Spec 08 |
| Auth | JWT (access + refresh) | — | A implementar na Spec 03 |
| Dev runner | tsx watch | ^4.x | Sem compilação em desenvolvimento |
| Build | tsup | ^8.x | Saída CJS em `dist/` |
| Lint/Format | ESLint 8 + Prettier 3 | — | `@typescript-eslint/recommended-requiring-type-checking` |
| Git hooks | Husky + lint-staged | ^9.x / ^15.x | pre-commit: lint + format obrigatórios |

---

## 3. Configuração e Ambiente

### 3.1 Variáveis de Ambiente

```bash
# Application
NODE_ENV=development
PORT=3334                          # 3333/3334 — porta 3000 ocupada pelo Remotion Studio
HOST=0.0.0.0

# Database
DATABASE_URL="postgresql://convoca:convoca_dev@localhost:5432/convoca_dev"

# Auth (implementado na Spec 03)
JWT_SECRET=<min 32 chars>
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# LLM — OpenRouter
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_DEFAULT_MODEL=anthropic/claude-3.5-sonnet

# CORS
CORS_ORIGIN=http://localhost:3001
```

> **Regra crítica:** Apenas `src/config/index.ts` lê `process.env`. Todo o resto importa de `config`.

### 3.2 Estrutura de Diretórios

```
Convoca/api/
├── .husky/pre-commit            ← npx lint-staged (cd Convoca/api &&)
├── prisma/
│   ├── schema.prisma            ← sem modelos ainda (Spec 04)
│   └── migrations/0_init/migration.sql  ← CREATE EXTENSION vector
├── src/
│   ├── config/index.ts          ← único leitor de process.env (Zod + fail-fast)
│   ├── lib/
│   │   ├── prisma.ts            ← singleton PrismaClient
│   │   └── llm.ts               ← config OpenRouter (zero chamadas HTTP)
│   ├── plugins/
│   │   ├── cors.ts
│   │   └── error-handler.ts    ← { error: { message, code } } em todas as respostas
│   ├── routes/
│   │   └── health.ts            ← GET /health
│   ├── app.ts                   ← buildApp() sem listen()
│   └── server.ts                ← entry point, void main()
├── .env / .env.example
├── .eslintrc.json / .prettierrc.json / .prettierignore
├── .gitignore
├── docker-compose.yml           ← pgvector/pgvector:pg16, porta 5432
├── package.json
├── tsconfig.json / tsconfig.build.json
└── specs/                       ← documentação (não tocar)
```

### 3.3 Comandos Úteis

```bash
# Desenvolvimento
npm run dev                      # tsx watch src/server.ts

# Banco
docker compose up -d             # sobe Postgres com pgvector
npm run migrate                  # prisma migrate dev
npm run studio                   # prisma studio

# Qualidade
npm run lint                     # eslint
npm run lint:fix                 # eslint --fix
npm run format                   # prettier --write .
npm run format:check             # prettier --check .

# Build
npm run build                    # tsup → dist/
npm start                        # node dist/server.js
```

---

## 4. Padrões de Projeto

> Antes de implementar qualquer funcionalidade, verificar se existe padrão documentado aqui.

| # | Padrão | Onde usar | Exemplo |
|---|--------|-----------|---------|
| 1 | Config centralizado | Env vars | `src/config/index.ts` — único `process.env` |
| 2 | Singleton | Conexões de longa vida | `src/lib/prisma.ts` via `globalThis` |
| 3 | Plugin Fastify | Funcionalidade transversal | `src/plugins/cors.ts`, `error-handler.ts` |
| 4 | Route module | Agrupamento de rotas | `src/routes/health.ts` — registra em `buildApp()` |
| 5 | buildApp() isolado | Testabilidade | `app.ts` retorna instância sem `listen()` |
| 6 | Error envelope | Respostas de erro | `{ error: { message, code } }` — nunca stack em produção |

---

## 5. Obstáculos Comuns

### 5.1 Husky + Repositório Pai

- **Problema:** O `.git` está na raiz `rh_inteligente/`, mas o `package.json` está em `Convoca/api/`. `npx husky init` falha com `.git can't be found`.
- **Solução:** Criar `.husky/pre-commit` manualmente com `cd Convoca/api && npx lint-staged`. O script `prepare` no `package.json` vai falhar silenciosamente em novos `npm install` — isso é esperado nesta estrutura de monorepo.

### 5.2 Porta Ocupada

- **Problema:** Porta 3000 ocupada pelo Remotion Studio (`projeto-01`).
- **Solução:** API Convoca roda na porta **3334** (definida no `.env`).

### 5.3 Prisma sem Modelos

- **Problema:** `prisma generate` retorna erro quando não há modelos no schema — esperado na Spec 02, pois os modelos são definidos na Spec 04.
- **Solução:** O `PrismaClient` ainda está disponível como instância base. Usar `/* eslint-disable */` nas linhas de `prisma.ts` que envolvem tipos `any` até os modelos existirem. Após a Spec 04, rodar `prisma generate` novamente.

### 5.4 Compatibilidade Fastify v5 com plugins

- **Problema:** `@fastify/cors@8` e `@fastify/cors@9` declaram peer `fastify: "^4.x"` e lançam `FST_ERR_PLUGIN_VERSION_MISMATCH` com Fastify v5, mesmo tendo sido instalados via `npm install @fastify/cors@9`.
- **Solução:** Para Fastify v5 usar obrigatoriamente: `@fastify/cors@10`, `@fastify/jwt@10`, `fastify-type-provider-zod@7`, `zod@4`. Verificar peer deps com `Get-Content node_modules/@fastify/<pkg>/package.json | Select-String '"fastify"'` antes de assumir compatibilidade pela semver major.

### 5.5 pgvector com Prisma

- **Problema:** Prisma não suporta o tipo `vector` nativamente.
- **Solução:** Adicionar colunas `vector` via migration SQL manual. No schema Prisma, referenciar como `Unsupported("vector(N)")`. Dimensão deve ser definida antes da primeira migration com embedding (ex: 1536 para `text-embedding-3-small`).

### 5.6 Tipagem de `request.user` com `@fastify/jwt` v10

- **Problema:** `@fastify/jwt@10` declara `FastifyRequest.user` como `string | object | Buffer`. Tentar sobreescrever via `declare module "fastify" { interface FastifyRequest { user: JWTPayload } }` causa `TS2717: Subsequent property declarations must have the same type`.
- **Solução:** Estender via `declare module "@fastify/jwt" { interface FastifyJWT { payload: JWTPayload; user: JWTPayload } }` no arquivo `src/plugins/jwt.ts`. Não declarar `user` em `module "fastify"` — apenas `authenticate` em `FastifyInstance`.

---

## 6. Status das Specs

| # | Spec | Status |
| --- | --- | --- |
| 01 | Infraestrutura (Docker, Postgres+pgvector, Fastify scaffold) | ✅ Implementada |
| 02 | Configuração base (Zod env, Pino, Prisma singleton, LLM config, ESLint/Prettier/Husky) | ✅ Implementada |
| 03 | Autenticação e multi-tenancy (JWT, RBAC, middleware tenant_id) | ✅ Implementada |
| 04 | Modelagem do banco de dados (schema Prisma completo + pgvector) | ✅ Implementada |
| 05 | Cadastro de empresas e vagas | ⏳ Aguarda Sprint 3 |
| 06 | Cadastro de candidatos | ⏳ Aguarda Sprint 3 |
| 07 | Matching engine (pgvector + embeddings) | ⏳ Aguarda 04+06 |
| 08 | Agente de triagem (LangGraph) | ⏳ Aguarda 07 |
| 09 | Integração WhatsApp (Evolution API) | ⏳ Aguarda 08 |
| 10 | Fluxo de fases e classificação | ⏳ Aguarda 08 |
| 11 | Agendamento de entrevista | ⏳ Aguarda 10 |
| 12 | Testes automatizados | ⏳ Aguarda 11 |
| 13 | Observabilidade e deploy | ⏳ Aguarda 12 |

---

## 7. Decisões Técnicas (ADR)

| Data | Decisão | Motivo |
| --- | --- | --- |
| 2026-07 | Migrado para Fastify v5 + Zod v4 | `fastify-type-provider-zod@7` suporta Fastify v5; versões corretas: `@fastify/cors@10`, `@fastify/jwt@10`, `fastify-type-provider-zod@7`, `zod@4` |
| 2026-06 | `pgvector/pgvector:pg16` como imagem Docker | Extensão pgvector já compilada — sem necessidade de init script |
| 2026-06 | `dotenv` carregado em `config/index.ts` | tsx não carrega `.env` automaticamente; centralizar o load junto à validação evita dependência de flag CLI |
| 2026-06 | Multi-tenancy por coluna `tenant_id` | Mais simples de operar em fase PoC que schema-per-tenant; revisável se escala exigir |
| 2026-06 | UUIDs como PKs | Evita vazamento de informação (contagem de registros) via IDs sequenciais em URLs públicas |

---

## 8. Glossário do Domínio

| Termo | Definição |
| --- | --- |
| Tenant | Uma empresa cadastrada na plataforma; unidade de isolamento de dados |
| Candidate | Pessoa que se cadastra uma única vez e pode se candidatar a vagas de múltiplos tenants |
| Application | Vínculo entre um Candidate e uma Job — representa a candidatura/abordagem |
| Screening | Triagem inicial conduzida pelo agente de IA via conversa (WhatsApp ou e-mail) |
| Job | Vaga de emprego publicada por um tenant; status: DRAFT → ACTIVE → PAUSED/CLOSED |
| Matching | Comparação semântica por embeddings (pgvector) entre perfil do candidato e requisitos da vaga |
