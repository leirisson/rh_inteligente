# Prompts Stitch — Painel do Recrutador

> Papéis: `TENANT_ADMIN`, `RECRUITER`. Ver [design-system.md](design-system.md) — a Tela 1
> abaixo deve ser gerada primeiro para fixar o design system do projeto inteiro.
> Fontes: `src/modules/job`, `src/modules/job-requirement`, `src/modules/screening-question`,
> `src/modules/matching`, `src/modules/application` (+ `funnel`), `src/modules/interview`.

---

## 1. Dashboard de Vagas

```
Dashboard principal de um SaaS de recrutamento B2B, para um recrutador ou admin de empresa
gerenciar suas vagas ativas. Tom sofisticado e confiável, transmitindo que um agente de IA
está trabalhando em segundo plano — sem parecer "robótico" ou frio.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, desktop-first
- Palette: Indigo profundo #4F46E5 (ação primária), Off-white #F8FAFC (fundo), Slate escuro
  #0F172A (texto principal), Violeta #8B5CF6 (destaque de atividade da IA)
- Styles: Cantos suavemente arredondados (rounded-xl), sombras whisper-soft, cards com
  bastante whitespace interno

**PAGE STRUCTURE:**
1. **Header:** Barra de navegação superior fixa com logo "Convoca" à esquerda, itens de menu
   (Vagas, Candidatos, Entrevistas, Configurações — este último visível apenas para
   TENANT_ADMIN), avatar do usuário com dropdown à direita.
2. **Hero/Resumo:** Faixa de KPIs horizontais logo abaixo do header: total de vagas ativas,
   total de candidaturas no funil, entrevistas agendadas essa semana, taxa média de resposta
   dos candidatos — cada um em um card compacto com número grande e label pequeno.
3. **Primary Content Area:** Grid responsivo de cards de vaga (2-3 colunas). Cada card mostra:
   título da vaga, badge de status (DRAFT cinza / ACTIVE verde / PAUSED âmbar / CLOSED slate),
   contagem de candidatos no funil, um mini indicador "Agente IA ativo" com ícone pulsante
   quando a vaga está ACTIVE, e botão ghost "Ver funil". Botão primário pill-shaped "+ Nova
   Vaga" fixo no canto superior direito da área de conteúdo.
4. **Footer:** Minimalista, apenas copyright e link de suporte.
```

---

## 2. Criar/Editar Vaga (com Requisitos e Perguntas de Triagem)

```
Formulário de criação/edição de vaga em múltiplas seções, para um recrutador definir o
conteúdo que o agente de IA vai usar tanto para o matching por similaridade quanto para a
triagem conversacional via WhatsApp.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, desktop-first
- Palette: Indigo profundo #4F46E5, Off-white #F8FAFC, Violeta #8B5CF6 para dicas relacionadas
  à IA
- Styles: Formulário seccionado em cards rounded-xl com steps/tabs, inputs com bordas sutis

**PAGE STRUCTURE:**
1. **Header:** Breadcrumb "Vagas / Nova Vaga", com step indicator horizontal: "Informações" →
   "Requisitos" → "Perguntas de Triagem" → "Revisão".
2. **Hero/Resumo:** Texto de apoio curto explicando que cada requisito vira um embedding usado
   no matching semântico.
3. **Primary Content Area:**
   - Seção "Informações": inputs de título e textarea de descrição da vaga.
   - Seção "Requisitos" (job-requirements): lista editável de requisitos em texto livre (ex:
     "3+ anos com Node.js"), cada um em uma linha com botão remover; botão ghost "+ Adicionar
     requisito"; nota lateral em violeta "🤖 Cada requisito é usado pelo agente para calcular
     compatibilidade com candidatos".
   - Seção "Perguntas de Triagem" (screening-questions): lista editável de perguntas que o
     agente fará via WhatsApp, cada linha com campo de pergunta + toggle "resposta esperada
     definida" (que revela um campo extra de resposta-modelo) + botão remover; botão ghost
     "+ Adicionar pergunta".
4. **Footer:** Ações fixas: botão ghost "Salvar rascunho" e botão primário pill-shaped
   "Publicar vaga" (que muda status para ACTIVE e dispara o agente).
```

---

## 3. Funil de Candidaturas (Kanban)

