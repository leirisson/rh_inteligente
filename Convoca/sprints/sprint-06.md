# Sprint 6 — Testes Automatizados e Deploy

**Specs cobertas:** 12 (Testes Automatizados) + 13 (Observabilidade e Deploy)
**Status:** 🔒 Bloqueada (aguarda Sprint 5)
**Pré-requisito:** Sprint 5 concluída — fluxo completo de ponta a ponta funcionando

---

## Objetivo

Garantir confiabilidade com cobertura de testes e colocar o sistema em produção com observabilidade. Ao final desta sprint o projeto tem CI/CD, métricas, alertas e está rodando em ambiente de produção.

---

## Entregas da Spec 12 — Testes Automatizados

> Spec ainda não escrita — será detalhada após Sprint 5 estar aprovada.
> Preencher esta seção quando a spec 12 for criada em `api/specs/`.

### Escopo esperado (baseado no domínio)

- **Testes unitários:** services, regras de negócio (transições de fase, validações)
- **Testes de integração:** rotas com banco real (não mock) — lição aprendida do Petigen
- **Testes e2e do grafo LangGraph:** simular conversação completa com respostas mockadas
- **Teste de isolamento de tenant:** tentativas adversariais de acessar dados de outro tenant

### Ferramentas previstas

| Camada | Ferramenta esperada |
|--------|-------------------|
| Unit + integração | Vitest ou Jest |
| Banco nos testes | Postgres real em Docker (via testcontainers ou docker-compose de test) |
| LangGraph e2e | Mock das chamadas LLM, banco real |
| Cobertura | threshold mínimo a definir na spec |

### Critérios de aceite esperados

- [ ] `npm test` roda toda a suíte sem dependências externas além do Docker
- [ ] Testes de integração usam banco real (não mock do Prisma)
- [ ] Teste adversarial de tenant: usuário A não consegue acessar dados do tenant B
- [ ] E2e do grafo: simula triagem completa e verifica estado final do Application
- [ ] CI passa em todo PR antes do merge

---

## Entregas da Spec 13 — Observabilidade e Deploy

> Spec ainda não escrita — será detalhada após Sprint 5 estar aprovada.
> Preencher esta seção quando a spec 13 for criada em `api/specs/`.

### Escopo esperado (baseado no domínio)

- **Logs:** Pino em JSON estruturado, coletados centralmente (ex: Loki ou CloudWatch)
- **Métricas:** latência de rotas, taxa de erro, fila de jobs, duração das triagens
- **Tracing:** request ID propagado em todas as operações (já existe `genReqId` no Fastify)
- **Alertas:** erro rate acima do threshold, fila travada, banco inacessível
- **Deploy:** containerização da API, CI/CD com GitHub Actions
- **Banco em produção:** migrations aplicadas via `prisma migrate deploy` no pipeline

### Decisões técnicas previstas

| Item | Escolha esperada |
|------|-----------------|
| Containerização | Dockerfile multi-stage (build com tsup + runtime com Node slim) |
| CI/CD | GitHub Actions |
| Infra | VPS single-node (Kamal ou Docker Compose direto) — a definir |
| Logs | Pino → stdout → coletor externo |
| Métricas | Prometheus + Grafana ou serviço gerenciado |

### Critérios de aceite esperados

- [ ] `docker build` gera imagem funcional da API
- [ ] GitHub Actions roda testes e build em todo PR
- [ ] `prisma migrate deploy` é executado automaticamente no pipeline de deploy
- [ ] Dashboard com métricas de latência e taxa de erro acessível
- [ ] Alerta configurado para erro rate > threshold
- [ ] Rollback documentado e testado

---

## Arquivos a criar (estrutura esperada)

```
Convoca/api/
├── Dockerfile                      ← multi-stage
├── .github/
│   └── workflows/
│       ├── ci.yml                  ← lint + test em todo PR
│       └── deploy.yml              ← build + push + deploy em merge na main
├── test/
│   ├── setup.ts                    ← configuração do banco de testes
│   ├── unit/
│   ├── integration/
│   └── e2e/
│       └── screening-flow.test.ts  ← teste e2e do grafo LangGraph
```

> Esta estrutura será revisada quando as specs 12 e 13 forem escritas.
