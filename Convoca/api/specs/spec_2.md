# Spec 02 — Configuração Base

## Contexto

Com a infraestrutura (Spec 01) de pé, esta spec define os padrões e configurações que **todo** código futuro deve respeitar: como a aplicação lê configuração, como loga, como valida entrada, e quais padrões de qualidade de código são obrigatórios. Nenhuma regra de negócio é implementada aqui.

## Escopo

- Validação e tipagem de variáveis de ambiente
- Sistema de logging estruturado
- Plugins essenciais do Fastify (CORS, error handler global, schema validation)
- Padrões de lint, format e convenções de código
- Configuração de conexão do Prisma com o Postgres
- Configuração base do cliente LLM (OpenRouter/Claude) — apenas a configuração, sem lógica de agente ainda

## Requisitos funcionais

1. As variáveis de ambiente devem ser validadas na inicialização da aplicação (ex: via `zod`), e a aplicação deve falhar de forma clara e imediata (fail-fast) se uma variável obrigatória estiver ausente.
2. Todo log da aplicação deve ser estruturado (JSON) e conter, no mínimo: timestamp, nível, mensagem, e contexto (request id quando aplicável).
3. Erros não tratados no Fastify devem ser capturados por um error handler global, que retorna uma resposta padronizada (`{ error: { message, code } }`) e nunca expõe stack trace em produção.
4. Toda rota da API deve ter seu payload de entrada e saída validado por schema (JSON Schema nativo do Fastify ou Zod via plugin).
5. O Prisma Client deve ser instanciado como singleton, evitando múltiplas conexões em ambiente de desenvolvimento com hot-reload.
6. Deve existir um módulo de configuração único (`config/index.ts`) que centraliza o acesso a todas as variáveis de ambiente — nenhum outro arquivo deve ler `process.env` diretamente.
7. A configuração do cliente LLM (base URL do OpenRouter, modelo padrão, chave de API) deve estar isolada em seu próprio módulo, pronta para ser consumida pela Spec 07, mas sem nenhuma chamada de negócio implementada aqui.

## Decisões técnicas

| Item                        | Escolha                                                       |
| --------------------------- | ------------------------------------------------------------- |
| Validação de env            | Zod                                                           |
| Logging                     | Pino (nativo do Fastify)                                      |
| Validação de schema de rota | Zod + `fastify-type-provider-zod`                             |
| Lint                        | ESLint com config TypeScript                                  |
| Format                      | Prettier                                                      |
| Git hooks                   | Husky + lint-staged (lint/format obrigatório antes de commit) |

## Instalação e configuração do Prisma

Esta seção detalha os passos concretos de setup do Prisma como ORM de comunicação com o Postgres, complementando o requisito 5 acima.

### Passos de instalação

1. Instalar as dependências na pasta da API:
   ```bash
   npm install prisma --save-dev
   npm install @prisma/client
   ```
2. Inicializar o Prisma apontando para Postgres:
   ```bash
   npx prisma init --datasource-provider postgresql
   ```
   Isso cria `prisma/schema.prisma` e adiciona `DATABASE_URL` ao `.env`.
3. Configurar o `datasource` no `schema.prisma` para ler a URL via variável de ambiente (já validada pelo módulo de config — requisito 6):
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }

   generator client {
     provider = "prisma-client-js"
   }
   ```
4. Confirmar que `DATABASE_URL` aponta para o container Postgres definido na Spec 01 (host, porta, usuário, senha e nome do banco do `docker-compose.yml`).
5. Gerar o client após qualquer alteração de schema:
   ```bash
   npx prisma generate
   ```
6. Criar a primeira migration (mesmo que vazia nesta etapa, apenas para validar o pipeline):
   ```bash
   npx prisma migrate dev --name init
   ```

### Padrão de instanciação (singleton)

Criar `src/lib/prisma.ts` com instância única, evitando múltiplas conexões em hot-reload de desenvolvimento:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

Nenhum outro arquivo deve instanciar `PrismaClient` diretamente — todo acesso ao banco passa por esse módulo único.

### Suporte ao pgvector

Como o Prisma não tem suporte nativo ao tipo `vector` da extensão pgvector (necessário para a Spec 07), a migration inicial deve registrar a extensão via SQL puro dentro de uma migration do Prisma:

```sql
-- migration manual incluída no fluxo do Prisma
CREATE EXTENSION IF NOT EXISTS vector;
```

Colunas do tipo `vector` em si serão adicionadas via SQL bruto (`prisma db execute` ou migration manual) quando a Spec 04 for implementada — o Prisma schema vai referenciar esses campos como `Unsupported("vector(N)")`.

### Critérios de aceite adicionais

- [ ] `npx prisma migrate dev` roda com sucesso contra o Postgres do `docker-compose.yml`
- [ ] `npx prisma studio` abre e consegue visualizar o banco
- [ ] A instância do Prisma Client é importada de um único módulo em todo o projeto (validável por busca de `new PrismaClient()` no código — deve aparecer só uma vez)
- [ ] A extensão `vector` é confirmada como instalada após rodar as migrations iniciais
- [ ] Variável `DATABASE_URL` é validada pelo schema de configuração (Zod) descrito no requisito 1 desta spec, não lida diretamente do `process.env` em nenhum outro ponto

## Critérios de aceite

- [ ] Subir a aplicação sem uma variável de ambiente obrigatória derruba o processo com mensagem de erro clara apontando qual variável falta
- [ ] Uma chamada a uma rota inexistente retorna erro padronizado, não o erro cru do Node/Fastify
- [ ] Uma rota de teste com payload inválido retorna 400 com detalhe do campo que falhou na validação
- [ ] Logs aparecem em formato JSON estruturado no console
- [ ] `npm run lint` e `npm run format` rodam sem configuração adicional
- [ ] Commit com erro de lint é bloqueado pelo hook do Husky
- [ ] Módulo de config do LLM existe e exporta as credenciais/parâmetros sem nenhuma chamada de API real sendo feita ainda

## Fora de escopo (nesta spec)

- Autenticação de usuários/empresas e isolamento multi-tenant — tratado na Spec 03
- Qualquer schema de tabela de negócio — Spec 04
- Chamadas reais ao LLM — Spec 08
- Rate limiting e segurança avançada de API — pode virar spec própria na Camada 6 se o projeto evoluir para produto

## Riscos / pontos de atenção

- A decisão de autenticação e multi-tenancy já está coberta pela Spec 03, criada logo em seguida a esta.
