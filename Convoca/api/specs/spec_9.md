# Spec 13 — Observabilidade e Deploy

## Contexto

O projeto roda hoje apenas localmente (`npm run dev` + `docker-compose.yml` com Postgres/Evolution API). Esta spec cobre duas frentes: (1) CI automatizado no GitHub Actions, cuja primeira versão (`.github/workflows/ci.yml`) já foi implementada e validada nesta sprint, cobrindo build e teste com banco real; e (2) o que ainda falta — Dockerfile de produção, pipeline de deploy e observabilidade (logs/métricas/alertas). Diferente das specs anteriores, aqui parte do escopo já está implementada e é documentada como decisão tomada, não como plano.

## Escopo

- CI de build+teste em todo PR/push — **implementado**.
- Job de lint/format no CI — **adiado**, pois `npm run lint` e `npm run format:check` já falhavam no repo antes desta spec (dívida técnica pré-existente, não introduzida por ela).
- Dockerfile multi-stage para a API — **pendente**.
- Pipeline de deploy (`deploy.yml`) — **pendente**.
- Observabilidade (métricas, dashboard, alertas) — **pendente**.

## Requisitos funcionais

### 13.1 CI — implementado

1. `.github/workflows/ci.yml`, na raiz do monorepo, com `defaults.run.working-directory: Convoca/api` e gatilho filtrado por `paths: ["Convoca/api/**", ".github/workflows/ci.yml"]` em push/PR para `main`.
2. Job `test` sobe `pgvector/pgvector:pg16` como service container (mesmas credenciais do `docker-compose.yml` local, banco `convoca_test`), roda `npm ci` → `prisma generate` → `prisma migrate deploy` → `npm run build` → `npm run test:coverage`, e publica o relatório de cobertura como artifact (`if-no-files-found: ignore`, para não falhar se a suíte não gerar nada).
3. `NODE_ENV=test` já é suficiente para carregar `.env.test` (commitado, com chaves fake de LLM) — nenhum GitHub Secret é necessário para este job.
4. Job de lint/format fica **fora** do workflow até a dívida técnica ser resolvida (ver `CLAUDE.md` raiz, 5.18): `@typescript-eslint/unbound-method` em `auth.service.unit.test.ts`, `@typescript-eslint/require-await` em `tenant-scope.ts`, erro de parsing em `vitest.config.ts` (fora do `tsconfig.json`), e 15 arquivos fora do padrão do Prettier. Corrigir essa dívida é pré-requisito para reativar o job — rastreado como pendência desta spec, não uma nova.

### 13.2 Dockerfile — pendente

5. Dockerfile multi-stage: estágio `build` (Node 20, `npm ci` + `npm run build`, gera `dist/` e `dist/prompts/`), estágio `runtime` (Node 20 slim, copia apenas `dist/`, `node_modules` de produção e `prisma/` para `prisma migrate deploy` no entrypoint).
6. Entrypoint roda `prisma migrate deploy` antes de `node dist/server.js`, para que o container nunca suba com schema desatualizado.
7. `docker build` deve gerar uma imagem que sobe com `docker run` apontando para um `DATABASE_URL` externo, sem exigir o `docker-compose.yml` de desenvolvimento.

### 13.3 Deploy — pendente

8. `deploy.yml`: dispara em push para `main` (após o job `test` passar), builda e publica a imagem Docker em um registry (GHCR, por já estar integrado ao GitHub sem credenciais extras), e aplica em uma VPS single-node.
9. Estratégia de deploy: a definir entre Docker Compose direto via SSH ou Kamal — decisão explicitamente adiada para quando a infraestrutura de destino (VPS) estiver provisionada.
10. Rollback: manter ao menos a imagem anterior taggeada no registry, com procedimento documentado (`docker pull` da tag anterior + restart), sem automação de rollback nesta primeira versão.

### 13.4 Observabilidade — pendente

11. Logs: Pino já emite JSON estruturado em produção (`NODE_ENV !== "development"`, ver `src/lib/logger` — confirmar caminho exato ao implementar); a spec cobre apenas *coletar* esse stdout, não mudar o formato.
12. Request ID: Fastify já gera `genReqId` por requisição; propagar esse ID em todo log dentro do mesmo request já é comportamento padrão do Pino/Fastify — nenhuma mudança de código necessária, apenas confirmação em produção.
13. Métricas mínimas: latência por rota, taxa de erro (4xx/5xx) e duração do `runScreeningAgent` (do disparo até o retorno da função). Ferramenta a definir entre Prometheus+Grafana self-hosted ou serviço gerenciado — adiado até a VPS de destino ser escolhida (depende de 13.3).
14. Alerta mínimo: taxa de erro 5xx acima de um threshold (a definir) e falha de `docker-compose`/health check do Postgres em produção.

## Decisões técnicas

| Item | Escolha |
| --- | --- |
| CI | GitHub Actions, um único job `test` (sem matriz de versão de Node — só 20.x, igual ao `engines` implícito do projeto) |
| Banco no CI | Service container `pgvector/pgvector:pg16`, banco `convoca_test` — mesma imagem do `docker-compose.yml` de desenvolvimento, para não haver divergência de extensões/versão do Postgres entre ambientes |
| Secrets no CI | Nenhum por enquanto — `.env.test` commitado com chaves fake cobre o job de teste; Secrets do GitHub só entram quando `deploy.yml` existir (credenciais de registry/VPS) |
| Lint no CI | Adiado até a dívida técnica pré-existente ser corrigida — decisão confirmada com o usuário nesta sprint, para não bloquear o primeiro CI por problemas não relacionados a ele |
| Registry de imagem | GHCR (GitHub Container Registry) — evita credencial extra, já autenticado via `GITHUB_TOKEN` |
| Infra de destino | VPS single-node — mesma linha do template genérico do projeto (`c:\Users\leiri\Documents\CLAUDE.md`); escolha entre Kamal e Compose direto adiada até a VPS existir |
| Métricas/alertas | Adiados explicitamente — dependem de a infra de destino (13.3) estar decidida primeiro; não faz sentido instrumentar antes de saber onde vai rodar |

## Critérios de aceite

- [x] GitHub Actions roda testes e build em todo PR (`.github/workflows/ci.yml`, job `test`)
- [x] `prisma migrate deploy` é executado automaticamente no pipeline de CI, contra banco real
- [ ] Job de lint/format reativado no CI (bloqueado por dívida técnica pré-existente — ver 5.18)
- [x] `docker build` gera imagem funcional da API (Dockerfile multi-stage)
- [ ] `deploy.yml` builda, publica e aplica a imagem em merge na `main`
- [ ] Dashboard com métricas de latência e taxa de erro acessível
- [ ] Alerta configurado para taxa de erro acima do threshold
- [ ] Rollback documentado e testado

## Fora de escopo

- Multi-região ou alta disponibilidade — VPS single-node é a escolha deliberada desta fase
- Tracing distribuído (OpenTelemetry completo) — request ID simples via Pino/Fastify é suficiente por ora
- Blue-green deploy ou canary — rollback manual documentado é aceitável nesta primeira versão
- Autoscaling
