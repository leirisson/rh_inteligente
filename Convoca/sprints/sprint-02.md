# Sprint 2 — Autenticação, Multi-Tenancy e Modelagem do Banco

**Specs cobertas:** 03 (Autenticação e Multi-Tenancy) + 04 (Modelagem do Banco de Dados)
**Status:** ✅ Concluída
**Pré-requisito:** Sprint 1 concluída ✅

---

## Objetivo

Definir o isolamento entre empresas e os papéis de permissão, depois construir o schema Prisma completo com todas as entidades do domínio. Ao final desta sprint o banco tem todas as tabelas criadas, os JWTs são emitidos e validados, e uma query de negócio sem `tenant_id` é bloqueada em nível de middleware.

---

## Entregas da Spec 03 — Autenticação e Multi-Tenancy

### Requisitos funcionais

1. Toda empresa cadastrada é um **tenant** com `tenant_id` UUID único.
2. Usuários Admin/Recrutador/Líder pertencem a exatamente um tenant.
3. Tabelas de negócio carregam `tenant_id` como FK não-nula.
4. Nenhuma query de negócio executa sem filtro de `tenant_id` — garantido por middleware, não por disciplina manual.
5. JWT emite: `user_id`, `tenant_id` (nulo para candidato/super admin), `role`.
6. Cada rota declara explicitamente quais papéis podem acessá-la; fora da lista → 403.
7. Candidato se autentica separadamente (mesmo mecanismo JWT, sem `tenant_id`).
8. Senhas armazenadas com argon2 — nunca texto plano, nunca em log.
9. Criar empresa gera automaticamente o primeiro usuário Admin vinculado ao tenant.

### Decisões técnicas

| Item | Escolha |
|------|---------|
| Multi-tenancy | Banco compartilhado, schema compartilhado, isolamento por coluna `tenant_id` |
| Autenticação | JWT (access token curto + refresh token) |
| Hash de senha | argon2 |
| Autorização | RBAC via decorator/plugin Fastify checando `role` do token |
| Middleware de escopo | Plugin Fastify injeta `tenant_id` do token no contexto da request |

### Papéis (UserRole enum)

| Papel | Tenant-bound? | Pode fazer |
|-------|--------------|------------|
| `SUPER_ADMIN` | Não | Gerenciar empresas, suporte, auditoria |
| `TENANT_ADMIN` | Sim | Gerenciar vagas, usuários da empresa, ver candidatos |
| `RECRUITER` | Sim | Criar/editar vagas, perguntas, acompanhar candidatos, agendar entrevistas |
| `DEPARTMENT_LEAD` | Sim | Ver candidatos aprovados da sua área, etapa final (sem editar vaga) |
| Candidato | Não (entidade separada) | Cadastrar perfil, responder triagem |

### Critérios de aceite

- [x] Usuário da Empresa A nunca lê/modifica dado de outro `tenant_id`, mesmo manipulando IDs na URL
- [x] Candidato autenticado não acessa rotas de empresa; usuário de empresa não acessa rotas de candidato
- [x] Sem token → 401; token com papel errado → 403
- [x] Senha nunca aparece em log, resposta de API ou no banco em texto plano
- [x] Criar nova empresa gera automaticamente seu primeiro Admin com `tenant_id` correto
- [ ] Teste automatizado de isolamento de tenant (tentativa adversarial de manipulação de payload) — aguarda Spec 12

### Arquivos a criar

```
src/
├── modules/auth/
│   ├── auth.service.ts      ← login, emissão JWT, refresh
│   ├── auth.routes.ts       ← POST /auth/login, POST /auth/refresh
│   └── auth.schema.ts       ← Zod schemas de input/output
├── plugins/
│   ├── jwt.ts               ← registro do plugin JWT no Fastify
│   └── tenant-scope.ts      ← middleware injeta tenant_id na request
├── lib/
│   └── rbac.ts              ← decorator/helper de verificação de role
```

