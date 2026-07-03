# Prompts Stitch — Portal do Candidato

> Sem `tenant_id`, autenticação própria (`type: "candidate"` no JWT). Ver
> [design-system.md](design-system.md). Fontes: `src/modules/candidate`.

---

## 1. Cadastro / Login

```
Tela de autenticação para candidatos de uma plataforma de recrutamento com IA, transmitindo
simplicidade e confiança logo no primeiro contato — o candidato está se cadastrando para ser
contatado proativamente por um agente de IA via WhatsApp.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, mobile-first
- Palette: Indigo profundo #4F46E5 (CTA), Off-white #F8FAFC (fundo), Violeta #8B5CF6 (toques
  de destaque relacionados a "IA")
- Styles: Cantos muito arredondados (rounded-xl), formulário centralizado com bastante
  whitespace, ilustração/ícone sutil relacionado a "match" ou "conversa"

**PAGE STRUCTURE:**
1. **Header:** Logo "Convoca" centralizado no topo, sem menu de navegação (tela de auth
   isolada).
2. **Hero Section:** Headline curta ("Encontre a vaga certa, sem enviar um currículo sequer")
   e subtexto explicando que um agente de IA vai conversar com o candidato via WhatsApp.
3. **Primary Content Area:** Card central com abas "Criar conta" / "Entrar". Formulário de
   cadastro: nome, e-mail, senha, campo de upload/colagem de texto do currículo (textarea
   grande rotulada "Cole seu currículo ou experiência"). Botão primário pill-shaped
   "Criar minha conta". Formulário de login: e-mail e senha, link "Esqueci minha senha".
4. **Footer:** Links discretos de Termos de Uso e Privacidade.
```

---

## 2. Minhas Candidaturas

```
Área logada do candidato mostrando o andamento de suas candidaturas em diferentes empresas,
com foco em transparência sobre em que fase está cada processo conduzido por IA.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, mobile-first
- Palette: Indigo profundo #4F46E5, badges semânticos por status (verde/âmbar/vermelho)
- Styles: Cards empilhados verticalmente (mobile) com rounded-xl e sombra whisper-soft,
  step indicator horizontal por card

**PAGE STRUCTURE:**
1. **Header:** Barra superior simples com logo, saudação "Olá, {nome}" e ícone de acesso ao
   perfil/configurações de contato (WhatsApp/e-mail cadastrados).
2. **Hero/Resumo:** Nenhum hero — vai direto para a lista, com um contador simples "Você tem
   3 candidaturas em andamento" no topo.
3. **Primary Content Area:** Lista vertical de cards de candidatura, um por vaga. Cada card
   mostra: nome da empresa, título da vaga, um step indicator horizontal (Contato →
   Triagem → Decisão → Entrevista) destacando a fase atual, e badge de status. Se houver
   entrevista agendada, mostra um mini card inline com data/horário. Estado vazio (nenhuma
   candidatura) com ilustração simples e texto "Assim que você for compatível com uma vaga,
   nosso agente vai entrar em contato".
4. **Footer:** Nenhum.
```

---

## 3. Perfil e Métodos de Contato

```
Tela de perfil do candidato para gerenciar dados pessoais, currículo e métodos de contato
(WhatsApp/e-mail) usados pelo agente de IA para triagem.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, mobile-first
- Palette: Indigo profundo #4F46E5, Off-white #F8FAFC
- Styles: Formulário seccionado em cards rounded-xl, lista de métodos de contato com ícone
  por canal e botão de remoção discreto

**PAGE STRUCTURE:**
1. **Header:** Botão de voltar, título "Meu Perfil".
2. **Hero/Resumo:** Nenhum.
3. **Primary Content Area:**
   - Card "Dados pessoais": nome, e-mail, textarea de currículo/experiência editável.
   - Card "Métodos de contato": lista de métodos já cadastrados (ícone WhatsApp ou e-mail +
     valor + botão remover), botão ghost "+ Adicionar método de contato" que expande um
     mini-formulário inline (dropdown de canal + campo de valor). Nota de apoio: "Cadastre ao
     menos um método de contato para que o agente possa falar com você" (o backend falha alto
     se não houver nenhum ao tentar contatar).
4. **Footer:** Botão primário pill-shaped "Salvar alterações", fixo na parte inferior em
   mobile (sticky footer).
```

---

## 4. Conversa de Triagem (visão do candidato)

```
Tela de chat, do ponto de vista do candidato, para responder as perguntas de triagem do
agente de IA — espelha visualmente uma conversa de WhatsApp, já que esse é o canal principal.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, mobile-first (deve parecer natural também como fallback do WhatsApp nativo)
- Palette: Indigo profundo #4F46E5 (bolhas do candidato), Violeta #8B5CF6 (bolhas do agente),
  Off-white #F8FAFC (fundo do chat)
- Styles: Bolhas de chat bem arredondadas (rounded-xl), input fixo na parte inferior

**PAGE STRUCTURE:**
1. **Header:** Barra fixa no topo com nome da vaga e empresa, ícone do "Agente Convoca"
   (avatar com indicador de IA), botão de voltar.
2. **Hero/Resumo:** Nenhum.
3. **Primary Content Area:** Histórico de conversa em bolhas — mensagens do agente à esquerda
   (violeta claro) incluindo a pergunta de triagem atual, mensagens do candidato à direita
   (indigo), indicador de "digitando..." quando o agente está processando uma resposta.
4. **Footer:** Barra de input fixa na parte inferior com campo de texto e botão de enviar
   circular (ícone de seta), estilo nativo de app de mensagens.
```
