# Spec 12 — Testes Automatizados

## Contexto

O projeto já acumula testes unitários e de integração escritos incrementalmente desde a Spec 03 (104 testes em 19 arquivos, cobrindo auth, tenant, job, candidate, matching, application, interview, webhook). Esta spec formaliza o que já existe como padrão obrigatório daqui para frente, fecha as lacunas conhecidas (teste adversarial de isolamento de tenant, e2e do grafo LangGraph) e define o piso de cobertura. Não introduz uma ferramenta nova — consolida o que Vitest já faz no projeto.

## Escopo

- Padronizar a convenção de nomenclatura e localização já em uso: `*.unit.test.ts` (Prisma mockado, sem rede) e `*.integration.test.ts` (banco real `convoca_test`, chamadas de LLM/embeddings mockadas).
- Adicionar teste adversarial de isolamento de tenant (nenhum existe hoje de forma explícita).
- Adicionar teste e2e do grafo LangGraph simulando uma triagem completa (matching → contato → respostas → decisão), com LLM mockado e banco real.
- Definir threshold mínimo de cobertura e integrá-lo ao CI (Spec 13).

## Requisitos funcionais

1. **Testes unitários**: cobrem regras de negócio isoladas de I/O — `transitionApplication`/`ALLOWED_TRANSITIONS`, `answer-evaluator` (parsing/validação de shape), `rbac` (guards de autorização), serviços com Prisma mockado via `vi.mock`.
2. **Testes de integração**: cobrem rotas HTTP fim-a-fim via `app.inject()` contra `convoca_test` real (Postgres+pgvector), com `generateEmbedding` sempre mockado (`vi.mock("../../lib/embeddings.js", ...)`, vetores determinísticos — nunca chamada real à API da OpenAI, conforme já estabelecido em 5.12 do `CLAUDE.md` raiz).
3. **Teste adversarial de tenant**: dado dois tenants A e B com dados próprios (jobs, candidatos, applications), requisições autenticadas como usuário do tenant A para recursos do tenant B (`GET/PATCH /jobs/:id`, `/jobs/:id/matches`, `/jobs/:id/funnel`, `/applications/:id/*`) devem retornar `404` (não `403` — não revelar existência do recurso), nunca vazar dados. Testado nos módulos `job`, `matching`, `application`, `interview`.
4. **Teste e2e do grafo LangGraph**: dado um tenant, uma vaga `ACTIVE` com requirements e screening questions, e um candidato compatível com embedding mockado, o teste dispara `runScreeningAgent` (via `PATCH /jobs/:id/status` para `ACTIVE`, fluxo real de disparo) e verifica: `Application` criada com `PENDING_CONTACT` → `Conversation` inicial registrada → respostas do candidato simuladas via `POST /applications/:id/messages` → `answer-evaluator` mockado (`vi.mock` do `llmClient`, sem chamada real ao OpenRouter) → estado final da `Application` (`APPROVED` ou `REJECTED` conforme respostas mockadas).
5. **Cobertura mínima**: 80% de statements/lines, 70% de branches, medido por `vitest run --coverage` (provider v8, já configurado em `vitest.config.ts`). Abaixo disso, o step de testes no CI falha.
6. `npm test` continua rodando toda a suíte sem infraestrutura além do Postgres local (via `docker-compose.yml`) ou do service container do CI — sem testcontainers, sem mocks de banco nos testes de integração.

## Decisões técnicas

| Item | Escolha |
| --- | --- |
| Framework | Vitest (já em uso desde a Spec 02/03) — não migrar para Jest |
| Banco nos testes de integração | Postgres real (`convoca_test`), não mock do Prisma — decisão já tomada e validada (ver 5.9, 5.16 do `CLAUDE.md` raiz) |
| Execução dos arquivos de teste | Serial (`fileParallelism: false`) — banco compartilhado sem isolamento por transação (ver 5.9) |
| Mock de LLM/embeddings | `vi.mock` no nível de módulo (`../../lib/embeddings.js`, `../../lib/llm.js`), nunca rede real, mesmo em CI |
| Teste de tenant | Reutiliza os helpers de seed já existentes nos testes de integração (criação de tenant + usuário autenticado), sem infraestrutura nova |
| Threshold de cobertura | 80% statements/lines, 70% branches — calibrado no valor já observado no projeto (85.69%/71.77% medidos ao rodar `test:coverage` nesta sprint), com margem pequena para não travar PRs por flutuação |
| Local dos novos testes | Mesma convenção `*.test.ts` ao lado do código testado — não criar diretório `test/e2e/` separado; o teste do grafo vive em `src/agent/graph.integration.test.ts` |

## Critérios de aceite

- [x] `npm test` roda toda a suíte sem dependências externas além do Docker (Postgres)
- [x] Testes de integração usam banco real (`convoca_test`), não mock do Prisma
- [x] Existe teste adversarial de tenant: usuário do tenant A recebe `404` ao tentar acessar job/application/match de outro tenant, em pelo menos `job`, `matching`, `application` e `interview`
- [x] Existe teste e2e do grafo LangGraph que simula uma triagem completa e verifica o estado final da `Application`
- [x] `npm run test:coverage` reporta ≥80% statements/lines e ≥70% branches (medido: 86%/88.33%/72.72%)
- [x] CI (Spec 13) roda essa suíte e falha o PR se cobertura ficar abaixo do threshold (`coverage.thresholds` em `vitest.config.ts`)

## Fora de escopo

- Testes de carga/performance
- Testes de UI/frontend (não existe frontend no repo ainda)
- Mutation testing
- Testcontainers ou qualquer provisionamento de banco efêmero por teste — o banco compartilhado serial continua sendo a estratégia adotada
