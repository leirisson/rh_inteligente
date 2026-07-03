# Índice de Specs — Agente de RH (Triagem Automatizada via IA)

Este índice define a ordem de criação e implementação das especificações do projeto, organizadas por nível de importância. A ordem **não é arbitrária**: cada camada depende da anterior estar funcional, e foi pensada para uso com Spec-Driven Development (SDD) junto a agentes de codificação (Claude Code).

## Convenção de pastas

```
/specs
  00-INDEX.md                          → este arquivo
  01-infraestrutura/
    spec.md
  02-configuracao-base/
    spec.md
  03-autenticacao-multitenancy/
    spec.md
  04-modelagem-banco-dados/
    spec.md
  05-cadastro-empresas-vagas/
    spec.md
  06-cadastro-candidatos/
    spec.md
  07-matching-engine/
    spec.md
  08-agente-triagem-langgraph/
    spec.md
  09-integracao-whatsapp/
    spec.md
  10-fluxo-fases-classificacao/
    spec.md
  11-agendamento-entrevista/
    spec.md
  12-testes-automatizados/
    spec.md
  13-observabilidade-deploy/
    spec.md
  14-whatsapp-multi-tenant-e-contato-recrutador/
    spec.md
```

Cada `spec.md` segue o mesmo template interno (contexto, escopo, requisitos funcionais, regras de negócio, critérios de aceite, fora de escopo). Quando uma feature for implementada, pode-se adicionar `plan.md` (decisões técnicas) e `tasks.md` (lista granular de tarefas) na mesma pasta — mas isso é gerado **a partir** do `spec.md`, nunca antes dele.

## Camadas e ordem de prioridade

### Camada 1 — Infraestrutura (fundação, não-negociável)

| #   | Spec           | Por quê vem primeiro                                                                              |
| --- | -------------- | ------------------------------------------------------------------------------------------------- |
| 01  | Infraestrutura | Sem isso nada roda: repositório, Docker, Postgres+pgvector, scaffolding do Fastify e do LangGraph |

### Camada 2 — Configuração

| #   | Spec                         | Por quê vem em seguida                                                                                                                                                                                                                                    |
| --- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 02  | Configuração base            | Env vars, validação de config, logging, plugins do Fastify, padrões de lint/format — define as regras antes de qualquer linha de regra de negócio                                                                                                         |
| 03  | Autenticação e multi-tenancy | Define isolamento entre empresas (tenants) e papéis de permissão (Super Admin, Admin Empresa, Recrutador, Líder de Setor, Candidato) — precisa existir antes do schema de banco porque `tenant_id` afeta o desenho de praticamente toda tabela de negócio |

### Camada 3 — Modelagem de dados

| #   | Spec                        | Por quê vem em seguida                                                                                                                                  |
| --- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 04  | Modelagem do banco de dados | Schema Prisma completo (empresas, vagas, candidatos, perguntas, respostas, fases, conversas), já incorporando `tenant_id` e papéis definidos na Spec 03 |

### Camada 4 — Codificação: domínio core (CRUD)

| #   | Spec                         |
| --- | ---------------------------- |
| 05  | Cadastro de empresas e vagas |
| 06  | Cadastro de candidatos       |

### Camada 5 — Codificação: inteligência

| #   | Spec                                    |
| --- | --------------------------------------- |
| 07  | Matching engine (pgvector + embeddings) |
| 08  | Agente de triagem (LangGraph)           |
| 09  | Integração WhatsApp (Evolution API)     |
| 10  | Fluxo de fases e classificação          |
| 11  | Agendamento de entrevista               |

### Camada 6 — Qualidade e operação

| #   | Spec                                                       |
| --- | ---------------------------------------------------------- |
| 12  | Testes automatizados (unitários, integração, e2e do grafo) |
| 13  | Observabilidade e deploy                                   |

### Camada 7 — Extensão pós-lançamento

| #   | Spec                                                                     | Por quê vem depois                                                                                                                                                     |
| --- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 14  | WhatsApp institucional multi-tenant e contato pessoal do recrutador       | Substitui o modelo single-instance (env vars globais) da Spec 09 por credenciais por tenant; motivada pelos mockups de frontend em `Convoca/api/.stitch/admin.md`, que já assumem esse fluxo |

## Status de criação

- [x] 00 — Índice
- [x] 01 — Infraestrutura
- [x] 02 — Configuração base
- [x] 03 — Autenticação e multi-tenancy
- [x] 04 — Modelagem do banco de dados
- [x] 09 — Integração WhatsApp (`spec_5.md`)
- [x] 10 — Fluxo de fases e classificação (`spec_6.md`)
- [x] 11 — Agendamento de entrevista (`spec_7.md`)
- [x] 12 — Testes automatizados (`spec_8.md`)
- [x] 13 — Observabilidade e deploy (`spec_9.md`) — escrita após a primeira versão do CI já estar implementada e validada; parte dos requisitos/critérios de aceite estão marcados como concluídos, o restante (Dockerfile, deploy, observabilidade) permanece pendente
- [x] 14 — WhatsApp institucional multi-tenant e contato pessoal do recrutador (`spec_10.md`) — escrita a partir dos mockups de frontend (`Convoca/api/.stitch/admin.md`); implementação ainda pendente (ver `Convoca/sprints/sprint-07.md`)
- [ ] 05, 06, 07, 08 — implementadas sem `spec.md` formal (ver `Convoca/sprints/` para escopo e status de cada sprint)

> As specs de 05 a 08 foram implementadas diretamente a partir do escopo descrito nos sprints, sem passar por um `spec.md` formal antes do código — prática retomada a partir da Spec 09 (09/10/11/12/13 têm spec escrita seguindo a intenção original deste índice; no caso da 13, escrita em paralelo à implementação do CI em vez de estritamente antes).
