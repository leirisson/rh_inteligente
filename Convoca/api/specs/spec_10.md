# Spec 14 — WhatsApp Institucional Multi-Tenant e Contato Pessoal do Recrutador

## Contexto

Desde a Spec 09, a integração com WhatsApp (`evolutionWhatsAppChannel`, `src/lib/contact-channel.ts`) usa uma única instância da Evolution API configurada globalmente via env vars do processo (`EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE_NAME`, `EVOLUTION_WEBHOOK_SECRET` em `src/config/index.ts`) — lidas uma vez no boot do servidor, compartilhadas por todos os tenants. Isso significa que hoje **não existe forma de um tenant conectar seu próprio número de WhatsApp pela UI**; qualquer troca de número exige alterar env vars e reiniciar o processo, e todos os tenants da plataforma dividem a mesma sessão.

Esta spec introduz dois conceitos novos, desenhados junto com os mockups de frontend em `Convoca/api/.stitch/admin.md`:

1. **WhatsApp institucional por tenant** — cada tenant conecta seu próprio número via QR code (Evolution API/Baileys), com sessão persistente. É o canal usado pelo agente de IA (`runScreeningAgent`) para contatar candidatos em escala. Substitui as env vars globais por credenciais armazenadas por tenant.
2. **WhatsApp pessoal do recrutador** — um campo de telefone no perfil de cada `User`, puramente de exibição (gera um link `wa.me/<numero>`), sem qualquer conexão com a Evolution API. Não passa pelo agente, não tem sessão, não tem "status".

## Escopo

- Novo model `TenantIntegration` (1:1 com `Tenant`) para credenciais da Evolution API por tenant.
- Endpoints de conexão/status/desconexão do WhatsApp institucional, incluindo geração de QR code.
- `evolutionWhatsAppChannel` refatorado para resolver instância/token por `tenantId` em vez de `config.EVOLUTION_*` global.
- Campo `phone` em `User` + endpoint de atualização de perfil próprio.
- **Fora de escopo:** implementação real do handshake com a Evolution API para emitir o QR code (depende de uma instância Evolution API configurável dinamicamente, não apenas single-instance) — esta spec cobre o contrato de API e o armazenamento; a chamada real à Evolution API para criar instâncias dinamicamente é detalhada como ponto em aberto (ver Decisões técnicas).

## Requisitos funcionais

### 14.1 — WhatsApp institucional por tenant

1. Model `TenantIntegration`: `tenantId` (1:1, FK para `Tenant`), `evolutionInstanceName`, `evolutionApiKey` (armazenado com o mesmo cuidado de segredo que `passwordHash` — nunca retornado em texto puro nas respostas de API), `status` (enum `IntegrationStatus`: `DISCONNECTED | CONNECTING | CONNECTED | ERROR`), `connectedPhoneNumber` (mascarado nas respostas, ex: `+55 11 9****-1234`), `lastConnectedAt`, `lastErrorMessage`.
2. `POST /tenants/:id/integrations/whatsapp/connect` (papel `TENANT_ADMIN`): cria (ou reutiliza) uma instância na Evolution API para o tenant, transiciona `status` para `CONNECTING`, retorna o QR code (base64 ou URL temporária) para o frontend exibir.
3. `GET /tenants/:id/integrations/whatsapp/status` (qualquer usuário autenticado do tenant): retorna o `status` atual e `connectedPhoneNumber` mascarado — usado pelo frontend para polling durante o estado `CONNECTING` (ver Tela 2 de `admin.md`, que descreve esse polling).
4. `POST /tenants/:id/integrations/whatsapp/disconnect` (papel `TENANT_ADMIN`): encerra a sessão na Evolution API e transiciona `status` para `DISCONNECTED`.
5. Webhook de confirmação de conexão (Evolution API notifica quando o QR code é escaneado com sucesso) atualiza `status` para `CONNECTED` e preenche `connectedPhoneNumber`/`lastConnectedAt`. Reaproveita o padrão de verificação de segredo já usado em `whatsapp.routes.ts` (`verifyWebhookSecret`), mas por tenant em vez de global.
6. `evolutionWhatsAppChannel.send` passa a buscar `TenantIntegration` pelo `tenantId` da `Application` em vez de ler `config.EVOLUTION_*`. Se não houver `TenantIntegration` com `status: CONNECTED` para o tenant, falha com `503` e código `WHATSAPP_NOT_CONFIGURED` — mesmo contrato de erro já existente hoje, só que o motivo passa a ser por-tenant em vez de global.
7. `whatsappWebhookRoutes` (mensagens inbound de candidatos, já existente) passa a resolver qual `TenantIntegration`/instância originou a mensagem, mantendo a rota `POST /webhooks/whatsapp/:tenantId` já existente (sem mudança de assinatura).

