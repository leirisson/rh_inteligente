# Spec 03 — Autenticação e Multi-Tenancy

## Contexto

O projeto precisa suportar múltiplas empresas (tenants) de forma isolada: dados de uma empresa nunca podem vazar para outra. Além disso, há diferentes níveis de permissão dentro e fora de uma empresa. Esta spec define o modelo de autenticação e autorização **antes** da modelagem de banco (Spec 04), porque o conceito de tenant afeta diretamente o desenho de praticamente todas as tabelas de negócio.

## Escopo

- Estratégia de isolamento multi-tenant (dados por empresa)
- Modelo de autenticação (login, emissão e validação de sessão/token)
- Modelo de autorização por papéis (RBAC)
- Middleware de escopo de tenant (toda query de negócio é automaticamente restrita à empresa do usuário autenticado)
- Cadastro do usuário comum (candidato) como entidade separada do usuário de empresa

## Tipos de usuário (papéis)

| Papel                        | Pertence a um tenant?       | Pode fazer                                                                                              |
| ---------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Super Admin** (plataforma) | Não — acesso global         | Gerenciar empresas cadastradas na plataforma, suporte, auditoria                                        |
| **Admin da Empresa**         | Sim                         | Gerenciar vagas, gerenciar usuários da própria empresa, ver todos os candidatos em triagem              |
| **Recrutador**               | Sim                         | Criar/editar vagas, cadastrar perguntas de triagem, acompanhar candidatos, agendar entrevistas          |
| **Líder de Setor**           | Sim                         | Visualizar candidatos aprovados para sua área, participar da etapa final (sem permissão de editar vaga) |
| **Candidato**                | Não — não pertence a tenant | Cadastrar perfil, meios de contato, responder triagem conduzida pelo agente                             |

> Decisão em aberto: o candidato pode se candidatar a vagas de **múltiplas** empresas com o mesmo cadastro (modelo mais provável e recomendado), em vez de ter um cadastro por empresa.

## Requisitos funcionais

1. Toda empresa cadastrada na plataforma é um **tenant** com identificador único (`tenant_id`).
2. Todo usuário do tipo Admin/Recrutador/Líder pertence a exatamente um tenant.
3. Toda tabela de negócio que armazena dados pertencentes a uma empresa (vagas, perguntas de triagem, etc.) deve carregar `tenant_id` como chave estrangeira obrigatória.
4. Nenhuma query de negócio pode ser executada sem filtro de `tenant_id` — isso deve ser garantido por middleware/camada de acesso a dados, não por disciplina manual em cada rota.
5. A autenticação deve emitir um token (JWT) contendo: `user_id`, `tenant_id` (nulo para candidato e super admin), e `role`.
6. Cada rota da API declara explicitamente quais papéis podem acessá-la; acesso fora da lista retorna 403.
7. O candidato se autentica de forma separada dos usuários de empresa (pode ser o mesmo mecanismo técnico — JWT — mas sem `tenant_id` associado).
8. Senhas (se houver login por senha) devem ser armazenadas com hash (bcrypt/argon2) — nunca em texto plano.
9. Deve existir um fluxo de criação do primeiro Admin de uma empresa nova (onboarding do tenant).

## Decisões técnicas

| Item                        | Escolha                                                                                                                                              |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estratégia de multi-tenancy | Banco compartilhado, schema compartilhado, isolamento por coluna `tenant_id` (mais simples de operar em fase de PoC/portfólio que schema-per-tenant) |
| Autenticação                | JWT (access token curto + refresh token)                                                                                                             |
| Hash de senha               | argon2                                                                                                                                               |
| Autorização                 | RBAC simples via decorator/plugin do Fastify checando `role` do token                                                                                |
| Middleware de escopo        | Plugin do Fastify que injeta `tenant_id` do token no contexto de toda request autenticada de empresa                                                 |

## Critérios de aceite

- [ ] Um usuário autenticado da Empresa A nunca consegue, via API, ler ou modificar dado de outro `tenant_id`, mesmo manipulando IDs diretamente na URL
- [ ] Um candidato autenticado não consegue acessar nenhuma rota restrita a papéis de empresa, e vice-versa
- [ ] Tentativa de acesso a rota sem token retorna 401; com token mas papel incorreto retorna 403
- [ ] Senha nunca aparece em log, resposta de API ou armazenada em texto plano
- [ ] Criar uma nova empresa gera automaticamente seu primeiro usuário Admin vinculado ao `tenant_id` correto
- [ ] Existe teste automatizado de isolamento de tenant (não só teste de autorização por papel)

## Fora de escopo (nesta spec)

- Login social (Google, etc.) — pode ser adicionado depois sem afetar o restante
- Recuperação de senha / 2FA — tratar como spec própria se o projeto evoluir para produto real
- Modelagem das tabelas de negócio em si (vaga, candidato, pergunta) — Spec 04, que vai herdar o conceito de `tenant_id` definido aqui

## Riscos / pontos de atenção

- Definir agora se o `tenant_id` será UUID ou serial incremental — UUID evita vazamento de informação (contagem de empresas) e é mais seguro para uso em URLs públicas.
- Garantir que o middleware de escopo de tenant seja testado de forma adversarial (tentando "furar" via manipulação de payload), já que isolamento de dados é a falha mais grave possível neste tipo de sistema.
