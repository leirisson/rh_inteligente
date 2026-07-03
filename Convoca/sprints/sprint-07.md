# Sprint 7 — WhatsApp Institucional Multi-Tenant e Contato Pessoal do Recrutador

**Specs cobertas:** 14 (WhatsApp Institucional Multi-Tenant e Contato Pessoal do Recrutador, `api/specs/spec_10.md`)
**Status:** ✅ Implementada
**Pré-requisito:** Sprint 6 concluída na parte de testes (Spec 12 ✅); Spec 13 (deploy/observabilidade) pode seguir em paralelo, sem dependência direta desta sprint

---

## Objetivo

Substituir o modelo atual de WhatsApp single-instance (env vars globais do processo, compartilhadas por todos os tenants) por conexão institucional por tenant via QR code, e adicionar um campo de telefone pessoal de exibição no perfil do recrutador. Motivada pelos mockups de frontend já desenhados em `Convoca/api/.stitch/admin.md` (Telas 2 e 2b), que assumem esse fluxo mas ainda não têm suporte no backend.

Ao final desta sprint: um `TENANT_ADMIN` consegue conectar o WhatsApp da própria empresa escaneando um QR code pela UI (sem precisar de acesso ao servidor/env vars), e qualquer recrutador consegue cadastrar seu telefone pessoal no perfil.

---

## Entregas da Spec 14

> Ver `Convoca/api/specs/spec_10.md` para o texto completo da spec.

### 14.1 — WhatsApp institucional por tenant

- [x] **Spike técnico (bloqueante, primeira tarefa da sprint):** confirmar que a instância Evolution API do projeto (`docker-compose.yml`) suporta múltiplas instâncias nomeadas simultâneas, criadas dinamicamente via API — sem isso, os itens abaixo não podem ser implementados como desenhado
- [x] Migration + model `TenantIntegration` (1:1 com `Tenant`): `evolutionInstanceName`, `evolutionApiKey`, `status` (`IntegrationStatus`: `DISCONNECTED | CONNECTING | CONNECTED | ERROR`), `connectedPhoneNumber`, `lastConnectedAt`, `lastErrorMessage`
- [x] `POST /tenants/:id/integrations/whatsapp/connect` — cria/reutiliza instância na Evolution API, retorna QR code, status → `CONNECTING`
- [x] `GET /tenants/:id/integrations/whatsapp/status` — status atual + telefone mascarado, para polling do frontend
- [x] `POST /tenants/:id/integrations/whatsapp/disconnect` — encerra sessão, status → `DISCONNECTED`
- [x] Webhook de confirmação de conexão (Evolution API → Convoca) atualiza `CONNECTED`/`connectedPhoneNumber`
- [x] `evolutionWhatsAppChannel.send` (`src/lib/contact-channel.ts`) refatorado para resolver `TenantIntegration` por `tenantId`, removendo a leitura de `config.EVOLUTION_*` do caminho de envio
- [x] `whatsappWebhookRoutes` (`src/modules/webhook/whatsapp.routes.ts`) ajustado para resolver a instância/tenant de origem sem mudar a assinatura pública `POST /webhooks/whatsapp/:tenantId`
- [x] Teste adversarial de tenant: tenant A não lê/conecta/desconecta a integração de tenant B

### 14.2 — WhatsApp pessoal do recrutador (contato de exibição)

- [x] Migration: campo `phone` (nullable) em `User`
- [x] Novo módulo `src/modules/user/`: `GET /users/me`, `PATCH /users/me` (name/phone), para qualquer papel de empresa autenticado
- [x] Validação de formato de telefone brasileiro no schema Zod do `phone`
- [x] Confirmar que nenhuma chamada à Evolution API é disparada por esse campo — é armazenamento/exposição puro

---

## Riscos e decisões em aberto

| Item | Risco | Mitigação |
| --- | --- | --- |
| Multi-instância na Evolution API | Se a instância self-hosted do projeto não suportar múltiplas sessões simultâneas, o modelo "1 QR code por tenant" desta spec não é viável como desenhado | Spike técnico é a primeira tarefa da sprint, antes de qualquer código de produto — se falhar, a spec precisa ser revisada (ex: fila de instâncias, ou infraestrutura Evolution dedicada por tenant) |
| Armazenamento de `evolutionApiKey` em texto simples | Mesma superfície de risco que hoje (`.env`), mas agora por-tenant no banco em vez de só no servidor | Aceito como débito técnico explícito nesta sprint (ver Spec 14, Decisões técnicas); criptografia em repouso fica para sprint futura |
| Migração de tenants existentes | Tenants criados antes desta sprint não têm `TenantIntegration` | Sem registro = tratado como `DISCONNECTED` por padrão, sem necessidade de backfill |

---

## Arquivos a criar/alterar

```text
rh_inteligente/
├── Convoca/api/specs/
│   └── spec_10.md                              ← Spec 14 (esta sprint)
├── Convoca/api/prisma/
│   ├── schema.prisma                           ← + TenantIntegration, + User.phone
│   └── migrations/                             ← 2 novas migrations
├── Convoca/api/src/
│   ├── lib/contact-channel.ts                  ← evolutionWhatsAppChannel resolve por tenantId
│   ├── modules/tenant/
│   │   ├── tenant-integration.routes.ts        ← connect/status/disconnect
│   │   └── tenant-integration.service.ts
│   ├── modules/user/                           ← novo módulo
│   │   ├── user.routes.ts                      ← GET/PATCH /users/me
│   │   ├── user.service.ts
│   │   └── user.schema.ts
│   └── modules/webhook/
│       └── whatsapp.routes.ts                  ← ajustado para resolver por tenant
└── Convoca/api/.stitch/
    └── admin.md                                ← já escrito (Telas 2 e 2b), fonte da UI-alvo desta sprint
```

## Critérios de aceite (herdados da Spec 14)

- [x] `TenantIntegration` criado via migration, 1:1 com `Tenant`, sem quebrar tenants existentes
- [x] `POST .../connect` retorna QR code e transiciona para `CONNECTING`
- [x] `GET .../status` reflete o estado real, usável via polling
- [x] `POST .../disconnect` encerra a sessão e volta para `DISCONNECTED`
- [x] `evolutionWhatsAppChannel` resolve credenciais por `tenantId`, sem leitura remanescente de `config.EVOLUTION_*` no envio
- [x] Tenant sem integração conectada recebe `503`/`WHATSAPP_NOT_CONFIGURED`
- [x] `GET/PATCH /users/me` funcionam para os quatro papéis de `UserRole`, com validação de `phone`
- [x] Teste adversarial de tenant cobrindo a integração
