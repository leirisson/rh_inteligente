# Sprint 4 — Matching Engine e Agente de Triagem

**Specs cobertas:** 07 (Matching Engine) + 08 (Agente de Triagem LangGraph)
**Status:** 🔒 Bloqueada (aguarda Sprint 3)
**Pré-requisito:** Sprint 3 concluída — candidatos cadastrados, vagas ativas com perguntas

---

## Objetivo

Implementar o núcleo inteligente do produto: o matching semântico entre perfis e vagas via embeddings, e o agente LangGraph que conduz a triagem conversacional. Ao final desta sprint, ativar uma vaga dispara automaticamente a busca por candidatos compatíveis e inicia o fluxo de contato.

---

## Entregas da Spec 07 — Matching Engine (pgvector + Embeddings)

> Spec ainda não escrita — será detalhada após Sprint 3 estar aprovada.
> Preencher esta seção quando a spec 07 for criada em `api/specs/`.

### Escopo esperado (baseado no domínio)

- Geração de embedding de perfil para `Candidate` (quando cadastrado/atualizado)
- Geração de embedding para `JobRequirement` (quando requisito é salvo)
- Busca por similaridade (cosine distance) entre perfil do candidato e requisitos da vaga
- Threshold de score mínimo configurável por vaga
- Resultado do matching popula uma lista ranqueada de candidatos para a vaga

### Decisões técnicas previstas

| Item | Escolha esperada |
|------|-----------------|
| Modelo de embedding | `text-embedding-3-small` via OpenRouter (dim: 1536) |
| Similaridade | Cosine distance via operador `<=>` do pgvector |
| Quando gerar embedding | Background job assíncrono após save do candidato/requisito |
| Armazenamento | Colunas `vector(1536)` em `Candidate` e `JobRequirement` (já criadas na Sprint 2) |

### Critérios de aceite esperados

- [ ] Embedding é gerado e salvo ao criar/atualizar perfil de candidato
- [ ] Embedding é gerado e salvo ao criar/atualizar `JobRequirement`
- [ ] Query de matching retorna candidatos ordenados por similaridade
- [ ] Candidatos abaixo do threshold não aparecem no resultado

---

## Entregas da Spec 08 — Agente de Triagem (LangGraph)

> Spec ainda não escrita — será detalhada após Sprint 3 estar aprovada.
> Preencher esta seção quando a spec 08 for criada em `api/specs/`.

### Escopo esperado (baseado no domínio)

- Grafo LangGraph que orquestra o fluxo de triagem:
  - Nó: buscar candidatos compatíveis (usa Spec 07)
  - Nó: enviar mensagem de contato inicial (canal: WhatsApp/e-mail)
  - Nó: aguardar resposta do candidato
  - Nó: processar resposta e formular próxima pergunta
  - Nó: avaliar resposta com base na resposta esperada (`ScreeningQuestion.expected_answer`)
  - Nó: classificar candidato (aprovado/reprovado) e registrar em `ApplicationStage`
- O agente consome `llmConfig` de `src/lib/llm.ts` (preparado na Sprint 1)
- Persistência de estado da conversa em `Conversation`

### Decisões técnicas previstas

| Item | Escolha esperada |
|------|-----------------|
| Orquestração | LangGraph (grafo de nós com estado persistido) |
| LLM | Claude via OpenRouter (já configurado em `src/lib/llm.ts`) |
| Trigger | Evento emitido quando `Job.status` muda para `ACTIVE` (Spec 05) |
| Estado do grafo | Persistido no banco — `Conversation` + `ApplicationStage` |

### Critérios de aceite esperados

- [ ] Ativar vaga dispara o agente automaticamente
- [ ] Agente entra em contato com candidatos compatíveis (score acima do threshold)
- [ ] Conversa completa fica registrada em `Conversation`
- [ ] Candidato aprovado tem `ApplicationStatus` atualizado para `APPROVED`
- [ ] Candidato reprovado tem `ApplicationStatus` atualizado para `REJECTED` com motivo
- [ ] Teste e2e do grafo LangGraph com mock de respostas

---

## Arquivos a criar (estrutura esperada)

```
src/
├── modules/
│   ├── embedding/
│   │   ├── embedding.service.ts   ← chamada ao modelo de embedding via OpenRouter
│   │   └── embedding.queue.ts     ← fila/worker para geração assíncrona
│   └── matching/
│       ├── matching.service.ts    ← query pgvector + ranking
│       └── matching.schema.ts
├── agent/
│   ├── graph.ts                   ← definição do grafo LangGraph
│   ├── nodes/
│   │   ├── find-candidates.ts
│   │   ├── send-initial-contact.ts
│   │   ├── process-response.ts
│   │   ├── evaluate-answer.ts
│   │   └── classify-candidate.ts
│   └── state.ts                   ← tipo do estado do grafo
```

> Esta estrutura será revisada quando as specs 07 e 08 forem escritas.
