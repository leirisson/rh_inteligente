# Convoca — Design System (Stitch)

> Aplicar em **todas** as telas dos três arquivos de prompts (`recrutadores.md`,
> `candidatos.md`, `admin.md`). Gere a primeira tela de `recrutadores.md` primeiro — ela fixa
> o design system (`designSystem` id retornado pelo Stitch) que as demais telas devem
> referenciar via parâmetro `designSystem` para manter consistência visual entre os três
> conjuntos.

- **Vibe:** SaaS corporativo clean — minimalista, sofisticado, confiável. Whitespace generoso,
  tipografia sóbria de alto contraste, sombras sutis (`whisper-soft`), cantos suavemente
  arredondados (`rounded-xl`).
- **Palette:**
  - Primary Action: Indigo profundo `#4F46E5` (CTAs, links, estados ativos)
  - Surface: Off-white `#F8FAFC` (fundo de página), branco `#FFFFFF` (cards)
  - Text: Slate escuro `#0F172A` (títulos), Slate médio `#64748B` (texto secundário)
  - Success (aprovado/entrevista agendada/conexão ativa): Verde esmeralda `#10B981`
  - Warning (aguardando resposta/triagem em andamento/config pendente): Âmbar `#F59E0B`
  - Danger (reprovado/erro de contato/conexão falhou): Vermelho `#EF4444`
  - Accent IA (destaca ações do agente autônomo): Violeta `#8B5CF6`
- **Styles:** Cards com `rounded-xl` e sombra whisper-soft; botão primário pill-shaped
  (`rounded-full`) em Indigo sólido; badges de status pill-shaped com fundo semântico em 10%
  de opacidade e texto na cor sólida correspondente.
- **Platform:**
  - Painel do Recrutador e Admin: Web, desktop-first, com breakpoints responsivos.
  - Portal do Candidato: Web, mobile-first (candidato interage majoritariamente pelo celular).
