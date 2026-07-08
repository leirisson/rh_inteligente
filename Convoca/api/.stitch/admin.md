# Prompts Stitch — Painel de Administração (Configurações)

> Papel: `TENANT_ADMIN` para ações de gerenciar a integração (Telas 1, 2, 4, 5); qualquer
> usuário de empresa autenticado pode **ler** o status do WhatsApp institucional (Tela 2) e
> editar o próprio telefone pessoal (Tela 2b). Ver [design-system.md](design-system.md).
>
> **Status de implementação:** as Telas 1 e 3 são aspiracionais (nenhum endpoint de dados
> gerais do tenant nem de SMTP existe ainda). As **Telas 2, 2b e 4 refletem um backend real e
> já implementado** — os detalhes abaixo (estados, permissões, textos) foram atualizados a
> partir do código em `src/modules/tenant/tenant-integration.{routes,service,schema}.ts`,
> `src/modules/user/` e `src/modules/team/`, não são mais especulação. **Tela 5 continua 100%
> aspiracional** — não existe endpoint de troca de senha nem de sessões/segurança.

## Contrato real da API (Tela 4)

- `GET /tenants/:id/users` — **apenas `TENANT_ADMIN`**. Lista os `User` do tenant
  (`id, name, email, role, phone, createdAt`), ordenados por `createdAt`. Não há campo de
  "último acesso" no schema — omitido da resposta (diferente do mockup original abaixo).
- `POST /tenants/:id/users` — **apenas `TENANT_ADMIN`**. Cria um novo `User` no tenant com
  `{ name, email, password, role }` — a senha é definida diretamente pelo admin no modal de
  convite (sem token/e-mail de ativação; consistente com o padrão de criação do primeiro
  admin em `POST /tenants`). `email` é único globalmente (não só por tenant); conflito
  retorna 409 `EMAIL_TAKEN`.
- `PATCH /tenants/:id/users/:userId/role` — **apenas `TENANT_ADMIN`**. Altera o `role` de um
  membro existente do próprio tenant (`role` como dropdown por linha na tabela, em vez do menu
  ⋮ "Alterar papel" do mockup original). Membro de outro tenant retorna 404.
- **Fora de escopo por enquanto:** remover/desativar acesso de um membro — decisão explícita
  de manter o primeiro ciclo enxuto (listar + convidar + alterar papel); revisável quando
  houver demanda.

## Modelo de WhatsApp com dois níveis

1. **WhatsApp institucional do tenant (com bot):** um único número por tenant, conectado via
   Evolution API/Baileys com QR code e sessão persistente — é o canal que o **agente de IA**
   usa para conversar com candidatos em escala. Implementado em `TenantIntegration` (1:1 com
   `Tenant`), nome de instância determinístico `convoca_${tenantId}` (não expõe nome/e-mail do
   tenant). Configurado/gerenciado pelo `TENANT_ADMIN`; o **status** pode ser lido por qualquer
   usuário autenticado do tenant.
2. **WhatsApp pessoal do recrutador (sem bot):** cada usuário de empresa (qualquer papel:
   `SUPER_ADMIN`/`TENANT_ADMIN`/`RECRUITER`/`DEPARTMENT_LEAD`) tem um campo `phone` no próprio
   perfil, editável via `PATCH /users/me` — puramente um dado de exibição, sem sessão, sem
   automação, sem passar pela Evolution API. Serve para gerar um link `wa.me/<numero>` (ex:
   "falar diretamente com o recrutador" exibido ao candidato após aprovação — a exibição em si
   no lado do candidato é fora de escopo da Spec 14).

## Contrato real da API (Tela 2)

- `POST /tenants/:id/integrations/whatsapp/connect` — **apenas `TENANT_ADMIN`**. Cria a
  instância na Evolution API na primeira vez (`POST /instance/create`) ou reconecta uma
  existente (`GET /instance/connect/:name`); em ambos os casos retorna `{ status, qrCode }`
  com `status: "CONNECTING"`. Também registra o webhook da instância
  (`POST /webhook/set/:name`, eventos `CONNECTION_UPDATE` e `MESSAGES_UPSERT`) apontando para
  `PUBLIC_BASE_URL/webhooks/whatsapp/:tenantId`.
