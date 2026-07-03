# Prompts Stitch — Login Inicial (Splash Compartilhado)

> Porta de entrada compartilhada por dois públicos com autenticação **totalmente separada**:
> `POST /auth/login` (empresa — e-mail/senha, usuário criado apenas via onboarding do tenant
> em `POST /tenants`, nunca se auto-cadastra) e `POST /candidates/login` (candidato — tem
> `POST /candidates/signup` próprio, ver [candidatos.md](candidatos.md) Tela 1). Esta tela não
> chama nenhum dos dois endpoints diretamente — ela só roteia para o formulário correto.
>
> Ver [design-system.md](design-system.md). Gere esta tela **primeiro**, antes de
> `recrutadores.md`/`candidatos.md`/`admin.md` — ela fixa o design system do projeto inteiro
> (parâmetro `designSystem` a ser reaproveitado nas demais gerações).
>
> Fonte: `src/modules/auth` (`auth.routes.ts`, `auth.schema.ts`).

---

## 1. Landing/Splash — Escolha de Perfil e Login de Empresa

```
Tela inicial (splash) de uma plataforma de recrutamento com IA, primeiro contato de qualquer
visitante ao abrir o produto. Precisa comunicar em poucos segundos que existem dois caminhos
distintos — "eu sou uma empresa contratando" vs. "eu sou um candidato" — sem parecer uma
escolha burocrática; deve transmitir confiança e o diferencial central do produto (agente de
IA que conduz a triagem via WhatsApp).

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, responsivo (desktop e mobile — este é o único ponto de entrada compartilhado
  pelos dois públicos, um mobile-first e outro desktop-first)
- Palette: Indigo profundo #4F46E5 (ação primária), Off-white #F8FAFC (fundo), Violeta #8B5CF6
  (destaque do conceito de "agente de IA"), Slate escuro #0F172A (texto principal)
- Styles: Muito whitespace, cantos suavemente arredondados (rounded-xl), sombras whisper-soft;
  tom mais "produto" que "formulário" — esta tela não deve parecer uma tela de login comum

**PAGE STRUCTURE:**
1. **Header:** Logo "Convoca" centralizado ou alinhado à esquerda, sem menu de navegação.
2. **Hero Section:** Headline curta comunicando a proposta central (ex: "Recrutamento
   conduzido por IA, do match à entrevista") e subtexto de uma linha.
3. **Primary Content Area:** Dois cards grandes lado a lado (empilhados em mobile), com peso
   visual igual — nenhum dos dois é "secundário":
   - Card "Sou uma empresa": ícone de maleta/prédio, texto curto ("Publique vagas e deixe
     nosso agente de IA triar candidatos por você"), botão primário pill-shaped "Entrar como
     empresa" que revela o formulário de login de empresa (e-mail + senha) descrito abaixo.
   - Card "Sou candidato": ícone de pessoa/perfil, texto curto ("Cadastre-se uma vez e seja
     contatado quando surgir a vaga certa"), botão primário pill-shaped "Entrar como
     candidato" que leva ao formulário combinado de login/cadastro de candidato (ver
     `candidatos.md`, Tela 1 — tela separada, não gerar aqui).
4. **Footer:** Links discretos de Termos de Uso e Privacidade.

**Estado alternativo (formulário de login de empresa, revelado ao clicar em "Entrar como
empresa"):** card centrado com campos e-mail e senha, botão primário pill-shaped "Entrar",
link "Voltar" para a escolha de perfil. Sem opção de "criar conta" neste formulário — contas
de empresa são criadas apenas via onboarding (fluxo separado, fora desta tela), nunca por
auto-cadastro. Estado de erro: mensagem curta e genérica abaixo dos campos ("E-mail ou senha
inválidos") sem indicar qual dos dois está incorreto — evita confirmar se o e-mail existe.
Estado de loading: botão "Entrar" com spinner inline, campos desabilitados durante a request.
```