### 14.2 — WhatsApp pessoal do recrutador (contato de exibição)

8. Campo `phone` (nullable) em `User`, validado como formato de telefone brasileiro no schema Zod (mesma abordagem de `contact-methods` do candidato).
9. `PATCH /users/me` (novo endpoint, qualquer papel de empresa autenticado): atualiza `name`/`phone` do próprio usuário. Não existe endpoint de "meu perfil" para usuários de empresa hoje — só `candidateRoutes` tem `/me`.
10. `GET /users/me`: retorna os dados do usuário autenticado, incluindo `phone`.
11. Este campo **não** aciona nenhuma chamada à Evolution API e não tem conceito de "status" — é apenas armazenado e exposto para o frontend montar o link `wa.me/<phone>` a ser exibido ao candidato (ex: tela de "candidato aprovado", fora de escopo desta spec implementar essa exibição no lado do candidato).

## Decisões técnicas

| Item | Escolha |
| --- | --- |
| Armazenamento de credenciais | `TenantIntegration.evolutionApiKey` guardado em texto simples no banco nesta primeira versão (mesma superfície de risco que `EVOLUTION_API_KEY` em `.env` hoje) — criptografia em repouso (`pgcrypto` ou KMS externo) fica como débito técnico explícito, não bloqueia esta spec |
| Criação dinâmica de instância na Evolution API | A Evolution API precisa suportar múltiplas instâncias nomeadas por tenant (`evolutionInstanceName` único por tenant) rodando no mesmo servidor Evolution — **não validado ainda** contra a instância real; primeira sprint desta spec deve incluir um spike técnico confirmando que a Evolution API self-hosted do projeto suporta esse modelo antes de implementar os 3 endpoints |
| Migração dos tenants existentes | Tenants criados antes desta spec não têm `TenantIntegration` — tratados como `DISCONNECTED` por padrão (ausência de registro = desconectado), sem migração de dados necessária |
| `phone` do recrutador vs. `ContactMethod` do candidato | Deliberadamente **não** reaproveita o model `ContactMethod` (que é específico de `Candidate` e pensado para múltiplos métodos) — é um campo simples em `User`, pois o recrutador só precisa de um número de exibição, não de uma lista de canais |
| Rota de perfil de usuário de empresa | `PATCH/GET /users/me` como novo módulo `src/modules/user/`, espelhando o padrão já usado em `candidateRoutes` (`/me`) |

## Critérios de aceite

- [ ] `TenantIntegration` criado via migration, 1:1 com `Tenant`, sem quebrar tenants existentes
- [ ] `POST /tenants/:id/integrations/whatsapp/connect` retorna QR code e transiciona para `CONNECTING`
- [ ] `GET /tenants/:id/integrations/whatsapp/status` reflete o estado real, usável via polling
- [ ] `POST /tenants/:id/integrations/whatsapp/disconnect` encerra a sessão e volta para `DISCONNECTED`
- [ ] `evolutionWhatsAppChannel` resolve credenciais por `tenantId`, sem nenhuma leitura remanescente de `config.EVOLUTION_*` no caminho de envio
- [ ] Tenant sem integração conectada recebe `503`/`WHATSAPP_NOT_CONFIGURED` ao tentar enviar (mesmo contrato de erro de hoje)
- [ ] `GET/PATCH /users/me` funcionam para os quatro papéis de `UserRole`, incluindo validação de formato de `phone`
- [ ] Teste adversarial de tenant: tenant A não consegue ler/conectar/desconectar a integração de tenant B

## Fora de escopo

- Handshake real e testado ponta-a-ponta contra uma Evolution API self-hosted multi-instância em produção — depende do spike técnico citado nas Decisões técnicas
- Criptografia em repouso de `evolutionApiKey`
- Exibição do link `wa.me/<phone>` do recrutador na experiência do candidato (portal do candidato) — a spec cobre apenas o armazenamento/exposição do dado pela API
- Múltiplos números de WhatsApp institucionais por tenant (ex: um por departamento) — apenas 1:1 tenant↔integração nesta versão
- Reconexão automática em caso de queda de sessão — reconexão manual (usuário clica "Conectar" de novo) é suficiente por ora