```
Tela de funil de candidaturas para uma vaga específica, em formato Kanban, permitindo ao
recrutador visualizar rapidamente em que fase cada candidato está no processo seletivo
conduzido por um agente de IA via WhatsApp.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, desktop-first
- Palette: Indigo profundo #4F46E5, Off-white #F8FAFC, badges semânticos (verde sucesso,
  âmbar aguardando, vermelho reprovado)
- Styles: Colunas com fundo levemente destacado do canvas, cards de candidato com sombra
  whisper-soft e rounded-xl

**PAGE STRUCTURE:**
1. **Header:** Breadcrumb "Vagas / Desenvolvedor Backend Sênior / Funil", com badge de status
   da vaga (ACTIVE) ao lado do título, e botão secundário "Pausar vaga".
2. **Hero/Resumo:** Sub-header com contagem total de candidaturas e um botão de filtro por
   data/canal de contato (WhatsApp/E-mail).
3. **Primary Content Area:** Board Kanban horizontal com colunas: "Aguardando Contato",
   "Em Triagem" (conversando com o agente), "Aprovado", "Entrevista Agendada", "Reprovado".
   Cada card de candidato mostra: nome, avatar/iniciais, score de compatibilidade (ex: "87%
   match"), ícone do canal de contato usado (WhatsApp verde ou envelope), e há quanto tempo
   está naquela fase. Cards em "Em Triagem" têm um indicador sutil de "agente conversando"
   (três pontinhos animados/ícone de chat).
4. **Footer:** Nenhum, tela é full-height de trabalho.
```

---

## 4. Conversa de Triagem (Detalhe do Candidato)

```
Painel de detalhe de um candidato específico dentro do funil, mostrando o histórico completo
da conversa de triagem conduzida pelo agente de IA, para o recrutador auditar/acompanhar sem
precisar intervir.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, desktop-first, layout de duas colunas
- Palette: Indigo profundo #4F46E5, Violeta #8B5CF6 para mensagens do agente, Off-white
  #F8FAFC para mensagens do candidato
- Styles: Bolhas de chat rounded-xl, painel lateral com cards de informação bem espaçados

**PAGE STRUCTURE:**
1. **Header:** Breadcrumb de volta ao funil, nome do candidato, badge de status atual da
   candidatura, botões de ação "Aprovar manualmente" / "Reprovar" / "Agendar entrevista".
2. **Hero/Resumo:** Nenhum — vai direto para o layout de duas colunas.
3. **Primary Content Area:**
   - Coluna esquerda (2/3 da largura): histórico de conversa estilo chat do WhatsApp, bolhas
     do agente (fundo violeta claro, alinhadas à esquerda, rotuladas "Agente Convoca") e do
     candidato (fundo branco com borda, alinhadas à direita), com timestamps discretos.
   - Coluna direita (1/3): card de perfil do candidato (nome, e-mail, telefone, link de
     currículo), card de "Respostas da Triagem" listando pergunta x resposta com um ícone de
     avaliação da IA (adequado/inadequado), e card de "Score de Matching" com barra de
     progresso mostrando % de compatibilidade com os requisitos da vaga.
4. **Footer:** Nenhum.
```

---

## 5. Agendamento de Entrevista

```
Modal/tela de agendamento de entrevista para um candidato aprovado na triagem, parte de um
SaaS de recrutamento corporativo.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, desktop-first, modal centralizado sobre overlay
- Palette: Indigo profundo #4F46E5 (CTA), Verde esmeralda #10B981 (confirmação)
- Styles: Modal dialog rounded-xl com overlay escuro semi-transparente, entrada suave

**PAGE STRUCTURE:**
1. **Header:** Título do modal "Agendar Entrevista" com nome e foto/iniciais do candidato,
   botão de fechar (X) no canto superior direito.
2. **Hero/Resumo:** Resumo compacto do candidato (vaga, score de matching, canal de contato
   preferido).
3. **Primary Content Area:** Formulário limpo com campos rotulados: date picker para data,
   time picker para horário, dropdown para entrevistador responsável, campo de texto para
   local/link da videochamada, textarea opcional para observações. Estados de validação
   visíveis (borda vermelha + mensagem curta em campo obrigatório vazio).
4. **Footer:** Ações do formulário alinhadas à direita: botão ghost "Cancelar" e botão
   primário pill-shaped "Confirmar Agendamento".
```

---

## 6. Lista de Entrevistas Agendadas

```
Tela de agenda consolidada com todas as entrevistas agendadas pelo recrutador, cruzando
vagas diferentes, incluindo reagendamentos e cancelamentos.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, desktop-first
- Palette: Indigo profundo #4F46E5, Verde esmeralda #10B981 (agendada), Slate médio #64748B
  (cancelada/reagendada, com texto tachado)
- Styles: Tabela/lista com linhas espaçadas, rounded-xl nos cards de cada entrevista

**PAGE STRUCTURE:**
1. **Header:** Título "Entrevistas", com toggle de visualização "Lista" / "Calendário" e
   filtro por período (Hoje / Esta semana / Este mês).
2. **Hero/Resumo:** Nenhum.
3. **Primary Content Area:** Lista de cards de entrevista, cada um mostrando: nome do
   candidato, vaga, data/horário, entrevistador responsável, local/link, badge de status
   (SCHEDULED verde / RESCHEDULED âmbar / CANCELLED cinza com texto tachado), e menu de ações
   (⋮) com opções "Reagendar" e "Cancelar". Entrevistas reagendadas mostram um histórico
   colapsável ("Ver histórico de reagendamentos") abaixo do card.
4. **Footer:** Nenhum.
```
