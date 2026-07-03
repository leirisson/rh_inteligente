# Sprint 5 — WhatsApp, Fases e Agendamento de Entrevista

**Specs cobertas:** [09 (Integração WhatsApp)](../api/specs/spec_5.md) + [10 (Fluxo de Fases e Classificação)](../api/specs/spec_6.md) + [11 (Agendamento de Entrevista)](../api/specs/spec_7.md)
**Status:** ✅ Concluída
**Pré-requisito:** Sprint 4 concluída — agente de triagem funcional, candidatos classificados

---

## Objetivo

Conectar o agente ao mundo real via WhatsApp (Evolution API), implementar as transições de fase do processo seletivo e o agendamento da entrevista final. Ao final desta sprint o fluxo completo — desde o contato inicial até a entrevista marcada — acontece de ponta a ponta.

---

## Entregas da Spec 09 — Integração WhatsApp (Evolution API)

Ver [spec_5.md](../api/specs/spec_5.md) para o detalhamento completo.

- `evolutionWhatsAppChannel` (`src/lib/contact-channel.ts`) — envio real via Evolution API (`fetch`, sem SDK)
- `combinedContactChannel` — WhatsApp com fallback automático para e-mail (Nodemailer/SMTP)
- `POST /webhooks/whatsapp/:tenantId` — recebe resposta do candidato, resolve telefone → `ContactMethod` → `Candidate` → `Application` (`IN_SCREENING`), autenticado via `X-Webhook-Secret`
- Sem credenciais reais da Evolution API disponíveis ainda — env vars opcionais, testes mockam toda chamada de rede

### Critérios de aceite

- [x] Agente consegue enviar mensagem via WhatsApp usando número do `ContactMethod`
- [x] Resposta do candidato via WhatsApp chega ao agente via webhook
- [x] Fallback para e-mail funciona quando canal preferencial é `EMAIL` ou WhatsApp falha
- [x] Cada mensagem (enviada e recebida) é registrada em `Conversation` com timestamp e canal

---

## Entregas da Spec 10 — Fluxo de Fases e Classificação

Ver [spec_6.md](../api/specs/spec_6.md) para o detalhamento completo.

- `transitionApplication()` (`src/lib/application-transition.ts`) — mapa de transição explícito, validado e transacional; substitui as escritas diretas de status em `application.service.ts` e `agent/nodes.ts`
- Notificação por e-mail a `TENANT_ADMIN`+`RECRUITER` do tenant quando `Application` vira `APPROVED` (roteamento para líder de setor específico ficou fora de escopo — não há relação `Job`↔`User` de área no schema)
- `GET /jobs/:jobId/funnel` — contagem de candidatos por status atual, zero-filled

### Critérios de aceite

- [x] Transição inválida é rejeitada com 422 e mensagem clara
- [x] Histórico de fases é imutável — não é possível sobrescrever um `ApplicationStage`
- [x] Recrutador/admin recebe notificação quando candidato é aprovado
- [x] Relatório de funil: quantos em cada fase por vaga

---

## Entregas da Spec 11 — Agendamento de Entrevista

Ver [spec_7.md](../api/specs/spec_7.md) para o detalhamento completo.

- `src/modules/interview/` — `POST /applications/:id/interviews`, `PATCH .../interviews/reschedule`, `PATCH .../interviews/cancel`
- `InterviewSchedule` migrado de 1:1 para 1:muitos com `InterviewStatus` (SCHEDULED/RESCHEDULED/CANCELLED), preservando histórico de reagendamentos
- Cancelamento transiciona a `Application` de volta para `APPROVED` (não terminal — permite reagendar depois)
- Notificação ao candidato via canal combinado em todas as três ações

### Critérios de aceite

- [x] Não é possível agendar entrevista para candidato com status diferente de `APPROVED`
- [x] Candidato recebe confirmação da entrevista pelo canal preferencial
- [x] Reagendamento gera novo `InterviewSchedule` e notifica o candidato
- [x] Cancelamento atualiza status e notifica candidato

---

## Arquivos criados/modificados

```text
src/
├── lib/
│   ├── contact-channel.ts       ← + evolutionWhatsAppChannel/emailChannel/combinedContactChannel
│   ├── notification.ts          ← novo: sendEmail() + notifyRecruitersOnApproval()
│   └── application-transition.ts ← novo: ALLOWED_TRANSITIONS + transitionApplication()
├── modules/
│   ├── webhook/
│   │   ├── whatsapp.routes.ts     ← POST /webhooks/whatsapp/:tenantId
│   │   ├── whatsapp.service.ts    ← resolução candidato/aplicação + delega a processCandidateMessage
│   │   └── whatsapp.schema.ts
│   ├── application/
│   │   ├── application.service.ts ← refatorado para usar transitionApplication()
│   │   ├── funnel.service.ts      ← novo
│   │   └── funnel.routes.ts       ← novo: GET /jobs/:jobId/funnel
│   └── interview/
│       ├── interview.service.ts   ← novo
│       ├── interview.routes.ts    ← novo
│       └── interview.schema.ts    ← novo
├── agent/nodes.ts                 ← sendInitialContact usa transitionApplication() + combinedContactChannel
└── config/index.ts                ← + EVOLUTION_API_*, SMTP_* (opcionais)

prisma/migrations/
└── 20260702233154_interview_schedule_history/  ← InterviewSchedule 1:1 → 1:muitos + InterviewStatus
```

Também corrigido nesta sprint (fora do escopo original, mas bloqueante para os testes): `src/config/index.ts` carregava sempre `.env` em testes, fazendo os testes de integração rodarem contra `convoca_dev` em vez de `convoca_test` — ver CLAUDE.md 5.16.
