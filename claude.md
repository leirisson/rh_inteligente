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
| LLM | OpenRouter (Claude) | — | `llmClient` (SDK `openai`, `baseURL` do OpenRouter) instanciado em `src/lib/llm.ts`; usado por `src/lib/answer-evaluator.ts` para avaliar respostas de triagem |
| Embeddings | OpenAI (`text-embedding-3-small`) | dim 1536 | `src/lib/embeddings.ts` — chamada HTTP direta via `fetch`, fora do OpenRouter (que não expõe endpoint de embeddings) |
| Orquestração de agente | `@langchain/langgraph` + `@langchain/core` | — | `src/agent/graph.ts` — `StateGraph` linear disparado por `job.service.ts` quando uma vaga vira `ACTIVE` |
| WhatsApp | Evolution API | — | `src/lib/contact-channel.ts` (`evolutionWhatsAppChannel`) — HTTP via `fetch`, sem SDK; sem credenciais reais ainda (env vars opcionais) |
| E-mail | Nodemailer + SMTP | ^9.x | `src/lib/notification.ts` — `sendEmail()`; usado para fallback do canal de contato e para notificação de recrutadores |
| Auth | JWT (access + refresh) | — | `src/lib/rbac.ts` — `CompanyJWTPayload`/`CandidateJWTPayload` discriminados por `type`, ver [[5.10]] |
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

# Embeddings — OpenAI
OPENAI_API_KEY=sk-...