---

## Entregas da Spec 04 — Modelagem do Banco de Dados

### Entidades e tabelas

| Entidade | Tenant? | Observação |
|----------|---------|------------|
| `Tenant` | — | Raiz do isolamento |
| `User` | Sim | Admin/Recruiter/Lead com `role` |
| `Candidate` | Não | Global; pode ter Applications em múltiplos tenants |
| `ContactMethod` | Não | WhatsApp, e-mail — vinculado ao Candidate |
| `Job` | Sim | Status: `DRAFT → ACTIVE → PAUSED/CLOSED` |
| `JobRequirement` | Sim | Texto da especificação + embedding `vector(1536)` |
| `ScreeningQuestion` | Sim | Pergunta + resposta esperada (referência para IA) + ordem/peso |
| `Application` | Indireta* | Liga Candidate a Job; herda tenant via `Job.tenant_id` |
| `ScreeningAnswer` | — | Resposta do candidato + `score`/`verdict` da IA |
| `ApplicationStage` | — | Append-only: cada mudança de fase = novo registro |
| `Conversation` | — | Histórico de mensagens (agente ↔ candidato), canal, timestamp |
| `InterviewSchedule` | — | Agendamento de entrevista final |

> *Application: queries DEVEM passar por join/filtro de `Job.tenant_id`.

### Enums do domínio

```
JobStatus:         DRAFT | ACTIVE | PAUSED | CLOSED
ApplicationStatus: PENDING_CONTACT | IN_SCREENING | APPROVED | REJECTED
                   | INTERVIEW_SCHEDULED | HIRED | WITHDRAWN
MessageSender:     AGENT | CANDIDATE
Channel:           WHATSAPP | EMAIL
UserRole:          SUPER_ADMIN | TENANT_ADMIN | RECRUITER | DEPARTMENT_LEAD
```

### Decisões técnicas

| Item | Escolha |
|------|---------|
| PKs | UUID (`gen_random_uuid()`) em todas as tabelas |
| Embeddings | Coluna `vector(1536)` via pgvector — adicionada por migration SQL manual; Prisma referencia como `Unsupported("vector(1536)")` |
| Migrations | `prisma migrate dev` em dev; revisão manual antes de qualquer ambiente compartilhado |
| Soft delete | Não (PoC) — exclusão física; revisar se virar produto |

### Critérios de aceite

- [x] `prisma migrate dev` roda sem erro e cria todas as tabelas
- [x] Inserir `Candidate` não requer nem aceita `tenant_id`
- [x] Inserir `Job` sem `tenant_id` é rejeitado pelo banco (NOT NULL constraint)
- [x] Inserir e recuperar vetor de embedding em `JobRequirement` e `Candidate` via SQL direto
- [x] `Application` liga `Candidate` e `Job` de tenants diferentes sem conflito
- [x] Ao menos uma migration de seed com dados de exemplo para dev (`prisma/seed.ts`)

### Ponto crítico antes de rodar a migration

Definir a dimensão do vetor **antes** da primeira migration com embedding — mudar depois exige recriar a coluna e reprocessar todos os embeddings. Dimensão padrão: **1536** (compatível com `text-embedding-3-small` da OpenAI e modelos via OpenRouter).

### Arquivos a criar/alterar

```
prisma/
├── schema.prisma            ← schema completo com todos os modelos
└── migrations/
    ├── 0_init/              ← já existe (pgvector extension)
    ├── 1_auth_schema/       ← Tenant, User
    ├── 2_candidate/         ← Candidate, ContactMethod
    ├── 3_jobs/              ← Job, JobRequirement, ScreeningQuestion
    ├── 4_applications/      ← Application, ScreeningAnswer, ApplicationStage
    ├── 5_conversations/     ← Conversation, InterviewSchedule
    └── 6_embeddings/        ← ALTER TABLE para colunas vector (SQL manual)
```
