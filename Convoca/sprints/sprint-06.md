# Sprint 6 — Testes Automatizados e Deploy

**Specs cobertas:** 12 (Testes Automatizados, `api/specs/spec_8.md`) + 13 (Observabilidade e Deploy, `api/specs/spec_9.md`)
**Status:** 🚧 Em andamento
**Pré-requisito:** Sprint 5 concluída — fluxo completo de ponta a ponta funcionando ✅

---

## Objetivo

Garantir confiabilidade com cobertura de testes e colocar o sistema em produção com observabilidade. Ao final desta sprint o projeto tem CI/CD, métricas, alertas e está rodando em ambiente de produção.

---

## Entregas da Spec 12 — Testes Automatizados

> Ver `api/specs/spec_8.md` para o texto completo da spec.

O projeto já tinha 104 testes em 19 arquivos (unit + integração) acumulados desde a Spec 03. A Spec 12 formaliza esse padrão e fecha as lacunas: teste adversarial de tenant e e2e do grafo LangGraph ainda não escritos.

### Critérios de aceite — Spec 12

- [x] `npm test` roda toda a suíte sem dependências externas além do Docker
- [x] Testes de integração usam banco real (não mock do Prisma)
- [x] Teste adversarial de tenant: usuário A não consegue acessar dados do tenant B (job, matching e application já cobertos; interview cobrido nesta sprint — `interview.routes.integration.test.ts`, 3 novos testes: schedule/reschedule/cancel retornam 404 para tenant errado)
- [ ] E2e do grafo: simula triagem completa e verifica estado final do Application
- [x] CI roda a suíte em todo push/PR (job `test` do CI, ver Spec 13) — falta o gate de cobertura mínima (80%/70%)

---

## Entregas da Spec 13 — Observabilidade e Deploy

> Ver `api/specs/spec_9.md` para o texto completo da spec.

### Critérios de aceite — Spec 13

- [x] GitHub Actions roda testes e build em todo PR (`.github/workflows/ci.yml`, job `test`)
- [x] `prisma migrate deploy` é executado automaticamente no pipeline de CI
- [ ] Job de lint/format reativado no CI (bloqueado por dívida técnica pré-existente — ver `CLAUDE.md` raiz, 5.18)
- [ ] `docker build` gera imagem funcional da API (Dockerfile multi-stage)
- [ ] `deploy.yml` builda, publica e aplica a imagem em merge na `main`
- [ ] Dashboard com métricas de latência e taxa de erro acessível
- [ ] Alerta configurado para erro rate > threshold
- [ ] Rollback documentado e testado

---

## Arquivos criados até agora

```text
rh_inteligente/
├── .github/
│   └── workflows/
│       └── ci.yml                  ← job `test`: Postgres+pgvector service container,
│                                       prisma migrate deploy, build, test:coverage
├── Convoca/api/specs/
│   ├── spec_8.md                   ← Spec 12 (Testes Automatizados)
│   └── spec_9.md                   ← Spec 13 (Observabilidade e Deploy)
```

## Arquivos ainda a criar

```text
Convoca/api/
├── Dockerfile                      ← multi-stage, pendente
└── src/agent/graph.integration.test.ts  ← e2e do grafo LangGraph, pendente

rh_inteligente/.github/workflows/
└── deploy.yml                      ← build + push + deploy em merge na main, pendente
```
