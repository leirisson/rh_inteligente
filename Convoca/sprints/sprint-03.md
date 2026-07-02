# Sprint 3 — CRUD: Empresas, Vagas e Candidatos

**Specs cobertas:** 05 (Cadastro de Empresas e Vagas) + 06 (Cadastro de Candidatos)
**Status:** ✅ Concluída
**Pré-requisito:** Sprint 2 concluída — banco com schema completo, JWT e middleware de tenant funcionais

---

## Objetivo

Implementar os endpoints de CRUD do domínio core: cadastro de empresas (onboarding de tenant), gerenciamento de vagas e perguntas de triagem, e cadastro de candidatos com seus meios de contato. Ao final desta sprint o RH consegue criar uma vaga completa e um candidato consegue se cadastrar na plataforma.

---

## Entregas da Spec 05 — Cadastro de Empresas e Vagas

> Spec ainda não escrita — será detalhada após Sprint 2 estar aprovada.
> Preencher esta seção quando a spec 05 for criada em `api/specs/`.

### Escopo esperado (baseado no domínio)

- Onboarding de nova empresa (cria Tenant + primeiro TENANT_ADMIN)
- CRUD de `Job` (vaga): criar, editar, listar, mudar status
- CRUD de `JobRequirement`: adicionar/remover requisitos de uma vaga
- CRUD de `ScreeningQuestion`: perguntas de triagem vinculadas à vaga
- Toda operação restrita ao `tenant_id` do usuário autenticado
- Transição de status `DRAFT → ACTIVE` emite evento (gatilho para Spec 08) — apenas emitir o evento aqui, sem lógica de agente ainda

### Critérios de aceite esperados

- [x] Criar empresa retorna tenant + usuário admin com token JWT
- [x] CRUD de vagas restrito ao tenant — outro tenant não consegue ver nem editar
- [x] Vaga sem perguntas de triagem não pode ser ativada
- [x] Listar vagas retorna paginação

---

## Entregas da Spec 06 — Cadastro de Candidatos

> Spec ainda não escrita — será detalhada após Sprint 2 estar aprovada.
> Preencher esta seção quando a spec 06 for criada em `api/specs/`.

### Escopo esperado (baseado no domínio)

- Cadastro de `Candidate`: nome, resumo/perfil, meios de contato (WhatsApp, e-mail)
- CRUD de `ContactMethod` vinculado ao candidato
- Autenticação do candidato (JWT sem tenant_id)
- Endpoint para o candidato consultar suas `Application`s

### Critérios de aceite esperados

- [x] Candidato consegue se cadastrar sem pertencer a nenhum tenant
- [x] Candidato consegue cadastrar múltiplos meios de contato
- [x] Candidato autenticado não acessa nenhuma rota restrita a papéis de empresa
- [x] Dados do candidato não aparecem em listagens de outros tenants

---

## Arquivos a criar (estrutura esperada)

```
src/
├── modules/
│   ├── tenant/
│   │   ├── tenant.service.ts
│   │   ├── tenant.routes.ts
│   │   └── tenant.schema.ts
│   ├── job/
│   │   ├── job.service.ts
│   │   ├── job.routes.ts
│   │   └── job.schema.ts
│   ├── screening-question/
│   │   ├── screening-question.service.ts
│   │   ├── screening-question.routes.ts
│   │   └── screening-question.schema.ts
│   └── candidate/
│       ├── candidate.service.ts
│       ├── candidate.routes.ts
│       └── candidate.schema.ts
```

> Esta estrutura será revisada quando as specs 05 e 06 forem escritas.
