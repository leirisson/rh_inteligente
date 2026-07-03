# Spec 09 — Integração WhatsApp (Evolution API)

## Contexto

A Spec 08 entregou o agente de triagem com um canal de contato mockado (`mockContactChannel`), documentado como stand-in intencional até esta spec existir (ver CLAUDE.md 5.13). Esta spec substitui o mock por uma integração real com a Evolution API para envio/recebimento de mensagens WhatsApp, com fallback para e-mail. Não há instância Evolution API provisionada com credenciais reais no momento desta implementação — o código deve ser completo e correto, mas totalmente testável via mocks de rede, sem depender de infraestrutura externa disponível agora.

## Escopo

- `ContactChannel` real (`evolutionWhatsAppChannel`) que envia mensagens via Evolution API usando o número de telefone do `ContactMethod` do candidato.
- Fallback automático para e-mail (`emailChannel`, via Nodemailer/SMTP) quando o canal preferencial do candidato é `EMAIL` ou quando o envio por WhatsApp falha.
- `combinedContactChannel`: implementação que decide entre WhatsApp e e-mail e é o novo canal padrão usado pelo agente e pelo módulo de aplicação.
- `POST /webhooks/whatsapp/:tenantId` — recebe o payload de mensagem inbound da Evolution API e alimenta o fluxo de triagem existente (`processCandidateMessage`).
- Toda mensagem (enviada e recebida) continua registrada em `Conversation`, com o canal **realmente usado** (não necessariamente o solicitado, no caso de fallback).

## Requisitos funcionais

1. **Envio:** dado um `applicationId`, o sistema busca o(s) `ContactMethod` do candidato associado; prefere `WHATSAPP`, cai para `EMAIL` se não houver método WhatsApp cadastrado.
2. Se a chamada HTTP à Evolution API falhar (resposta não-2xx ou erro de rede), o sistema tenta automaticamente o envio por e-mail antes de propagar erro. Se também não houver `ContactMethod` de e-mail, o erro é propagado.
3. **Recebimento:** o webhook recebe o payload da Evolution API, extrai o número de telefone remetente, resolve `ContactMethod` (`channel: WHATSAPP`) → `Candidate` → `Application`. Como um candidato pode ter aplicações em múltiplos tenants e vagas simultaneamente, a resolução é escopada por `tenantId` (no path do webhook) e filtrada para a `Application` com status `IN_SCREENING` desse candidato dentro desse tenant.
4. Se a resolução não encontrar exatamente uma `Application` correspondente (zero ou múltiplas), o webhook responde `200` sem processar (idempotência — evita retry storm da Evolution API) e registra um log de warning.
5. Mensagem recebida via webhook é processada pelo mesmo caminho que `POST /applications/:id/messages` já usa (`processCandidateMessage`), reaproveitando toda a lógica de avaliação de resposta e progressão do questionário.
6. O webhook exige autenticação via header compartilhado (`X-Webhook-Secret`), comparado a `EVOLUTION_WEBHOOK_SECRET`. Requisição sem o header ou com valor incorreto recebe `401`.

## Decisões técnicas

| Item                               | Escolha                                                                                                                                                                                                                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cliente HTTP                       | `fetch` nativo (Node 20), sem SDK — mesmo padrão de `src/lib/embeddings.ts`                                                                                                                                                                                             |
| Fallback de e-mail                 | Nodemailer + SMTP real (não mockado)                                                                                                                                                                                                                                    |
| Autenticação do webhook            | Shared secret via header, não JWT — a Evolution API não autentica como usuário Convoca                                                                                                                                                                                  |
| Roteamento multi-tenant do webhook | `tenantId` como path param (`/webhooks/whatsapp/:tenantId`), assumindo uma instância Evolution API por tenant nesta fase                                                                                                                                                |
| Credenciais reais                  | Ausentes nesta implementação — todas as env vars relacionadas (`EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE_NAME`, `EVOLUTION_WEBHOOK_SECRET`) são opcionais; código falha de forma clara e tratável quando não configuradas, sem derrubar a aplicação |
| Canal registrado em `Conversation` | O canal efetivamente usado (após eventual fallback), não o solicitado                                                                                                                                                                                                   |

## Critérios de aceite

- [ ] Agente/módulo de aplicação consegue enviar mensagem via WhatsApp usando o número do `ContactMethod` do candidato
- [ ] Resposta do candidato via WhatsApp chega ao fluxo de triagem através do webhook
- [ ] Fallback para e-mail funciona quando canal preferencial é `EMAIL` ou quando o envio WhatsApp falha
- [ ] Cada mensagem (enviada e recebida) é registrada em `Conversation` com timestamp e canal corretos
- [ ] Webhook retorna `401` para secret ausente/incorreto
- [ ] Webhook retorna `200` sem processar quando a aplicação do candidato não pode ser resolvida de forma inequívoca

## Fora de escopo

- Mídia rica (botões, imagens, áudio) — apenas texto
- Múltiplas instâncias Evolution API por tenant
- Webhooks de status de entrega (enviado/entregue/lido)
- Provisionamento real da instância Evolution API (infraestrutura, não código)
