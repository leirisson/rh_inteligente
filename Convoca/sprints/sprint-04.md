# Sprint 4 — Matching Engine e Agente de Triagem

**Specs cobertas:** 07 (Matching Engine) + 08 (Agente de Triagem LangGraph)
**Status:** ✅ Concluída (2026-07)
**Pré-requisito:** Sprint 3 concluída — candidatos cadastrados, vagas ativas com perguntas

> **Nota (2026-07):** A Spec 08 foi implementada com um canal de contato mockado
> (`ContactChannel`/`mockContactChannel`) em vez de esperar a integração real de WhatsApp/e-mail
> (Spec 09/Sprint 5). O grafo LangGraph fica funcionalmente completo e testável agora; quando a
> Spec 09 chegar, só a implementação do canal muda. "Aguardar resposta do candidato" foi resolvido
> com `POST /applications/:id/messages`, um stand-in do futuro webhook. Ver CLAUDE.md §5.13/§5.14
> e §7 ADR (2026-07).

---

## Objetivo

Implementar o núcleo inteligente do produto: o matching semântico entre perfis e vagas via embeddings, e o agente LangGraph que conduz a triagem conversacional. Ao final desta sprint, ativar uma vaga dispara automaticamente a busca por candidatos compatíveis e inicia o fluxo de contato.

---

## Entregas da Spec 07 — Matching Engine (pgvector + Embeddings)

**Status:** ✅ Implementada (2026-07)

### Escopo implementado

- Geração de embedding de perfil para `Candidate` (síncrona, no signup/update, quando `resumeText` está presente)
- Geração de embedding para `JobRequirement` (síncrona, na criação)
- Endpoint `GET /jobs/:jobId/matches` — busca por similaridade (cosine) entre perfil do candidato e todos os requisitos da vaga, agregado por média
- Threshold de score mínimo via querystring `?threshold=` (default 0.5)
- Resultado ordenado por score desc, tenant-scoped

### Decisões técnicas

| Item | Escolha |
|------|-----------------|
| Modelo de embedding | `text-embedding-3-small` via **OpenAI direto** (dim: 1536) — OpenRouter não expõe endpoint de embeddings |
| Similaridade | Cosine distance via operador `<=>` do pgvector; similaridade = `1 - distância` |
| Quando gerar embedding | Síncrono, dentro do próprio request de create/update — sem fila (projeto não tem infra de fila ainda) |
| Armazenamento | Colunas `vector(1536)` em `Candidate` e `JobRequirement`, migration `add_vector_embeddings` + índices HNSW |
| Agregação de score | Média da similaridade do candidato contra cada `JobRequirement` da vaga |

### Critérios de aceite

- [x] Embedding é gerado e salvo ao criar/atualizar perfil de candidato
- [x] Embedding é gerado e salvo ao criar/atualizar `JobRequirement`
- [x] Query de matching retorna candidatos ordenados por similaridade
- [x] Candidatos abaixo do threshold não aparecem no resultado

---

## Entregas da Spec 08 — Agente de Triagem (LangGraph)

**Status:** ✅ Implementada (2026-07) — canal de contato mockado

### Escopo implementado

- Grafo LangGraph (`@langchain/langgraph`, `StateGraph`) que orquestra o fluxo inicial de triagem:
  - Nó `findCandidates`: busca candidatos compatíveis via `getJobMatches` (Spec 07), filtra os que já têm `Application` para a vaga
  - Nó `createApplications`: cria `Application` (`PENDING_CONTACT`) para cada candidato novo, tolerante a corrida de duplicidade (`P2002`)
  - Nó `sendInitialContact`: envia a primeira `ScreeningQuestion` via `ContactChannel`, avança `Application` para `IN_SCREENING`, registra `ApplicationStage`
- `POST /applications/:id/messages` — processa resposta do candidato (stand-in do webhook real): registra `Conversation`, avalia a resposta via LLM (`evaluateAnswer`), persiste `ScreeningAnswer`, envia a próxima pergunta ou finaliza a triagem
- Veredito final: média ponderada por `ScreeningQuestion.weight`; `score >= 0.6` → `APPROVED`, senão `REJECTED`; motivo registrado em `ApplicationStage.note`
- `ContactChannel` (`src/lib/contact-channel.ts`) abstrai o envio — `mockContactChannel` só grava em `Conversation`, sem envio real
- `llmClient` (SDK `openai`, apontando para OpenRouter) instanciado em `src/lib/llm.ts`

### Decisões técnicas

| Item | Escolha |
|------|-----------------|
| Orquestração | `@langchain/langgraph` real (`StateGraph`), grafo hoje linear mas pronto para ciclos |
| LLM | Claude via OpenRouter, cliente `openai` SDK apontando para `OPENROUTER_BASE_URL` |
| Trigger | Síncrono dentro de `updateJobStatus`, quando `Job.status` transiciona para `ACTIVE` (qualquer origem, não só `DRAFT`) |
| Canal de contato | Interface `ContactChannel` + `mockContactChannel` — registra em `Conversation`, sem envio real |
| "Aguardar resposta" | `POST /applications/:id/messages` — stand-in síncrono do futuro webhook da Spec 09 |
| Criação de candidatura | Agente cria `Application` automaticamente a partir do matching (não existe fluxo de candidatura explícito ainda) |
| Estado do grafo | `AgentState` (`Annotation.Root`) por execução — não persistido entre chamadas, já que o fluxo hoje é linear e síncrono |

### Critérios de aceite

- [x] Ativar vaga dispara o agente automaticamente
- [x] Agente entra em contato com candidatos compatíveis (score acima do threshold)
- [x] Conversa completa fica registrada em `Conversation`
- [x] Candidato aprovado tem `ApplicationStatus` atualizado para `APPROVED`
- [x] Candidato reprovado tem `ApplicationStatus` atualizado para `REJECTED` com motivo
- [x] Teste de integração do grafo LangGraph com mock de embeddings/LLM

---

## Arquivos criados (Spec 07)

```text
src/
├── lib/
│   ├── embeddings.ts               ← generateEmbedding() via OpenAI (fetch direto)
│   └── vector.ts                   ← setCandidateEmbedding/setJobRequirementEmbedding ($executeRaw)
└── modules/
    └── matching/
        ├── matching.service.ts     ← getJobMatches() — query pgvector + agregação por média
        ├── matching.schema.ts
        └── matching.routes.ts      ← GET /jobs/:jobId/matches
```

`candidate.service.ts` e `job-requirement.service.ts` foram estendidos (não recriados) para chamar
`generateEmbedding` + persistir via `vector.ts` no signup/update de candidato e create de requirement.

## Arquivos criados (Spec 08)

```text
src/
├── lib/
│   ├── answer-evaluator.ts         ← evaluateAnswer() via llmClient
│   └── contact-channel.ts          ← ContactChannel + mockContactChannel
├── agent/
│   ├── state.ts                    ← AgentState (Annotation.Root)
│   ├── nodes.ts                    ← findCandidates/createApplications/sendInitialContact
│   └── graph.ts                    ← StateGraph + runScreeningAgent()
└── modules/
    └── application/
        ├── application.service.ts  ← processCandidateMessage()
        ├── application.schema.ts
        └── application.routes.ts   ← POST /applications/:id/messages
```

`llm.ts` foi estendido com `llmClient` (SDK `openai`); `job.service.ts` foi estendido para disparar
`runScreeningAgent` em `updateJobStatus` quando o status vira `ACTIVE`.
