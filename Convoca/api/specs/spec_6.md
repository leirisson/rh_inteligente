# Spec 10 — Fluxo de Fases e Classificação

## Contexto

Hoje as transições de `ApplicationStatus` acontecem em dois pontos do código (`application.service.ts#processCandidateMessage` e `agent/nodes.ts#sendInitialContact`) via `prisma.application.update` direto, sem qualquer validação — nada impede uma transição ilegal (ex: `PENDING_CONTACT → HIRED`). Esta spec centraliza a lógica de transição em um serviço único, validado e transacional, e adiciona relatório de funil e notificação ao recrutador.

## Escopo

- Serviço de transição de fase (`transitionApplication`) com mapa explícito de transições válidas.
- Refactor dos dois call sites existentes para usar esse serviço.
- Notificação por e-mail aos recrutadores/admins do tenant quando uma `Application` é aprovada.
- Relatório de funil: contagem de candidatos por fase, por vaga.

## Requisitos funcionais

1. Transições válidas de `ApplicationStatus`:

   ```
   PENDING_CONTACT     → IN_SCREENING | WITHDRAWN
   IN_SCREENING        → APPROVED | REJECTED | WITHDRAWN
   APPROVED            → INTERVIEW_SCHEDULED | REJECTED | WITHDRAWN
   INTERVIEW_SCHEDULED → APPROVED | HIRED | REJECTED | WITHDRAWN
   HIRED, REJECTED, WITHDRAWN → (nenhuma — estados terminais)
   ```

   A transição `INTERVIEW_SCHEDULED → APPROVED` representa o cancelamento de uma entrevista agendada (ver Spec 11) — o candidato permanece aprovado e pode ser reagendado depois, em vez de ser automaticamente reprovado.

2. Transição fora do mapa acima é rejeitada com `422` e código `INVALID_APPLICATION_TRANSITION`, com mensagem indicando os estados de origem/destino.
3. Toda transição bem-sucedida grava a mudança de `Application.status` **e** um novo registro em `ApplicationStage` na mesma transação de banco (`prisma.$transaction`) — nunca uma sem a outra.
4. `ApplicationStage` é append-only: nenhum caminho de código deve fazer `update`/`delete` sobre registros existentes dessa tabela.
5. Quando uma transição resulta em `APPROVED`, o sistema envia e-mail de notificação para todos os usuários do tenant com papel `TENANT_ADMIN` ou `RECRUITER`. Falha no envio de e-mail não reverte a transição (best-effort, fora da transação de banco).
6. Relatório de funil (`GET /jobs/:jobId/funnel`): retorna a contagem de `Application`s por status **atual** (não histórico de `ApplicationStage`) para a vaga informada, com todos os 7 valores do enum presentes (zero quando não há candidatos naquele status).

## Decisões técnicas

| Item                     | Escolha                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Localização do serviço   | `src/lib/application-transition.ts` — é regra transversal usada tanto pelo módulo `application` quanto pelo `agent`, não pertence a um módulo de domínio específico                                                                                                                                                                                      |
| Notificação de aprovação | Todos os `TENANT_ADMIN` + `RECRUITER` do tenant. **Simplificação deliberada**: não há relação `Job`/`User` → "líder de setor" no schema atual (`UserRole.DEPARTMENT_LEAD` existe como papel, mas sem vínculo a vaga/área). Roteamento específico para líder de setor fica fora de escopo nesta sprint — revisável se essa relação for modelada no futuro |
| Funil                    | `prisma.application.groupBy({ by: ["status"], where: { jobId, job: { tenantId } } })`, zero-preenchido para todos os status do enum                                                                                                                                                                                                                      |
| Acesso ao funil          | Qualquer usuário de empresa autenticado do tenant (leitura), sem exigência de papel específico — mesmo padrão de `matching.routes.ts`                                                                                                                                                                                                                    |

## Critérios de aceite

- [ ] Transição inválida é rejeitada com `422` e mensagem clara
- [ ] Histórico de fases é imutável — não é possível sobrescrever um `ApplicationStage`
- [ ] Recrutador/admin recebe notificação por e-mail quando candidato é aprovado
- [ ] `GET /jobs/:jobId/funnel` retorna contagem por fase, com todos os status presentes (zero-filled)

## Fora de escopo

- Roteamento de notificação específico para líder de setor (`DEPARTMENT_LEAD`) — requer modelagem futura de `Job` ↔ `User` responsável pela área
- Canais de notificação além de e-mail (SMS, push)
- Templates de e-mail configuráveis pelo tenant
