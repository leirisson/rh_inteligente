# Sprint 1 — Infraestrutura e Configuração Base

**Specs cobertas:** 01 (Infraestrutura) + 02 (Configuração Base)
**Status:** ✅ Concluída
**Pré-requisito:** nenhum

---

## Objetivo

Subir o esqueleto completo da API sem nenhuma regra de negócio: servidor rodando, banco de dados conectado com pgvector, pipeline de qualidade de código funcional. Ao final desta sprint `npm run dev` sobe, `GET /health` responde e o lint passa limpo.

---

## Entregas da Spec 01 — Infraestrutura

### Critérios de aceite

- [x] Repositório estruturado com `Convoca/api/` como raiz do projeto Node
- [x] `docker-compose.yml` com `pgvector/pgvector:pg16` rodando na porta 5432
- [x] Container Postgres com healthcheck (`pg_isready`) passando
- [x] Scaffolding Fastify + TypeScript funcionando (`npm run dev` sobe sem erro)
- [x] Extensão `vector` instalada no banco (`pgvector 0.8.3`)

### Arquivos criados

- `docker-compose.yml`
- `package.json` (dependências completas)
- `tsconfig.json` + `tsconfig.build.json`
- `.env` / `.env.example`
- `.gitignore`

---

## Entregas da Spec 02 — Configuração Base

### Critérios de aceite

- [x] Subir sem variável obrigatória derruba o processo com erro claro (lista os campos faltando)
- [x] `GET /health` retorna `{"status":"ok","timestamp":"...","uptime":...}` — 200 OK
- [x] Rota inexistente retorna `{"error":{"message":"Route GET /... not found","code":"NOT_FOUND"}}` — 404
- [x] `process.env` aparece exatamente 1 vez no código: `src/config/index.ts`
- [x] `new PrismaClient()` aparece exatamente 1 vez no código: `src/lib/prisma.ts`
- [x] Módulo `src/lib/llm.ts` existe e exporta config do OpenRouter sem fazer chamada HTTP
- [x] `npm run lint` passa sem erros
- [x] `npm run format` deixa baseline limpo
- [x] Migration `0_init` com `CREATE EXTENSION IF NOT EXISTS vector` aplicada ao banco

### Arquivos criados

```
src/
├── config/index.ts          ← Zod schema + fail-fast + único process.env
├── lib/
│   ├── prisma.ts            ← PrismaClient singleton via globalThis
│   └── llm.ts               ← LLMConfig para OpenRouter (sem chamadas)
├── plugins/
│   ├── cors.ts
│   └── error-handler.ts    ← { error: { message, code } } + setNotFoundHandler
├── routes/
│   └── health.ts
├── app.ts                   ← buildApp() sem listen()
└── server.ts                ← void main() + listen()
prisma/
├── schema.prisma            ← sem modelos (Spec 04)
└── migrations/0_init/migration.sql
.eslintrc.json
.prettierrc.json / .prettierignore
.husky/pre-commit
```

---

## Decisões tomadas nesta sprint

| Decisão | Motivo |
|---------|--------|
| Fastify v4 (não v5) | `fastify-type-provider-zod` não suporta v5 |
| Imagem `pgvector/pgvector:pg16` | pgvector já compilado — sem init script |
| `dotenv` carregado em `config/index.ts` | `tsx` não carrega `.env` automaticamente; centraliza o load junto à validação |
| Porta 3334 no `.env` | Porta 3000 ocupada pelo Remotion Studio na máquina de dev |
| `buildApp()` retorna sem `listen()` | Separação para testabilidade (`.inject()` nos testes) |

---

## Obstáculos resolvidos

- **Husky + repo pai:** `.git` está em `rh_inteligente/`, não em `Convoca/api/`. `husky init` falha. Solução: criar `.husky/pre-commit` manualmente com `cd Convoca/api && npx lint-staged`.
- **Prisma sem modelos:** `prisma generate` avisa que não há modelos — esperado. Usar `/* eslint-disable */` nas linhas com tipos `any` do `PrismaClient` até a Spec 04 gerar o schema.
