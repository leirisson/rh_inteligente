# Convoca

> A vaga te encontra. Você não precisa mais caçar emprego.

Convoca é uma plataforma de recrutamento com triagem automatizada por agente de IA. Em vez do candidato monitorar dezenas de plataformas de emprego, é um agente que encontra a pessoa: quando uma empresa ativa uma vaga, o agente busca os candidatos cadastrados com perfil compatível, faz o primeiro contato por WhatsApp ou e-mail, conduz a triagem inicial em forma de conversa e encaminha os aprovados direto para o recrutador ou líder do setor.

## O problema

Quem procura emprego precisa cadastrar currículo em várias plataformas (LinkedIn, Gupy, InfoJobs, Indeed...) e voltar em cada uma, todo dia, para ver se surgiu algo novo. É um trabalho manual e repetitivo, e a vaga nunca vem até a pessoa — ela é que tem que ir atrás.

Do lado do RH, o problema é simétrico: triagens manuais repetitivas, as mesmas perguntas feitas dezenas de vezes, e muito tempo gasto em filtragem mecânica antes de chegar à parte que realmente exige julgamento humano.

## A solução

Convoca inverte a lógica. O candidato se cadastra **uma vez** e o sistema trabalha por ele:

1. **Busca** candidatos compatíveis com a vaga via comparação semântica (não apenas palavras-chave).
2. **Contata** diretamente por WhatsApp ou e-mail.
3. **Tria** em forma de conversa natural, não em formulário burocrático.
4. **Classifica** as respostas conforme os critérios definidos pelo RH.
5. **Encaminha** os aprovados para o recrutador ou líder do setor.

## Stack

| Camada | Tecnologia |
|---|---|
| Orquestração do agente | LangGraph |
| API / Backend | Fastify (TypeScript) |
| Banco de dados | PostgreSQL + pgvector |
| ORM | Prisma |
| Matching semântico | Embeddings + pgvector |
| Canal de mensagens | WhatsApp via Evolution API / e-mail |
| LLM | OpenRouter (Claude) |
| Containerização | Docker + Docker Compose |

## Arquitetura

```
┌─────────────┐      ┌──────────────┐      ┌──────────────────┐
│  Empresa /  │─────▶│   Fastify    │─────▶│  PostgreSQL +    │
│  Recrutador │      │     API      │      │    pgvector      │
└─────────────┘      └──────┬───────┘      └──────────────────┘
                            │
                            │ vaga ativada
                            ▼
                     ┌──────────────┐      ┌──────────────────┐
                     │   LangGraph  │─────▶│  Evolution API   │
                     │ (agente de   │      │  (WhatsApp) /    │
                     │  triagem)    │◀─────│  e-mail          │
                     └──────────────┘      └────────┬─────────┘
                                                    │
                                                    ▼
                                            ┌──────────────┐
                                            │  Candidato   │
                                            └──────────────┘
```

O sistema é **multi-tenant**: cada empresa é um tenant isolado, com controle de acesso por papéis (Super Admin, Admin da Empresa, Recrutador, Líder de Setor, Candidato).

## Spec-Driven Development

Este projeto é desenvolvido com Spec-Driven Development (SDD): cada feature tem uma especificação em `specs/`, organizada por camadas de prioridade, escrita antes da implementação. As specs são consumidas por agentes de codificação para gerar implementação e testes de forma mais precisa.

```
specs/
├── 00-INDEX.md                      # ordem de prioridade de todas as specs
├── 01-infraestrutura/
├── 02-configuracao-base/
├── 03-autenticacao-multitenancy/
├── 04-modelagem-banco-dados/
├── 05-cadastro-empresas-vagas/      # a criar
├── 06-cadastro-candidatos/          # a criar
├── 07-matching-engine/              # a criar
├── 08-agente-triagem-langgraph/     # a criar
├── 09-integracao-whatsapp/          # a criar
├── 10-fluxo-fases-classificacao/    # a criar
├── 11-agendamento-entrevista/       # a criar
├── 12-testes-automatizados/         # a criar
└── 13-observabilidade-deploy/       # a criar
```

## Como rodar (desenvolvimento)

> Pré-requisitos: Docker, Docker Compose e Node.js (versão em `.nvmrc`).

```bash
# 1. Clonar o repositório
git clone <url-do-repo>
cd convoca

# 2. Configurar variáveis de ambiente
cp .env.example .env
# edite o .env com suas credenciais (banco, OpenRouter, Evolution API)

# 3. Subir os containers (API + PostgreSQL com pgvector)
docker compose up

# 4. Rodar as migrations do banco
npx prisma migrate dev

# 5. Verificar
# GET http://localhost:3000/health  → { "status": "ok" }
```

## Status do projeto

🚧 Em desenvolvimento. Atualmente na fase de especificação e montagem da infraestrutura base.

Roadmap de alto nível:

- [x] Definição do problema e da solução
- [x] Specs de infraestrutura, configuração, autenticação e modelagem de dados
- [ ] Implementação da infraestrutura base
- [ ] CRUD de empresas, vagas e candidatos
- [ ] Matching engine (pgvector)
- [ ] Agente de triagem (LangGraph)
- [ ] Integração com WhatsApp
- [ ] Fluxo de fases e agendamento de entrevista

## Sobre

Convoca nasceu de uma dor pessoal real — a de ter que caçar vagas em várias plataformas ao mesmo tempo — e é desenvolvido como projeto de portfólio com foco em IA aplicada, demonstrando arquitetura de agentes, matching semântico e orquestração de workflows de recrutamento ponta a ponta.