- `GET /tenants/:id/integrations/whatsapp/status` — **qualquer usuário autenticado do
  tenant** (não exige `TENANT_ADMIN`). Retorna `{ status, connectedPhoneNumber }`, lido **só do
  banco local** — nunca chama a Evolution API ao vivo. `connectedPhoneNumber` vem mascarado no
  formato `+55 11 9****-1234`. Sem `TenantIntegration` registrada, retorna
  `status: "DISCONNECTED"` implicitamente (não é um erro).
- `POST /tenants/:id/integrations/whatsapp/disconnect` — **apenas `TENANT_ADMIN`**. Faz
  logout da sessão na Evolution API (`DELETE /instance/logout/:name` — não deleta a instância,
  por isso reconectar depois reaproveita o mesmo nome/QR flow) e zera `connectedPhoneNumber`
  localmente, mesmo que a chamada remota falhe (best-effort — a intenção do usuário de
  desconectar sempre é honrada localmente).
- **Quatro estados possíveis** (`IntegrationStatus`): `DISCONNECTED` (nunca conectado, ou
  desconectado manualmente), `CONNECTING` (QR code emitido, aguardando o candidato escanear),
  `CONNECTED` (sessão ativa — atualizado só via webhook de `connection.update`, nunca pela
  resposta direta de `connect`), `ERROR` (a integração perdeu a conexão de forma anômala,
  distinto de uma desconexão manual). Não há polling automático server-side nem timeout de QR
  expirado nesta versão — se o candidato não escanear, o status fica preso em `CONNECTING`
  indefinidamente (comportamento conhecido, não um bug a esconder na UI).
- Sem integração configurada: `evolutionWhatsAppChannel` falha com `503`/`WHATSAPP_NOT_CONFIGURED`
  ao tentar enviar mensagem — mesmo contrato de erro de antes da Spec 14, agora por tenant.

## Contrato real da API (Tela 2b)

- `GET /users/me` / `PATCH /users/me` — qualquer papel de empresa autenticado. Corpo de
  atualização aceita `name`/`phone`. Nenhuma chamada à Evolution API é disparada por este
  endpoint.

---

## 1. Configurações — Visão Geral

> ⚠️ Aspiracional — não existe endpoint de dados gerais do tenant (razão social, plano) na
> API hoje. Útil como shell de navegação para as demais telas.

```
Tela de configurações administrativas de um SaaS B2B, painel central de onde o admin do
tenant acessa integrações, usuários da equipe e dados da empresa.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, desktop-first
- Palette: Indigo profundo #4F46E5, Off-white #F8FAFC, Slate escuro #0F172A
- Styles: Layout de duas colunas — sidebar de navegação interna + conteúdo, cards rounded-xl

**PAGE STRUCTURE:**
1. **Header:** Barra de navegação superior igual às demais telas do recrutador (logo,
   Vagas/Candidatos/Entrevistas/Configurações destacado como ativo).
2. **Hero/Resumo:** Nenhum.
3. **Primary Content Area:** Layout de duas colunas.
   - Sidebar interna de configurações: itens de menu "Geral", "Integrações" (WhatsApp
     Institucional/E-mail), "Equipe", "Segurança".
   - Conteúdo da seção "Geral": card com nome do tenant, campo de razão social, e um resumo
     em texto discreto do plano atual.
4. **Footer:** Nenhum.
```

---

## 2. Integrações — Conexão WhatsApp Institucional (Evolution API, com bot)

> ✅ Backend implementado — ver "Contrato real da API (Tela 2)" acima.

