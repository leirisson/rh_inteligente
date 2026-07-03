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

O projeto já tinha 104 testes em 19 arquivos (unit + integração) acumulados desde a Spec 03. A Spec 12 formaliza esse padrão e fecha as lacunas que faltavam: teste adversarial de tenant (interview) e e2e completo do grafo LangGraph (matching → contato → respostas → decisão). Ao final da sprint: 109 testes em 19 arquivos, 86%/72.72% de cobertura statements/branches, gate de cobertura ativo em `vitest.config.ts`.

### Critérios de aceite — Spec 12

- [x] `npm test` roda toda a suíte sem dependências externas além do Docker
- [x] Testes de integração usam banco real (não mock do Prisma)
- [x] Teste adversarial de tenant: usuário A não consegue acessar dados do tenant B (job, matching e application já cobertos; interview cobrido nesta sprint — `interview.routes.integration.test.ts`, 3 novos testes: schedule/reschedule/cancel retornam 404 para tenant errado)
- [x] E2e do grafo: simula triagem completa e verifica estado final do Application (`src/agent/graph.integration.test.ts` — estendido nesta sprint com os cenários de aprovação e rejeição via `POST /applications/:id/messages` após a ativação da vaga disparar o grafo)
- [x] CI roda a suíte em todo push/PR (job `test` do CI, ver Spec 13) — gate de cobertura mínima (80% statements/lines, 70% branches/functions) ativado em `vitest.config.ts` (`coverage.thresholds`); cobertura atual: 86%/88.33%/72.72%/85.62%

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
└── Convoca/api/src/
    ├── agent/graph.integration.test.ts               ← e2e completo do grafo (matching → contato → respostas → decisão)
    └── modules/interview/interview.routes.integration.test.ts  ← + testes adversariais de tenant
```

## Arquivos ainda a criar

```text
Convoca/api/
└── Dockerfile                      ← multi-stage, pendente

rh_inteligente/.github/workflows/
└── deploy.yml                      ← build + push + deploy em merge na main, pendente
```
