# Convoca

> A vaga te encontra. Você não precisa mais caçar emprego.

## O nome

**Convoca** vem da ideia central do produto: em vez da pessoa sair procurando vaga em dezenas de plataformas diferentes, é o agente de IA quem **convoca** o candidato — entra em contato diretamente quando encontra uma vaga compatível com o perfil dele.

## O problema

Quem já passou por um processo de busca de emprego conhece essa rotina: cadastrar currículo no LinkedIn, no Gupy, no InfoJobs, no Indeed, em mais três ou quatro plataformas — e depois ficar voltando em cada uma delas, todo dia, pra ver se apareceu alguma vaga nova. É um trabalho manual, repetitivo e cansativo, feito em paralelo a já estar empregado, estudando, ou em outro momento difícil da vida.

O problema não é falta de vaga. O problema é que **a pessoa tem que ir atrás da vaga**, e a vaga não vem até ela. Cada plataforma tem sua própria lógica de busca, seus próprios filtros, seu próprio cadastro — e o candidato vira responsável por monitorar tudo isso sozinho, o tempo todo.

Do outro lado, o recrutador também perde tempo: lê dezenas de currículos, faz a mesma pergunta de triagem repetidas vezes em ligações ou formulários, e boa parte desse trabalho é mecânico — verificar se a pessoa atende a requisitos básicos da vaga — antes mesmo de chegar à parte que exige julgamento humano de verdade.

## A solução

O Convoca inverte essa lógica: o candidato se cadastra **uma única vez**, com seu perfil e seus meios de contato (WhatsApp, e-mail), e a partir daí é o sistema que trabalha para ele.

Quando uma empresa ativa uma vaga na plataforma, um agente de IA:

1. **Busca**, entre os candidatos cadastrados, aqueles cujo perfil mais combina com as características da vaga (usando comparação semântica, não apenas palavras-chave).
2. **Entra em contato diretamente** com esses candidatos — por WhatsApp ou e-mail — avisando que existe uma vaga compatível com o que eles buscam.
3. **Conduz a triagem inicial em forma de conversa**, em vez de um formulário longo e burocrático que faz muita gente desistir no meio do caminho.
4. **Classifica as respostas** com base nos critérios que o RH definiu para a vaga.
5. **Encaminha os aprovados** diretamente para uma conversa com o recrutador ou com o líder do setor — só chegando até um humano quem realmente atende ao que a vaga pede.

### Os dois princípios que guiam o produto

Mais do que a soma das funcionalidades, o Convoca se define por duas escolhas de design:

**1. O candidato é o usuário central, não o objeto do processo.** A maioria das ferramentas de recrutamento é construída para o RH — o candidato é apenas um currículo que entra no funil. No Convoca, a experiência é desenhada a partir de quem procura emprego: ele se cadastra uma vez, descreve o que busca, e passa a ser encontrado. A vaga vai até ele.

**2. O matching é transparente.** Quando o agente convoca alguém, ele explica **por que** aquela vaga combina com o perfil da pessoa. Nada de "você foi selecionado" sem contexto. Essa transparência aumenta a confiança do candidato e melhora a taxa de resposta — e está alinhada com a direção que o próprio mercado vem tomando, em que comunicar de forma clara o que a IA avalia e onde o humano decide se tornou um diferencial competitivo, não só uma obrigação ética.

## O que isso resolve, para cada lado

**Para quem procura emprego:** não precisa mais monitorar dezenas de plataformas. O sistema avisa quando surge algo compatível, e a etapa inicial de triagem é uma conversa natural, não um formulário cansativo.

**Para quem contrata:** o RH para de gastar tempo em triagens manuais repetitivas e só entra em contato com candidatos que já passaram pelo primeiro filtro — reduzindo o tempo de recrutamento e seleção.

## O cenário de mercado

A dor que o Convoca resolve não é hipótese — é um problema validado por um mercado em plena expansão. Triagem é hoje o caso de uso de IA mais adotado em recrutamento (cerca de 58% das empresas), à frente de comunicação com candidatos e sourcing. E a grande maioria dos líderes de RH planeja adotar IA agêntica nos próximos 12 meses — exatamente o tipo de sistema que o Convoca implementa.

No Brasil, já existem plataformas fortes nesse espaço: Recrutei, Kretos, abler, Vagas.com, Reachr, Recrut.AI. Quase todas, porém, compartilham a mesma natureza: são **ATS vendidos para o RH**, em que o candidato é parte do funil da empresa. Do lado do candidato, ferramentas como o Vaga Automática resolvem pela força bruta — disparam candidaturas automáticas em massa nas plataformas existentes.

### Como o Convoca se diferencia

| Dimensão | Plataformas atuais (ATS) | Convoca |
|---|---|---|
| Para quem o produto é feito | Para o RH; candidato é objeto do funil | Para o candidato; ele é o usuário central |
| Iniciativa do contato | Candidato se inscreve / RH faz hunting | A vaga convoca o candidato compatível |
| Cadastro do candidato | Um por empresa / por processo | Único, reaproveitado em todas as vagas |
| Triagem | Conversa/formulário a serviço da empresa | Conversa transparente que explica o "porquê" do match |
| Transparência do match | Geralmente opaca para o candidato | Explícita: o candidato entende por que foi convocado |

O ponto não é competir de frente com players estabelecidos — é mostrar domínio técnico construindo, do zero, um sistema cujo valor o mercado já comprovou, partindo de um ângulo (centrado no candidato e transparente) que os concorrentes exploram pouco.

## Por que isso importa como projeto

Esse projeto nasce de uma dor pessoal real e bem comum — qualquer pessoa que já procurou emprego reconhece o problema imediatamente, o que facilita explicar e demonstrar o valor do projeto para qualquer público, técnico ou não. E não é só uma dor individual: é um problema que o mercado de RH já validou como prioritário, investindo pesado exatamente nesse tipo de automação.

Tecnicamente, ele exige resolver problemas genuinamente difíceis:

- **Matching semântico** entre perfil de candidato e descrição de vaga, usando embeddings e busca vetorial (pgvector) — não apenas filtro por palavra-chave.
- **Agente conversacional** capaz de conduzir uma triagem coerente, extrair informação estruturada de uma conversa livre e classificar respostas contra critérios definidos pelo RH.
- **Orquestração de workflow** com LangGraph, modelando o processo de recrutamento como uma máquina de estados (vaga ativada → convocação → triagem → classificação → encaminhamento).
- **Arquitetura multi-tenant** com isolamento de dados entre empresas e controle de acesso por papéis.
- **Integração com canais reais** (WhatsApp via Evolution API, e-mail) com tratamento de mensagens assíncronas.

É um projeto que demonstra, ao mesmo tempo, **visão de produto** (resolver um problema real, contado a partir de uma experiência genuína, com um posicionamento claro frente aos concorrentes) e **profundidade técnica** (agentes de IA, matching semântico, dados estruturados a partir de linguagem natural, orquestração de workflows). Essa combinação — saber *o que* construir e *por que*, além de *como* — é exatamente o que diferencia um projeto de portfólio memorável de mais um CRUD genérico.