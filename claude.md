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
│   │   ├── jwt.ts                ← fp(), decora app.authenticate
│   │   ├── tenant-scope.ts       ← fp(), preHandler injeta request.tenantId
│   │   └── error-handler.ts      ← fp(), { error: { message, code } } em todas as respostas
│   ├── routes/
│   │   └── health.ts            ← GET /health
│   ├── modules/
│   │   ├── auth/                 ← login, refresh
│   │   ├── tenant/                ← onboarding (POST /tenants)
│   │   ├── job/                   ← CRUD de vagas (tenant-scoped)
│   │   ├── job-requirement/       ← requisitos aninhados em /jobs/:jobId/requirements
│   │   ├── screening-question/    ← perguntas aninhadas em /jobs/:jobId/screening-questions
│   │   └── candidate/             ← signup/login próprio, /candidates/me/*, sem tenant_id
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
| 7 | `fp()` em plugins transversais | Decorators/hooks/handlers que outras rotas precisam enxergar | `jwtPlugin`, `tenantScopePlugin`, `errorHandlerPlugin` — ver [[5.7]] |
| 8 | Módulo de domínio (service/routes/schema) | CRUD tenant-scoped | `src/modules/job/`, `src/modules/job-requirement/`, `src/modules/screening-question/`, `src/modules/tenant/` |
| 9 | JWTPayload discriminado por `type` | Distinguir usuário de empresa de candidato no mesmo token JWT | `CompanyJWTPayload` (`type: "company"`) vs `CandidateJWTPayload` (`type: "candidate"`) em `src/lib/rbac.ts` — ver [[5.10]] |

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

### 5.7 Decorators/hooks de plugin não visíveis em rotas irmãs (encapsulamento Fastify)

- **Problema:** `jwtPlugin` (decora `app.authenticate`), `tenantScopePlugin` (decora `request.tenantId`) e `errorHandlerPlugin` (`setErrorHandler`/`setNotFoundHandler`) eram registrados como `async function` simples via `app.register(...)`. O Fastify cria um novo contexto de encapsulamento por plugin registrado — decorators e handlers ficavam presos nesse contexto e não propagavam para os módulos de rota (`jobRoutes`, `tenantRoutes` etc.) registrados como irmãos em `app.ts`. Sintomas: `FST_ERR_HOOK_INVALID_HANDLER` ao usar `app.authenticate` em `onRequest`, e respostas de erro caindo no serializer default do Fastify (`{"statusCode","error","message"}`) em vez do envelope customizado (`{ error: { message, code } }`).
- **Solução:** Envolver esses três plugins com `fp()` de `fastify-plugin` (`export const jwtPlugin = fp(async function jwtPlugin(app) { ... })`), que desativa o encapsulamento e aplica decorators/hooks/handlers no nível raiz da aplicação. Regra: qualquer plugin que declara `app.decorate`, `app.decorateRequest`, `app.setErrorHandler`, `app.setNotFoundHandler` ou um hook que outras rotas precisam enxergar **deve** usar `fp()`.

### 5.8 Ordem de hooks `onRequest` entre plugins e rotas

- **Problema:** `tenantScopePlugin` lia `request.user.tenant_id` dentro de um hook `onRequest` global. Como esse plugin é registrado em `app.ts` antes dos módulos de rota, seu hook `onRequest` executa antes do hook `onRequest` de autenticação (`app.authenticate`) que cada módulo de rota registra localmente — `request.user` ainda não existia, então `request.tenantId` ficava sempre `null`.
- **Solução:** Trocar o hook de `tenantScopePlugin` de `onRequest` para `preHandler`. `preHandler` roda depois de todos os hooks `onRequest` (incluindo os registrados por rotas individuais), garantindo que `request.user` já esteja populado.

### 5.9 Testes de integração rodando em paralelo colidem no mesmo banco

- **Problema:** Por padrão o Vitest executa arquivos de teste em paralelo. Todos os testes de integração usam `deleteMany()` no mesmo banco `convoca_test` em `beforeEach`/`afterAll` — com múltiplos arquivos rodando ao mesmo tempo, um arquivo limpa dados que outro está usando, gerando `PrismaClientKnownRequestError` (violação de FK) e falhas intermitentes de asserção.
- **Solução:** `fileParallelism: false` em `vitest.config.ts`. Força execução serial dos arquivos de teste — mais lento, mas necessário enquanto os testes de integração compartilharem um único banco sem transações isoladas por teste.

### 5.10 Candidato precisa de JWT próprio sem `role` de empresa

- **Problema:** `JWTPayload` original tinha `role: UserRole` obrigatório (enum de usuário de empresa: `SUPER_ADMIN`/`TENANT_ADMIN`/`RECRUITER`/`DEPARTMENT_LEAD`). `Candidate` (Spec 06) não pertence a nenhum tenant e não tem papel de empresa — forçar um `role` fake ou `tenant_id` sempre `null` criava ambiguidade fácil de confundir com bug (ex: um usuário de empresa mal cadastrado sem tenant).
- **Solução:** `JWTPayload` virou union discriminada em `src/lib/rbac.ts`: `CompanyJWTPayload { type: "company"; user_id; tenant_id; role }` e `CandidateJWTPayload { type: "candidate"; candidate_id }`. `requireRoles(...)` rejeita qualquer token que não seja `type: "company"`; `requireCandidate` (novo guard) rejeita qualquer token que não seja `type: "candidate"`. `tenantScopePlugin` só popula `request.tenantId` quando `request.user.type === "company"`. O model `Candidate` no schema Prisma não tinha `passwordHash` — foi adicionado via migration `add_candidate_password_hash` (o candidato loga com email+senha, mesmo fluxo argon2 que usuários de empresa, via `hashPassword`/`verifyPassword`/`buildTokens` reaproveitados de `auth.service.ts`).

---

## 6. Status das Specs

| # | Spec | Status |
| --- | --- | --- |
| 01 | Infraestrutura (Docker, Postgres+pgvector, Fastify scaffold) | ✅ Implementada |
| 02 | Configuração base (Zod env, Pino, Prisma singleton, LLM config, ESLint/Prettier/Husky) | ✅ Implementada |
| 03 | Autenticação e multi-tenancy (JWT, RBAC, middleware tenant_id) | ✅ Implementada |
| 04 | Modelagem do banco de dados (schema Prisma completo + pgvector) | ✅ Implementada |
| 05 | Cadastro de empresas e vagas | ✅ Implementada |
| 06 | Cadastro de candidatos | ✅ Implementada |
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
| 2026-07 | Todo plugin transversal usa `fp()` de `fastify-plugin` | Sem isso, decorators/hooks/error handlers ficam presos ao encapsulamento do próprio plugin e não chegam às rotas — bug real encontrado na Sprint 3 (ver 5.7) |
| 2026-07 | `fileParallelism: false` no Vitest | Testes de integração compartilham um único Postgres sem isolamento por transação; rodar arquivos em paralelo causa violação de FK e falhas intermitentes (ver 5.9) |
| 2026-07 | `JWTPayload` como union discriminada (`type: "company"` \| `type: "candidate"`) | Candidato não tem `role` de empresa nem `tenant_id`; forçar esses campos como nullable/fake criaria ambiguidade com bugs reais de multi-tenancy (ver 5.10) |
| 2026-07 | `Candidate.passwordHash` adicionado via migration | Candidato precisa de login próprio (Spec 06); reaproveita o mesmo fluxo argon2 de usuários de empresa em vez de um mecanismo de auth separado |

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
