# Prompts Stitch — Painel de Administração (Configurações)

> Papel: `TENANT_ADMIN` para as Telas 1, 2, 3, 4, 5. A Tela 2b é referência para o `RECRUITER`
> dentro do próprio perfil (não requer papel de admin). Ver [design-system.md](design-system.md).
>
> **Modelo de WhatsApp com dois níveis (confirmado com o usuário):**
>
> 1. **WhatsApp institucional do tenant (com bot):** um único número conectado via Evolution
>    API/Baileys, com QR code e sessão persistente — é o canal que o **agente de IA** usa para
>    conversar com candidatos em escala. Configurado uma vez pelo `TENANT_ADMIN` na tela de
>    Integrações (Tela 2 abaixo).
> 2. **WhatsApp pessoal do recrutador (sem bot):** cada recrutador pode cadastrar seu próprio
>    número no perfil, como **contato de exibição apenas** — sem sessão, sem automação, sem
>    passar pela Evolution API. Serve para gerar um link `wa.me/<numero>` (ex: "falar
>    diretamente com o recrutador" exibido ao candidato após aprovação). Isso é um campo de
>    perfil de usuário, não uma integração — não tem card de status/conexão, só um input de
>    telefone validado.
>
> **⚠️ Lacuna de backend a ter em mente ao implementar o frontend depois:** hoje
> `EVOLUTION_API_URL/KEY/INSTANCE_NAME`, `EVOLUTION_WEBHOOK_SECRET` e `SMTP_*`
> (`src/config/index.ts`) são env vars **globais do processo**, lidas uma vez no boot — não há
> `TenantIntegration` no schema Prisma nem endpoints de conexão/QR code, e o model `User` não
> tem campo de telefone. Para a Tela 2 (institucional) funcionar de verdade é necessário: (a)
> tabela `TenantIntegration` (ou campos em `Tenant`) guardando instância/token da Evolution API
> por tenant; (b) endpoints `POST /tenants/:id/integrations/whatsapp/connect` (retorna QR code),
> `GET .../status`, `POST .../disconnect`; (c) `evolutionWhatsAppChannel` passaria a resolver a
> instância por tenant em vez de `config.EVOLUTION_*` global. Para o telefone pessoal do
> recrutador (Tela 2b) basta um campo `phone` em `User` + endpoint `PATCH /users/me`. Nenhum
> desses existe ainda — as telas abaixo antecipam essa UI para guiar o desenvolvimento
> subsequente do backend.

---

## 1. Configurações — Visão Geral

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

```
Tela de conexão do WhatsApp institucional da empresa, dentro do painel de configurações de um
SaaS de recrutamento. Este é o número único usado pelo agente de IA para conversar com
candidatos em escala — conectado via QR code, no mesmo padrão de apps como WhatsApp Web/
Zap/CRM que integram Baileys/Evolution API. Fluxo deve deixar claro que é uma conexão de
sessão persistente (não uma credencial digitada).

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, desktop-first
- Palette: Verde esmeralda #10B981 (conectado), Âmbar #F59E0B (aguardando leitura do QR code),
  Vermelho #EF4444 (desconectado/erro), Indigo profundo #4F46E5 (ações)
- Styles: Card de status grande no topo com indicador circular pulsante; estado "conectando"
  mostra um card central com o QR code em destaque (moldura branca, rounded-xl, sombra
  floating)

**PAGE STRUCTURE:**
1. **Header:** Breadcrumb "Configurações / Integrações", título "WhatsApp Institucional".
2. **Hero/Resumo:** Card de status destacado no topo com três estados possíveis (mostrar o
   estado "Conectado" como principal, mas descrever os três):
   - **Conectado:** indicador verde, número conectado mascarado (ex: "+55 11 9****-1234"),
     nome do dispositivo/sessão, botão secundário vermelho "Desconectar".
   - **Aguardando conexão:** QR code grande centralizado, texto "Abra o WhatsApp no celular da
     empresa → Aparelhos conectados → Escanear código", spinner discreto indicando polling
     automático de status.
   - **Desconectado/erro:** ícone de alerta âmbar, botão primário pill-shaped "Conectar
     WhatsApp" que abre o estado de QR code.
3. **Primary Content Area:**
   - Card "Sobre esta conexão": explica que este número é usado pelo agente de IA para
     contatar candidatos automaticamente, e que é compartilhado por toda a empresa (não é o
     WhatsApp pessoal de nenhum recrutador).
   - Card "Canal de fallback": explica que, se o WhatsApp falhar para um candidato específico
     (sem número cadastrado ou sessão caiu), o sistema tenta e-mail automaticamente — com link
     para a seção de e-mail.
   - Card "Últimas mensagens enviadas": mini-lista de log recente (candidato, canal usado,
     horário, ícone de sucesso/falha) para diagnóstico rápido.
4. **Footer:** Nenhum.
```

---

## 2b. Perfil do Recrutador — WhatsApp Pessoal (contato de exibição, sem bot)

```
Seção dentro do perfil individual de um recrutador (não da tela de Integrações do tenant),
onde ele cadastra seu próprio número de WhatsApp apenas como contato de exibição — sem
nenhuma conexão/bot, é só um dado de perfil usado para gerar um link direto de conversa.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, desktop-first
- Palette: Indigo profundo #4F46E5, Off-white #F8FAFC
- Styles: Card simples rounded-xl dentro da página "Meu Perfil", sem indicador de
  status/conexão (deixar claro visualmente que isso não é uma integração)

**PAGE STRUCTURE:**
1. **Header:** (herda o header de "Meu Perfil" do recrutador — não é uma página própria).
2. **Hero/Resumo:** Nenhum.
3. **Primary Content Area:** Card "Contato" com: avatar/nome/e-mail do recrutador (readonly),
   input de telefone rotulado "WhatsApp pessoal (opcional)" com máscara de formato brasileiro,
   texto de apoio discreto: "Exibido para candidatos aprovados como contato direto — não é
   usado pelo agente de IA nem requer conexão". Preview inline de como o botão aparecerá para
   o candidato: um chip "Falar com {nome} no WhatsApp" com ícone.
4. **Footer:** Botão primário pill-shaped "Salvar".
```

---

## 3. Integrações — Conexão E-mail (SMTP)

```
Tela de status de integração de e-mail (SMTP/Nodemailer) dentro do painel de configurações,
espelhando o mesmo padrão visual da tela de WhatsApp para consistência.

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
4. **Footer:** Mesma nota discreta sobre configuração via ambiente do servidor.
```

---

## 4. Equipe — Usuários e Papéis

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
   data de último acesso, e menu de ações (⋮) com "Alterar papel" e "Remover acesso". Modal de
   convite (ao clicar em "+ Convidar membro") com campos nome, e-mail e dropdown de papel.
4. **Footer:** Nenhum.
```

---

## 5. Segurança — Sessão e Credenciais

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