```
Tela de conexão do WhatsApp institucional da empresa, dentro do painel de configurações de um
SaaS de recrutamento. Este é o número único usado pelo agente de IA para conversar com
candidatos em escala — conectado via QR code, no mesmo padrão de apps como WhatsApp Web/
Zap/CRM que integram Baileys/Evolution API. Fluxo deve deixar claro que é uma conexão de
sessão persistente (não uma credencial digitada), e que o status só é atualizado quando o
servidor recebe confirmação (não há "verificação ao vivo" instantânea).

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, desktop-first
- Palette: Verde esmeralda #10B981 (conectado), Âmbar #F59E0B (aguardando leitura do QR code),
  Vermelho #EF4444 (desconectado/erro), Indigo profundo #4F46E5 (ações)
- Styles: Card de status grande no topo com indicador circular pulsante; estado "conectando"
  mostra um card central com o QR code em destaque (moldura branca, rounded-xl, sombra
  floating)

**PAGE STRUCTURE:**
1. **Header:** Breadcrumb "Configurações / Integrações", título "WhatsApp Institucional".
2. **Hero/Resumo:** Card de status destacado no topo com quatro estados possíveis (mostrar o
   estado "Conectado" como principal, mas descrever os quatro):
   - **Conectado (verde):** número conectado mascarado (ex: "+55 11 9****-1234"), botão
     secundário vermelho "Desconectar" — visível apenas para `TENANT_ADMIN`; demais papéis veem
     o card em modo somente leitura.
   - **Aguardando conexão (âmbar):** QR code grande centralizado, texto "Abra o WhatsApp no
     celular da empresa → Aparelhos conectados → Escanear código", nota discreta "Isso pode
     levar alguns instantes para refletir após escanear" (o frontend deve fazer polling
     periódico de `GET .../status`, já que não há push em tempo real).
   - **Desconectado (cinza/âmbar neutro):** texto "Nenhuma conexão ativa", botão primário
     pill-shaped "Conectar WhatsApp" (apenas `TENANT_ADMIN`) que dispara o fluxo de QR code.
   - **Erro (vermelho):** ícone de alerta, texto curto indicando perda de conexão anômala,
     mesmo botão "Conectar WhatsApp" para reiniciar o fluxo.
3. **Primary Content Area:**
   - Card "Sobre esta conexão": explica que este número é usado pelo agente de IA para
     contatar candidatos automaticamente, e que é compartilhado por toda a empresa (não é o
     WhatsApp pessoal de nenhum recrutador — link para a Tela 2b).
   - Card "Canal de fallback": explica que, se o WhatsApp falhar para um candidato específico
     (sem número cadastrado ou sessão caiu), o sistema tenta e-mail automaticamente — com link
     para a seção de e-mail (Tela 3, aspiracional).
4. **Footer:** Nenhum.
```

---

## 2b. Perfil do Recrutador — WhatsApp Pessoal (contato de exibição, sem bot)

> ✅ Backend implementado — `GET/PATCH /users/me`.

```
Seção dentro do perfil individual de qualquer usuário de empresa (admin, recrutador ou líder
de setor — não é exclusivo de "recrutador"), onde ele cadastra seu próprio número de WhatsApp
apenas como contato de exibição — sem nenhuma conexão/bot, é só um dado de perfil usado para
gerar um link direto de conversa.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, desktop-first
- Palette: Indigo profundo #4F46E5, Off-white #F8FAFC
- Styles: Card simples rounded-xl dentro da página "Meu Perfil", sem indicador de
  status/conexão (deixar claro visualmente que isso não é uma integração)

**PAGE STRUCTURE:**
1. **Header:** (herda o header de "Meu Perfil" — não é uma página própria).
2. **Hero/Resumo:** Nenhum.
3. **Primary Content Area:** Card "Contato" com: avatar/nome/e-mail do usuário (readonly),
   input de telefone rotulado "WhatsApp pessoal (opcional)" com máscara de formato brasileiro,
   texto de apoio discreto: "Exibido para candidatos aprovados como contato direto — não é
   usado pelo agente de IA nem requer conexão". Preview inline de como o botão aparecerá para
   o candidato: um chip "Falar com {nome} no WhatsApp" com ícone.
4. **Footer:** Botão primário pill-shaped "Salvar".
```

---

## 3. Integrações — Conexão E-mail (SMTP)

> ⚠️ Aspiracional — `SMTP_*` continua sendo env var global do processo (`src/config/index.ts`),
> sem `TenantIntegration` equivalente para e-mail. Diferente da Tela 2, esta tela não tem
> nenhum endpoint por trás; mantida como painel de status/diagnóstico da configuração global
> do servidor, não como fluxo de conexão self-service.

