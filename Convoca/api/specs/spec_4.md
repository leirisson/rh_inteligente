# Spec 04 — Modelagem do Banco de Dados

## Contexto

Com infraestrutura (01), configuração (02) e o modelo de autenticação/multi-tenancy (03) definidos, esta spec consolida o schema Prisma completo. É a base estrutural para todas as specs de codificação que vêm depois (05 em diante). Mudanças nesse schema depois de iniciada a Camada 4 são caras — por isso ele é revisado antes de qualquer CRUD ser implementado.

## Escopo

- Schema Prisma completo de todas as entidades do domínio
- Relacionamentos e chaves estrangeiras, incluindo `tenant_id` onde aplicável (definido na Spec 03)
- Campo de embedding (pgvector) nas entidades que participam do matching
- Enums de domínio (status de vaga, fase do candidato, papel de usuário)
- Estratégia de migrations

## Entidades principais

| Entidade                        | Pertence a tenant? | Observação                                                                                  |
| ------------------------------- | ------------------ | ------------------------------------------------------------------------------------------- |
| `Tenant` (Empresa)              | —                  | Raiz do isolamento multi-tenant                                                             |
| `User` (Admin/Recrutador/Líder) | Sim                | Vinculado a `Tenant`, com `role`                                                            |
| `Candidate`                     | Não                | Cadastro único, pode se candidatar a várias empresas                                        |
| `ContactMethod`                 | Não                | WhatsApp, e-mail, etc., vinculado ao `Candidate`                                            |
| `Job` (Vaga)                    | Sim                | Vinculada ao `Tenant`, com status (rascunho/ativa/pausada/encerrada)                        |
| `JobRequirement`                | Sim                | Especificações da vaga usadas no matching                                                   |
| `ScreeningQuestion`             | Sim                | Pergunta + resposta esperada, cadastrada pelo RH, vinculada à `Job`                         |
| `Application`                   | Não diretamente*   | Liga `Candidate` a `Job` — representa "candidato se candidatou/foi abordado para esta vaga" |
| `ScreeningAnswer`               | —                  | Resposta do candidato a uma `ScreeningQuestion`, dentro de uma `Application`                |
| `ApplicationStage` (Fase)       | —                  | Histórico de fases pelas quais a `Application` passou                                       |
| `Conversation`                  | —                  | Histórico de mensagens trocadas entre agente e candidato, vinculado à `Application`         |
| `InterviewSchedule`             | —                  | Agendamento da entrevista final (recrutador/líder)                                          |

> *`Application` não tem `tenant_id` direto, mas herda o tenant via `Job`. Toda query de `Application` deve obrigatoriamente passar por join/filtro de `Job.tenant_id`.

## Requisitos funcionais

1. Toda entidade vinculada a uma empresa carrega `tenant_id` como chave estrangeira não-nula.
2. `Candidate` é uma entidade global, sem `tenant_id`, podendo ter múltiplas `Application` em tenants diferentes.
3. `Job` possui um enum de status: `DRAFT`, `ACTIVE`, `PAUSED`, `CLOSED`. A transição para `ACTIVE` é o gatilho que, segundo as conversas anteriores, dispara o agente de triagem (lógica tratada na Spec 08, não aqui).
4. `JobRequirement` armazena o texto da especificação **e** seu embedding vetorial (coluna `vector`), gerado a partir desse texto — usado pela Spec 07 (matching).
5. `Candidate` também armazena um embedding de perfil, na mesma dimensão, para permitir comparação de similaridade.
6. `ScreeningQuestion` armazena pergunta, resposta esperada (texto livre, usado como referência para a IA avaliar) e peso/ordem dentro da vaga.
7. `ApplicationStage` registra histórico (não sobrescreve): cada mudança de fase gera um novo registro com timestamp, fase anterior e fase nova.
8. `Conversation` armazena cada mensagem trocada (remetente: agente ou candidato, conteúdo, timestamp, canal: WhatsApp/e-mail), permitindo reconstruir a triagem completa para auditoria.
9. Toda entidade tem `created_at` e `updated_at`.
10. Toda entidade tem chave primária do tipo UUID (consistente com a decisão da Spec 03 de evitar IDs sequenciais expostos).

## Enums de domínio

```
JobStatus: DRAFT | ACTIVE | PAUSED | CLOSED
ApplicationStatus: PENDING_CONTACT | IN_SCREENING | APPROVED | REJECTED | INTERVIEW_SCHEDULED | HIRED | WITHDRAWN
MessageSender: AGENT | CANDIDATE
Channel: WHATSAPP | EMAIL
UserRole: SUPER_ADMIN | TENANT_ADMIN | RECRUITER | DEPARTMENT_LEAD
```

## Decisões técnicas

| Item                    | Escolha                                                                                                                                                                             |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ORM                     | Prisma                                                                                                                                                                              |
| Tipo de chave primária  | UUID (`gen_random_uuid()` ou `uuid_generate_v4()`)                                                                                                                                  |
| Embeddings              | Coluna `vector` (pgvector) via extensão SQL nativa — Prisma não suporta `vector` nativamente, então essa coluna é adicionada via migration SQL manual complementar ao schema Prisma |
| Estratégia de migration | `prisma migrate dev` em desenvolvimento; migrations versionadas e revisadas manualmente antes de aplicar em qualquer ambiente compartilhado                                         |
| Soft delete             | Não implementado nesta fase (PoC) — exclusão é física; revisar se o projeto evoluir para produto real                                                                               |

## Critérios de aceite

- [ ] `prisma migrate dev` roda sem erro e cria todas as tabelas listadas
- [ ] Inserir um `Candidate` não exige nem aceita `tenant_id`
- [ ] Inserir uma `Job` sem `tenant_id` é rejeitado pelo banco (constraint `NOT NULL`)
- [ ] É possível inserir e recuperar um vetor de embedding em `JobRequirement` e em `Candidate` via query SQL direta
- [ ] Uma `Application` consegue ser ligada corretamente a `Candidate` e `Job` de tenants diferentes sem conflito
- [ ] Existe ao menos uma migration de seed (dados de exemplo) para popular o ambiente de desenvolvimento

## Fora de escopo (nesta spec)

- Lógica de geração de embedding (qual modelo, quando é gerado) — Spec 07
- Lógica de quando/como o agente é acionado na mudança de status da vaga — Spec 08
- Regras de validação de negócio em nível de aplicação (ex: "vaga não pode ativar sem pergunta cadastrada") — tratadas nas specs de CRUD (05) e de fluxo de fases (10), o banco aqui só garante integridade estrutural

## Riscos / pontos de atenção

- Definir a dimensão do vetor de embedding (ex: 1536 para `text-embedding-3-small` da OpenAI, ou outra conforme o provedor escolhido via OpenRouter) **antes** de rodar a migration — mudar a dimensão depois exige recriar a coluna e reprocessar todos os embeddings.
- Avaliar desde já se `ScreeningAnswer` deve guardar também a nota/classificação dada pela IA (campo `score` ou `verdict`) nesta spec, já que isso é estrutural e não lógica de negócio — recomendo incluir o campo agora mesmo que a lógica de cálculo só seja implementada na Spec 08.
