# Spec 11 — Agendamento de Entrevista

## Contexto

Com o fluxo de fases validado (Spec 10), o agendamento de entrevista é, em si, uma transição de fase (`APPROVED → INTERVIEW_SCHEDULED`) acompanhada da criação de um registro de agendamento. O modelo `InterviewSchedule` já existe no schema desde a Spec 04, mas como relação 1:1 com `Application` (`@unique` em `applicationId`) — incompatível com o requisito de "reagendamento gera novo registro" (histórico de reagendamentos). Esta spec migra o modelo para 1:muitos com um campo de status.

## Escopo

- Migração de `InterviewSchedule` de 1:1 para 1:muitos, com enum `InterviewStatus` (`SCHEDULED`/`RESCHEDULED`/`CANCELLED`).
- Novo módulo `src/modules/interview/` com agendamento, reagendamento e cancelamento.
- Notificação ao candidato (via canal combinado WhatsApp/e-mail da Spec 09) em cada uma dessas três ações.

## Requisitos funcionais

1. **Agendar** (`POST /applications/:id/interviews`): permitido apenas quando `Application.status === APPROVED`. Cria um `InterviewSchedule` (`status: SCHEDULED`) e transiciona a `Application` para `INTERVIEW_SCHEDULED` na mesma operação transacional — se a transição for inválida (aplicação não está `APPROVED`), nada é criado e a resposta é `422`.
2. **Reagendar** (`PATCH /applications/:id/interviews/reschedule`): exige um `InterviewSchedule` ativo (status `SCHEDULED` ou `RESCHEDULED`, o mais recente) para a aplicação — `404` se não houver. Marca o registro atual como `RESCHEDULED` e cria um novo registro `SCHEDULED` com a nova data/local/notas. Não altera `Application.status` (permanece `INTERVIEW_SCHEDULED`).
3. **Cancelar** (`PATCH /applications/:id/interviews/cancel`): marca o registro ativo como `CANCELLED` e transiciona a `Application` de volta para `APPROVED` (via `transitionApplication`).
4. Em todas as três ações, o candidato é notificado pelo canal combinado (WhatsApp com fallback de e-mail) com os detalhes relevantes (data/local no agendamento e reagendamento; confirmação de cancelamento).
5. "Registro ativo" de uma aplicação = `InterviewSchedule` mais recente (`createdAt desc`) cujo `status` não é `CANCELLED`.

## Decisões técnicas

| Item                                 | Escolha                                                                                                                                                                                                             |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cardinalidade de `InterviewSchedule` | 1:muitos (remoção do `@unique` em `applicationId`), com `status: InterviewStatus` para diferenciar o registro ativo do histórico                                                                                    |
| Migração de schema                   | Nova migration Prisma: enum `InterviewStatus`, coluna `status` com default `SCHEDULED`, índice não-único em `applicationId` substituindo o índice único anterior                                                    |
| Forma das rotas                      | `POST .../interviews` (criar), `PATCH .../interviews/reschedule` e `PATCH .../interviews/cancel` (ações nomeadas) — escolhido por clareza em vez de um único `PATCH .../interviews/:id` genérico dirigido por corpo |
| Validação de pré-condição            | Feita transacionalmente via `transitionApplication`, não por checagem manual separada — evita condição de corrida entre checagem e escrita                                                                          |
| Papéis autorizados                   | `TENANT_ADMIN`, `RECRUITER`, `DEPARTMENT_LEAD` — "recrutador ou líder agenda", conforme domínio                                                                                                                     |

## Critérios de aceite

- [ ] Não é possível agendar entrevista para candidato com status diferente de `APPROVED` (`422`)
- [ ] Candidato recebe confirmação da entrevista pelo canal preferencial ao agendar
- [ ] Reagendamento gera novo `InterviewSchedule` (o anterior passa a `RESCHEDULED`) e notifica o candidato
- [ ] Cancelamento marca o registro como `CANCELLED`, retorna a `Application` para `APPROVED` e notifica o candidato

## Fora de escopo

- Integração com calendário externo (Google Calendar, convites ICS)
- Agendamento com múltiplos entrevistadores/participantes
- Fuso horário além do armazenamento em UTC