```
Tela de status de integração de e-mail (SMTP/Nodemailer) dentro do painel de configurações,
espelhando o mesmo padrão visual da tela de WhatsApp para consistência, mas deixando claro que
é uma configuração de servidor, não uma conexão self-service.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, desktop-first
- Palette: Verde esmeralda #10B981 (conectado), Âmbar #F59E0B (não configurado), Vermelho
  #EF4444 (erro), Indigo profundo #4F46E5 (ações)
- Styles: Mesmo padrão de card de status da tela de WhatsApp, rounded-xl

**PAGE STRUCTURE:**
1. **Header:** Breadcrumb "Configurações / Integrações", título "E-mail (SMTP)".
2. **Hero/Resumo:** Card de status destacado: indicador circular + texto de status
   ("Conectado" / "Não configurado" / "Erro de autenticação"), endereço de remetente
   configurado (ex: "Convoca <no-reply@convoca.app>"), botão secundário "Enviar e-mail de
   teste".
3. **Primary Content Area:**
   - Card "Uso do e-mail": explica os dois usos — (1) fallback de contato com candidatos
     quando não há WhatsApp cadastrado, (2) notificação de recrutadores/admins quando um
     candidato é aprovado na triagem.
   - Card "Últimos e-mails enviados": mini-lista de log recente (destinatário, assunto,
     horário, ícone de sucesso/falha).
4. **Footer:** Nota discreta: "Credenciais de e-mail são configuradas pela equipe técnica no
   ambiente do servidor."
```

---

## 4. Equipe — Usuários e Papéis

> ✅ Backend implementado — ver "Contrato real da API (Tela 4)" acima. Diferenças em relação
> ao mockup original abaixo: sem coluna de "último acesso" (não existe esse dado no schema),
> "Alterar papel" é um dropdown inline por linha em vez de um menu ⋮, e não há ação de
> "Remover acesso" nesta primeira versão.

```
Tela de gestão de usuários da empresa dentro do painel administrativo, para o TENANT_ADMIN
controlar quem tem acesso e com qual papel (RBAC).

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, desktop-first
- Palette: Indigo profundo #4F46E5, Off-white #F8FAFC
- Styles: Tabela limpa com linhas espaçadas, badges de papel coloridos, rounded-xl nos
  containers

**PAGE STRUCTURE:**
1. **Header:** Breadcrumb "Configurações / Equipe", botão primário pill-shaped "+ Convidar
   membro" no canto superior direito.
2. **Hero/Resumo:** Nenhum.
3. **Primary Content Area:** Tabela de usuários do tenant com colunas: nome, e-mail, badge de
   papel (SUPER_ADMIN roxo / TENANT_ADMIN indigo / RECRUITER azul / DEPARTMENT_LEAD slate),
   telefone pessoal (se cadastrado, ver Tela 2b), e dropdown inline para alterar o papel.
   Modal de convite (ao clicar em "+ Convidar membro") com campos nome, e-mail, senha
   provisória e dropdown de papel.
4. **Footer:** Nenhum.
```

---

## 5. Segurança — Sessão e Credenciais

> ⚠️ Aspiracional — não existe endpoint de troca de senha nem de listagem/encerramento de
> sessões. Autenticação hoje é apenas login/refresh (`src/modules/auth/`), sem refresh tokens
> nomeados por dispositivo/sessão.

```
Tela de segurança da conta do admin dentro do painel de configurações, para troca de senha e
visão de sessões ativas.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, desktop-first
- Palette: Indigo profundo #4F46E5, Vermelho #EF4444 (ação destrutiva "encerrar sessão")
- Styles: Cards seccionados rounded-xl, formulário simples

**PAGE STRUCTURE:**
1. **Header:** Breadcrumb "Configurações / Segurança".
2. **Hero/Resumo:** Nenhum.
3. **Primary Content Area:**
   - Card "Alterar senha": campos senha atual, nova senha, confirmar nova senha, botão
     primário "Atualizar senha".
   - Card "Sessões ativas": lista simples de sessões (dispositivo/navegador inferido,
     localização aproximada, "esta sessão" destacada), botão ghost vermelho "Encerrar" por
     linha e botão "Encerrar todas as outras sessões".
4. **Footer:** Nenhum.
```