# CORS
CORS_ORIGIN=http://localhost:3001
```

> **Regra crítica:** Apenas `src/config/index.ts` lê `process.env`. Todo o resto importa de `config`.

### 3.2 Estrutura de Diretórios

```text
Convoca/api/
├── .husky/pre-commit            ← npx lint-staged (cd Convoca/api &&)
├── prisma/
│   ├── schema.prisma            ← schema completo + campos Unsupported("vector(1536)")
│   └── migrations/              ← inclui add_vector_embeddings (índices HNSW)
├── src/
│   ├── config/index.ts          ← único leitor de process.env (Zod + fail-fast)
│   ├── lib/
│   │   ├── prisma.ts            ← singleton PrismaClient
│   │   ├── llm.ts               ← config OpenRouter + llmClient (SDK openai)
│   │   ├── embeddings.ts        ← generateEmbedding() via OpenAI
│   │   ├── vector.ts            ← set*Embedding() via $executeRaw
│   │   ├── answer-evaluator.ts  ← evaluateAnswer() via llmClient
│   │   ├── contact-channel.ts   ← ContactChannel + mockContactChannel + evolutionWhatsAppChannel/emailChannel/combinedContactChannel
│   │   ├── notification.ts      ← sendEmail() via Nodemailer + notifyRecruitersOnApproval()
│   │   └── application-transition.ts ← ALLOWED_TRANSITIONS + transitionApplication() (validado, transacional)
│   ├── agent/
│   │   ├── state.ts             ← AgentState (Annotation.Root do LangGraph)
│   │   ├── nodes.ts             ← findCandidates/createApplications/sendInitialContact
│   │   └── graph.ts             ← StateGraph + runScreeningAgent()
│   ├── prompts/
│   │   ├── answer-evaluation.json  ← role/task/template/output_schema, variantes por chave
│   │   └── loader.ts               ← renderPrompt() — interpola template + monta response_format
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
│   │   ├── job/                   ← CRUD de vagas (tenant-scoped), dispara o agente em ACTIVE
│   │   ├── job-requirement/       ← requisitos aninhados em /jobs/:jobId/requirements
│   │   ├── screening-question/    ← perguntas aninhadas em /jobs/:jobId/screening-questions
│   │   ├── matching/               ← GET /jobs/:jobId/matches
│   │   ├── application/            ← POST /applications/:id/messages (webhook simulado), funnel.service.ts + funnel.routes.ts (GET /jobs/:jobId/funnel)
│   │   ├── candidate/             ← signup/login próprio, /candidates/me/*, sem tenant_id
│   │   ├── webhook/                ← whatsapp.routes.ts: POST /webhooks/whatsapp/:tenantId (Evolution API inbound)
│   │   └── interview/              ← POST/PATCH /applications/:id/interviews[/reschedule|/cancel]
│   ├── app.ts                   ← buildApp() sem listen()
│   └── server.ts                ← entry point, void main()
├── .env / .env.example / .env.test
├── .eslintrc.json / .prettierrc.json / .prettierignore
├── .gitignore / .dockerignore / .gitattributes
├── docker-compose.yml           ← pgvector/pgvector:pg16 (5432) + Evolution API (8080), dev local
├── Dockerfile                   ← multi-stage build/runtime, Node 20-slim + openssl
├── docker-entrypoint.sh         ← prisma migrate deploy && exec "$@"
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
| 10 | Raw SQL para colunas `Unsupported` do Prisma | Ler/escrever tipos que o Prisma não modela nativamente (ex: `vector`) | `src/lib/vector.ts` (`$executeRaw`), `src/modules/matching/matching.service.ts` (`$queryRaw`) — ver [[5.11]] |
| 11 | Interface de canal externo com implementação mock | Integrações que ainda não existem (WhatsApp/e-mail) mas cujo consumidor (o agente) precisa ser testável agora | `ContactChannel` em `src/lib/contact-channel.ts`; `mockContactChannel` registra em `Conversation` sem enviar de verdade — troca de implementação não muda o grafo — ver [[5.13]] |
| 12 | Grafo LangGraph síncrono disparado por transição de estado | Orquestrar múltiplos passos de domínio (matching → criação de registros → contato) a partir de um evento de negócio | `src/agent/graph.ts` (`runScreeningAgent`), disparado em `job.service.ts` `updateJobStatus` quando o status vira `ACTIVE` — ver [[5.13]] |
| 13 | Prompts como JSON estruturado + Structured Outputs | Qualquer chamada de LLM que precise de prompt versionável e saída JSON garantida | `src/prompts/*.json` (role/task/template/output_schema) + `src/prompts/loader.ts` (`renderPrompt`) — usado por `answer-evaluator.ts` via `response_format: json_schema` — ver [[5.15]] |
| 14 | Serviço de transição de estado validado e transacional | Qualquer mudança de `ApplicationStatus` (fluxo de fases) | `src/lib/application-transition.ts` (`transitionApplication`, `ALLOWED_TRANSITIONS`) — usado por `application.service.ts`, `agent/nodes.ts` e `interview.service.ts`; nunca escrever `Application.status` direto via `prisma.application.update` |
| 15 | Canal combinado com fallback (WhatsApp → e-mail) | Envio de mensagem ao candidato quando existe mais de um canal possível | `combinedContactChannel` em `src/lib/contact-channel.ts` — tenta `evolutionWhatsAppChannel`, cai para `emailChannel` em qualquer falha; grava em `Conversation` o canal realmente usado, não o solicitado — ver [[5.17]] |
| 16 | Env vars opcionais para integrações ainda não configuradas | Serviço externo real cujas credenciais ainda não existem, mas cujo código já deve ser escrito | `EVOLUTION_API_*`, `SMTP_*` em `src/config/index.ts` — `.optional()` em vez de `.min(1)`; funções que os usam falham com erro tipado (503) em vez de derrubar a aplicação no boot |

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

### 5.11 Colunas `vector(1536)` e primeira migration real de pgvector

- **Problema:** `Candidate.embedding` e `JobRequirement.embedding` existiam só como comentários-placeholder no schema desde a Spec 04 (`// embedding vector(1536) added via manual SQL migration`) — a migration nunca tinha sido criada de fato, e Prisma não suporta o tipo `vector` nativamente em `data:` de `create`/`update`.
- **Solução:** Migration manual `add_vector_embeddings` (`ALTER TABLE ... ADD COLUMN embedding vector(1536)` + índice `USING hnsw (embedding vector_cosine_ops)` para busca por similaridade). No `schema.prisma`, campo declarado como `embedding Unsupported("vector(1536)")?`. Como Prisma não permite escrever nesse tipo via API normal, criado `src/lib/vector.ts` com `setCandidateEmbedding`/`setJobRequirementEmbedding` usando `prisma.$executeRaw` com cast `::vector` — primeiro uso de `$executeRaw`/`$queryRaw` no projeto. Leitura/ranking também via `$queryRaw` em `matching.service.ts`, usando o operador `<=>` do pgvector (distância de cosseno; similaridade = `1 - distância`).

### 5.12 Testes de integração não podem depender da API real da OpenAI

- **Problema:** `createJobRequirement` e `signupCandidate`/`updateCandidate` agora chamam `generateEmbedding` (API real da OpenAI) de forma síncrona sempre que há `text`/`resumeText`. Isso quebraria testes de integração existentes (`job.routes.integration.test.ts`, que cria requirements) e geraria custo real de API em CI.
- **Solução:** `vi.mock("../../lib/embeddings.js", ...)` no topo de todo arquivo de teste de integração que passa por esses caminhos, retornando vetores determinísticos (zeros para os testes que não avaliam ranking; vetores geometricamente próximos/distantes em `matching.routes.integration.test.ts` para validar ordenação por similaridade sem rede).

### 5.13 Agente de triagem sem canal de envio real (Spec 09 ainda não existe)

- **Problema:** A Spec 08 pede um agente que "envia mensagem de contato inicial" e "aguarda resposta do candidato" via WhatsApp/e-mail, mas a integração real (Spec 09) só chega na Sprint 5. Bloquear a Spec 08 até lá adiaria indefinidamente o núcleo do produto (matching → contato → triagem → decisão).
- **Solução:** Interface `ContactChannel` (`src/lib/contact-channel.ts`) com um único método `send(applicationId, channel, content)`. A implementação `mockContactChannel` apenas registra a mensagem em `Conversation` (`sender: "AGENT"`) sem enviar de verdade — do ponto de vista do grafo e dos outros módulos, "enviar" e "persistir a conversa" são a mesma operação. "Aguardar resposta" também foi resolvido sem infra de webhook real: `POST /applications/:id/messages` (`src/modules/application/`) injeta uma mensagem do candidato e avança o fluxo de triagem de forma síncrona — é o stand-in exato do que o webhook do WhatsApp vai fazer na Spec 09. Quando a Spec 09 chegar, troca-se `mockContactChannel` por uma implementação real e o webhook substitui essa rota administrativa; nada no grafo (`src/agent/`) muda.

### 5.14 Agente precisa criar `Application` — não existe fluxo de candidatura

- **Problema:** Nenhum código no projeto cria registros `Application` (confirmado: zero ocorrências de `prisma.application.create` antes da Spec 08). O matching (Spec 07) é puramente computacional — `getJobMatches` não persiste nada. Sem um `Application`, não há onde pendurar `Conversation`/`ScreeningAnswer`/`ApplicationStage`.
- **Solução:** O nó `createApplications` do grafo (`src/agent/nodes.ts`) cria um `Application` (`status: PENDING_CONTACT`) para cada candidato retornado pelo matching acima do threshold que ainda não tem `Application` para essa vaga, respeitando o `@@unique([candidateId, jobId])` já existente no schema. Corrida de duplicidade (ex: reativação da vaga) é tratada via `catch` do código `P2002`, mesmo padrão usado em `candidate.service.ts`/`vector.ts`. Isso é uma decisão de produto implícita: nesta fase, "aplicar para a vaga" acontece automaticamente quando o candidato é compatível o suficiente, não por ação do candidato — revisável quando houver um fluxo explícito de candidatura.

### 5.15 Prompts como JSON estruturado + Structured Outputs, e `__dirname` em build CJS bundlado

- **Problema:** O prompt de `evaluateAnswer` começou como template string embutido em `answer-evaluator.ts`, com o pedido "responda em JSON" feito por texto e parse manual (`JSON.parse` + validação de shape em runtime) como única garantia de formato — frágil e difícil de versionar/testar isoladamente. Além disso, carregar um arquivo `.json` de dentro de `src/prompts/` em runtime exige resolver o diretório do módulo — `import.meta.url` não existe de forma confiável no build final, que é CJS (`tsup --format cjs`).
- **Solução:** Prompts viraram arquivos `.json` em `src/prompts/` (`{ role, task, template, input_variables, output_schema }`, com variantes por chave — ex: `with_expected_answer` vs `open_ended`). `src/prompts/loader.ts` expõe `renderPrompt(promptName, variantName, variables)`, que interpola `{{var}}` no template e devolve também um `responseFormat` pronto para `response_format: { type: "json_schema", json_schema: {...} }` da API — a validação de shape em `answer-evaluator.ts` continua como rede de segurança, mas a API agora é instruída a garantir o formato. Para carregar o `.json`, usar `__dirname` (nativo em CJS, funciona tanto em dev via `tsx` quanto no bundle final) em vez de `import.meta.url`. Como o `tsup` empacota tudo em um único `dist/server.js`, `__dirname` resolve para `dist/` em produção — por isso o script `copy:prompts` (`package.json`) copia `src/prompts/*.json` para `dist/prompts/` após o build, mantendo o mesmo caminho relativo (`prompts/<nome>.json`) que `loader.ts` espera a partir de `__dirname`.

### 5.16 Testes de integração rodavam contra `convoca_dev`, não `convoca_test` (bug pré-existente, corrigido na Sprint 5)

- **Problema:** `vitest.config.ts` declarava `envFiles: [".env.test"]`, mas essa opção do Vitest 4 não popula `process.env` (afeta só `import.meta.env`, mecanismo do Vite). `src/config/index.ts` chamava `dotenvConfig()` sem `path`, que carrega `.env` (desenvolvimento) incondicionalmente. Resultado: **todo teste de integração, desde o commit inicial do projeto, rodava contra o banco `convoca_dev`** — e como os testes fazem `deleteMany()` de todas as tabelas em `beforeEach`/`afterAll`, cada execução de teste apagava silenciosamente os dados de desenvolvimento. Descoberto na Sprint 5 ao adicionar `SMTP_*`/`EVOLUTION_WEBHOOK_SECRET` só em `.env.test` — esses valores nunca chegavam ao processo, causando falhas 503/401 inesperadas que expuseram o bug.
- **Solução:** `src/config/index.ts` agora escolhe o arquivo de env explicitamente por `NODE_ENV` (`const envFile = process.env.NODE_ENV === "test" ? ".env.test" : ".env"; dotenvConfig({ path: envFile })`). Vitest seta `NODE_ENV=test` automaticamente antes de qualquer módulo rodar, então isso é suficiente — não depender de `envFiles` do Vitest para variáveis lidas via `process.env`. Qualquer novo `.env.<ambiente>` deve seguir esse mesmo padrão de seleção por `NODE_ENV`, não adicionar mais entradas em `envFiles`.

### 5.17 `ContactChannel` real falha alto quando o candidato não tem o meio de contato necessário

- **Problema:** Diferente do `mockContactChannel` (Spec 08), que sempre "funcionava" por só gravar em `Conversation`, o `combinedContactChannel` real (Spec 09) propaga erro (`NO_WHATSAPP_CONTACT`/`NO_EMAIL_CONTACT`, ambos 422) quando o candidato não tem nenhum `ContactMethod` do canal necessário — e como `Candidate.contactMethods` é totalmente opcional no cadastro, isso quebra fluxos inteiros (ativação de vaga, resposta de triagem, agendamento de entrevista) caso um único candidato do lote esteja sem contato cadastrado.
- **Solução:** Decisão deliberada (confirmada com o usuário): propagar o erro em vez de degradar graciosamente. Um candidato sem nenhum meio de contato é um dado de cadastro incompleto que deve ser corrigido, não silenciado — falhar alto e cedo evita que o recrutador só descubra o problema quando notar que ninguém respondeu. Efeito colateral a ter em mente: como `job.service.ts#updateJobStatus` chama `runScreeningAgent` de forma síncrona, um único candidato sem contato pode fazer a requisição `PATCH /jobs/:id/status` inteira falhar com 422, mesmo que outros candidatos do matching estivessem OK — revisável se isso se mostrar problemático em produção (ex: mover para processamento assíncrono por candidato).

### 5.18 CI (GitHub Actions) sem job de lint bloqueante

- **Problema:** Ao criar `.github/workflows/ci.yml`, `npm run lint` e `npm run format:check` já falhavam localmente no estado atual do repo (30 erros de ESLint pré-existentes em `auth.service.unit.test.ts` — `@typescript-eslint/unbound-method` — e em `tenant-scope.ts` — `require-await` —, mais um erro de parsing em `vitest.config.ts` por não estar incluído no `tsconfig.json`; e 15 arquivos fora do padrão do Prettier). Incluir esses steps como bloqueantes faria o primeiro CI falhar por dívida técnica não relacionada à Sprint 6.
- **Solução:** Decisão confirmada com o usuário — job de lint/format omitido do workflow por enquanto (comentário `TODO` em `ci.yml` lista os erros pendentes). O workflow (`.github/workflows/ci.yml`, na raiz do monorepo, com `defaults.run.working-directory: Convoca/api` e `paths` filtrando por esse diretório) roda um único job `test`: sobe `pgvector/pgvector:pg16` como service container (usuário/senha/db iguais ao `docker-compose.yml` local, mas banco `convoca_test` em vez de `convoca_dev`), `npm ci` → `prisma generate` → `prisma migrate deploy` (com `DATABASE_URL` apontando pro service container) → `npm run build` → `npm run test:coverage`. `NODE_ENV=test` faz `src/config/index.ts` carregar `.env.test` (já commitado, com chaves fake de LLM — ver 5.16), então nenhum secret do GitHub é necessário ainda. Validado rodando a sequência completa localmente antes de commitar (19 arquivos de teste, 104 testes, todos passando). Reativar o job de lint quando os erros acima forem corrigidos.

### 5.19 Dockerfile: `npm ci` falha em produção por causa do script `prepare` (husky)

- **Problema:** `package.json` declara `"prepare": "husky"`, que roda automaticamente em todo `npm install`/`npm ci` (inclusive `--omit=dev`). No estágio `runtime` da imagem (sem devDependencies, sem `.git`), o binário `husky` não existe e o comando falha com `sh: 1: husky: not found`, exit code 127 — quebra o `docker build` inteiro. No estágio `build`, o mesmo comando "funciona" silenciosamente porque `.git` existe no contexto, mas `husky` decide não fazer nada fora de um repo git — não deveria ser exigido em uma imagem de produção de qualquer forma.
- **Solução:** `npm ci --ignore-scripts` em ambos os estágios do `Dockerfile` (`build` e `runtime`). Hooks de git não têm nenhuma utilidade dentro de uma imagem Docker.

### 5.20 Prisma CLI precisa estar disponível em runtime, mas é `devDependency`

- **Problema:** O entrypoint do container precisa rodar `prisma migrate deploy` antes de subir o servidor (requisito da Spec 13), mas o pacote `prisma` (CLI) está em `devDependencies` — `npm ci --omit=dev` no estágio `runtime` não o instala, e `npx prisma` tentaria baixar da rede em runtime (indesejável e pode falhar sem acesso à internet do registry npm).
- **Solução:** Copiar `node_modules/prisma`, `node_modules/.bin/prisma`, `node_modules/@prisma` e `node_modules/.prisma` do estágio `build` para o `runtime` via `COPY --from=build`, e chamar o binário local (`./node_modules/.bin/prisma migrate deploy`) em `docker-entrypoint.sh` em vez de `npx prisma`. Não promover `prisma` para `dependencies` — o objetivo é manter a separação dev/prod do `package.json`, só que suprida via layer do multi-stage build.

### 5.21 `node:20-slim` sem OpenSSL quebra o Prisma engine

- **Problema:** `prisma generate`/`migrate deploy` na imagem `node:20-slim` emite `Prisma failed to detect the libssl/openssl version to use, and may not work as expected` — a imagem `slim` do Debian não vem com OpenSSL instalado, e o Prisma Client usa um binary engine linkado contra ele.
- **Solução:** `RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*` em ambos os estágios do `Dockerfile` (build precisa para `prisma generate`; runtime precisa para o Query Engine em runtime). Validado rodando `docker build` + `docker run` de ponta a ponta contra um Postgres+pgvector standalone (fora do `docker-compose.yml` de dev): migrations aplicadas automaticamente, servidor sobe, `POST /tenants` retorna 201 com JWT válido.

### 5.22 Rodando localmente: Postgres do `docker-compose.yml` + `npm run dev`

- **Contexto:** Fluxo padrão de subida local, sem Docker para a API (só o Postgres roda em container). `docker compose up -d` sobe `convoca_postgres` (porta 5432) e `convoca_evolution` (porta 8080, opcional); `npm run dev` (`tsx watch src/server.ts`) lê `.env` e sobe a API na porta 3334. Migrations aplicadas via `npm run migrate` (dev) ou já em dia se `.env` aponta para um banco que já rodou migrations antes — checar com `npx prisma migrate status`.
- **Nota:** Parar o servidor de dev iniciado em background nem sempre funciona com `pkill`/`pgrep` (ausentes neste ambiente Windows/Git Bash) — usar `Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*server.ts*" }` + `Stop-Process` via PowerShell para encontrar e encerrar a árvore de processos (`cmd.exe` wrapper do npm script + `node.exe` do tsx watch + `node.exe` do processo filho real).

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
| 07 | Matching engine (pgvector + embeddings) | ✅ Implementada |
| 08 | Agente de triagem (LangGraph) | ✅ Implementada (canal de contato mockado — ver [[5.13]]) |
| 09 | Integração WhatsApp (Evolution API) | ✅ Implementada (sem credenciais reais ainda — env vars opcionais, ver padrão 16 na seção 4) |
| 10 | Fluxo de fases e classificação | ✅ Implementada (notificação de líder de setor simplificada para todos os recrutadores/admins — ver spec_6.md) |
| 11 | Agendamento de entrevista | ✅ Implementada |
| 12 | Testes automatizados | ✅ Implementada (109 testes/19 arquivos; teste adversarial de tenant em job/matching/application/interview; e2e do grafo em `graph.integration.test.ts`; gate de cobertura 80%/70% em `vitest.config.ts`) |
| 13 | Observabilidade e deploy | 🚧 Em andamento — CI e Dockerfile de produção implementados (ver 5.18–5.21); faltam `deploy.yml`, dashboard/alertas e rollback (dependem de VPS provisionada) |

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
| 2026-07 | Embeddings gerados via OpenAI direto, não via OpenRouter | OpenRouter só expõe chat completions, não endpoint de embeddings; `OPENAI_API_KEY` separada de `OPENROUTER_*`, que fica reservada ao LLM de chat do agente (Spec 08) |
| 2026-07 | Geração de embedding síncrona no request (sem fila) | Projeto ainda não tem infraestrutura de fila (BullMQ/etc); chamada de embedding é rápida (~200-500ms) e não justifica essa complexidade nesta fase — revisável se o volume de cadastros crescer |
| 2026-07 | Score de matching = média da similaridade por `JobRequirement` | Vaga pode ter múltiplos requirements, cada um com embedding próprio; média é mais simples de explicar ao recrutador ("compatível com X% dos requisitos em média") que um embedding único agregado por vaga |
| 2026-07 | Spec 08 implementada com `ContactChannel` mockado, não mais adiada | Interface `ContactChannel` desacopla o grafo do canal de envio real; `mockContactChannel` registra em `Conversation` sem enviar de verdade, e `POST /applications/:id/messages` faz o papel do webhook de resposta — troca de implementação na Spec 09 não muda o grafo (ver 5.13) |
| 2026-07 | `@langchain/langgraph` real (`StateGraph`), mesmo com fluxo hoje linear | Alinhado ao nome da Spec 08 e pronto para ciclos/condicionais quando Spec 09/10 adicionarem complexidade (ex: loop de perguntas até completar o questionário) |
| 2026-07 | Agente cria `Application` automaticamente a partir do matching | Não existe fluxo de "candidatura" no produto ainda; sem isso o agente não teria onde registrar conversa/respostas/histórico — revisável quando houver candidatura explícita (ver 5.14) |
| 2026-07 | Trigger do agente movido de "DRAFT→ACTIVE" para "qualquer transição→ACTIVE" | Reativar uma vaga pausada (`PAUSED→ACTIVE`) deve rodar o agente de novo para pegar novos candidatos compatíveis; o guard de "precisa ter screening questions" continua restrito à primeira ativação (`DRAFT→ACTIVE`) |
| 2026-07 | Prompts extraídos para `src/prompts/*.json` + `response_format: json_schema` | Template string embutido no service era difícil de versionar/testar; JSON estruturado (role/task/template/output_schema) com Structured Outputs da API reduz a dependência do parse manual como única garantia de formato (ver 5.15) |
| 2026-07 | Mapa de transição de `ApplicationStatus` centralizado em `application-transition.ts` | Duas escritas diretas de status sem validação (`application.service.ts`, `agent/nodes.ts`) permitiam transições ilegais; centralizar em `transitionApplication` com mapa explícito + transação garante que status e `ApplicationStage` nunca fiquem dessincronizados |
| 2026-07 | `INTERVIEW_SCHEDULED → APPROVED` como transição válida (não terminal) | Representa cancelamento de entrevista agendada — candidato permanece aprovado e pode ser reagendado, em vez de precisar reiniciar a triagem |
| 2026-07 | `InterviewSchedule` migrado de 1:1 (`@unique`) para 1:muitos com `InterviewStatus` | Reagendamento precisa preservar histórico (spec pede "novo `InterviewSchedule`" a cada reagendamento); 1:1 com overwrite perderia esse histórico |
| 2026-07 | Notificação de aprovação vai para todos `TENANT_ADMIN`+`RECRUITER` do tenant, não para "líder de setor" específico | Não existe relação `Job`↔`User` responsável pela área no schema atual; forçar essa modelagem agora seria decisão de produto não especificada — simplificação confirmada com o usuário, documentada como fora de escopo em spec_6.md |
| 2026-07 | `ContactChannel` real propaga erro (não degrada) quando candidato não tem o meio de contato necessário | Decisão confirmada com o usuário: falhar alto evita que cadastros incompletos passem despercebidos; aceita o efeito colateral de um único candidato sem contato poder derrubar a ativação síncrona de uma vaga inteira (ver 5.17) |
| 2026-07 | `EVOLUTION_API_*`/`SMTP_*` como env vars opcionais, com erro tipado em runtime em vez de fail-fast no boot | Diferente de `OPENROUTER_API_KEY`/`OPENAI_API_KEY` (sempre necessárias), essas integrações não têm credenciais reais disponíveis ainda — bloquear `npm run dev`/testes seria pior que degradar graciosamente até a Sprint de integração real |
| 2026-07 | `src/config/index.ts` carrega `.env.test` quando `NODE_ENV=test`, em vez de depender de `envFiles` do Vitest | `envFiles` do Vitest 4 não popula `process.env`; bug pré-existente fazia todo teste de integração rodar (e apagar dados) no banco `convoca_dev` em vez de `convoca_test` — corrigido na Sprint 5 (ver 5.16) |
| 2026-07 | CI (`.github/workflows/ci.yml`) sem job de lint/format bloqueante | `npm run lint`/`format:check` já falhavam no repo antes do CI existir (dívida técnica pré-existente); bloquear o primeiro CI por isso adiaria a Sprint 6 sem relação com o que estava sendo entregue — reativar quando os erros forem corrigidos (ver 5.18) |
| 2026-07 | Gate de cobertura mínima em `vitest.config.ts` (`coverage.thresholds`): 80% statements/lines, 70% branches/functions | Calibrado no valor observado ao rodar `test:coverage` na Sprint 6 (86%/88.33%/72.72%/85.62%), com margem pequena para não travar PRs por flutuação; falha o comando (e portanto o CI) se a cobertura cair abaixo disso |
| 2026-07 | E2e do grafo LangGraph vive em `src/agent/graph.integration.test.ts`, não em diretório `test/e2e/` separado | Mesma convenção `*.integration.test.ts` ao lado do código testado já usada no resto do projeto; o teste simula o fluxo completo (ativação de vaga → matching → contato inicial → resposta do candidato via `POST /applications/:id/messages` → decisão final) com `evaluateAnswer`/`generateEmbedding` mockados |
| 2026-07 | Dockerfile multi-stage com `node:20-slim` + `npm ci --ignore-scripts` em ambos os estágios | `--ignore-scripts` evita que o script `prepare` (husky) quebre o build em produção (ver 5.19); `node:20-slim` exige instalar `openssl` manualmente para o Prisma engine funcionar (ver 5.21) |
| 2026-07 | Prisma CLI copiado do estágio `build` para o `runtime` via `COPY --from=build`, em vez de promovido para `dependencies` | Mantém a separação dev/prod do `package.json` intacta; o entrypoint chama o binário local (`./node_modules/.bin/prisma migrate deploy`) em vez de `npx prisma`, evitando qualquer tentativa de rede em runtime (ver 5.20) |

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
| Funil | Contagem de `Application`s por status atual, agrupada por vaga (`GET /jobs/:jobId/funnel`) — usado pelo recrutador para visualizar o progresso do processo seletivo |
| InterviewSchedule | Registro de agendamento de entrevista; 1:muitos com `Application` (histórico de reagendamentos), com `status`: SCHEDULED → RESCHEDULED/CANCELLED |
