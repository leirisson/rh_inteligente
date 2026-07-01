# Sprint 5 — WhatsApp, Fases e Agendamento de Entrevista

**Specs cobertas:** 09 (Integração WhatsApp) + 10 (Fluxo de Fases e Classificação) + 11 (Agendamento de Entrevista)
**Status:** 🔒 Bloqueada (aguarda Sprint 4)
**Pré-requisito:** Sprint 4 concluída — agente de triagem funcional, candidatos classificados

---

## Objetivo

Conectar o agente ao mundo real via WhatsApp (Evolution API), implementar as transições de fase do processo seletivo e o agendamento da entrevista final. Ao final desta sprint o fluxo completo — desde o contato inicial até a entrevista marcada — acontece de ponta a ponta.

---

## Entregas da Spec 09 — Integração WhatsApp (Evolution API)

> Spec ainda não escrita — será detalhada após Sprint 4 estar aprovada.
> Preencher esta seção quando a spec 09 for criada em `api/specs/`.

### Escopo esperado (baseado no domínio)

- Integração com Evolution API para envio e recebimento de mensagens WhatsApp
- Webhook para receber respostas dos candidatos e alimentar o agente (Spec 08)
- Fallback para e-mail quando candidato não tem WhatsApp cadastrado
- Registro de cada mensagem em `Conversation` com canal (`WHATSAPP` | `EMAIL`)

### Decisões técnicas previstas

| Item | Escolha esperada |
|------|-----------------|
| Provider WhatsApp | Evolution API (self-hosted ou cloud) |
| Integração e-mail | Nodemailer ou API transacional (a definir) |
| Webhook | Rota POST autenticada em `POST /webhooks/whatsapp` |

### Critérios de aceite esperados

- [ ] Agente consegue enviar mensagem via WhatsApp usando número do `ContactMethod`
- [ ] Resposta do candidato via WhatsApp chega ao agente via webhook
- [ ] Fallback para e-mail funciona quando canal preferencial é `EMAIL`
- [ ] Cada mensagem (enviada e recebida) é registrada em `Conversation` com timestamp e canal

---

## Entregas da Spec 10 — Fluxo de Fases e Classificação

> Spec ainda não escrita — será detalhada após Sprint 4 estar aprovada.
> Preencher esta seção quando a spec 10 for criada em `api/specs/`.

### Escopo esperado (baseado no domínio)

- Transições válidas de `ApplicationStatus`:
  ```
  PENDING_CONTACT → IN_SCREENING → APPROVED → INTERVIEW_SCHEDULED → HIRED
                                 ↘ REJECTED
                 ↘ WITHDRAWN (candidato desiste a qualquer momento)
  ```
- Cada transição gera um novo registro em `ApplicationStage` (append-only)
- Notificação ao recrutador quando candidato é `APPROVED`
- Notificação ao líder de setor quando candidato é `APPROVED` para sua área
- Regras de negócio de transição (ex: não pode ir para `INTERVIEW_SCHEDULED` sem estar `APPROVED`)

### Critérios de aceite esperados

- [ ] Transição inválida é rejeitada com 422 e mensagem clara
- [ ] Histórico de fases é imutável — não é possível sobrescrever um `ApplicationStage`
- [ ] Recrutador recebe notificação quando candidato é aprovado
- [ ] Relatório de funil: quantos em cada fase por vaga

---

## Entregas da Spec 11 — Agendamento de Entrevista

> Spec ainda não escrita — será detalhada após Sprint 4 estar aprovada.
> Preencher esta seção quando a spec 11 for criada em `api/specs/`.

### Escopo esperado (baseado no domínio)

- Recrutador ou Líder agenda entrevista para candidato `APPROVED`
- Cria registro em `InterviewSchedule` com data/hora, local/link e participantes
- Notificação ao candidato via WhatsApp/e-mail com os detalhes da entrevista
- Transição automática de `ApplicationStatus` para `INTERVIEW_SCHEDULED`
- Possibilidade de reagendar ou cancelar

### Critérios de aceite esperados

- [ ] Não é possível agendar entrevista para candidato com status diferente de `APPROVED`
- [ ] Candidato recebe confirmação da entrevista pelo canal preferencial
- [ ] Reagendamento gera novo `InterviewSchedule` e notifica o candidato
- [ ] Cancelamento atualiza status e notifica candidato

---

## Arquivos a criar (estrutura esperada)

```
src/
├── modules/
│   ├── webhook/
│   │   └── whatsapp.routes.ts     ← POST /webhooks/whatsapp
│   ├── messaging/
│   │   ├── whatsapp.service.ts    ← Evolution API client
│   │   └── email.service.ts       ← cliente de e-mail transacional
│   ├── application/
│   │   ├── application.service.ts ← transições de fase + validações
│   │   └── application.routes.ts
│   └── interview/
│       ├── interview.service.ts
│       └── interview.routes.ts
```

> Esta estrutura será revisada quando as specs 09, 10 e 11 forem escritas.
