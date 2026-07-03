# Sprints — Convoca API

Cada sprint é derivada diretamente das specs (`api/specs/`). A divisão respeita as camadas de dependência do `00-index.md` das specs: nenhum sprint começa sem que o anterior esteja completo.

## Mapeamento Spec → Sprint

| Sprint | Specs cobertas | Camada | Arquivo |
|--------|---------------|--------|---------|
| Sprint 1 | 01 + 02 | Infraestrutura + Configuração base | [sprint-01.md](sprint-01.md) |
| Sprint 2 | 03 + 04 | Autenticação + Modelagem do banco | [sprint-02.md](sprint-02.md) |
| Sprint 3 | 05 + 06 | CRUD empresas/vagas + candidatos | [sprint-03.md](sprint-03.md) |
| Sprint 4 | 07 + 08 | Matching engine + Agente LangGraph | [sprint-04.md](sprint-04.md) |
| Sprint 5 | 09 + 10 + 11 | WhatsApp + Fases + Agendamento | [sprint-05.md](sprint-05.md) |
| Sprint 6 | 12 + 13 | Testes automatizados + Deploy | [sprint-06.md](sprint-06.md) |

## Regras

- Uma sprint nunca começa sem a anterior estar com todos os critérios de aceite validados.
- As specs são a fonte de verdade — tasks e planos são derivados delas, nunca o contrário.
- Ao completar uma sprint, atualizar o status aqui e no `claude.md` raiz.

## Status

| Sprint | Camada | Status |
|--------|--------|--------|
| Sprint 1 | Infraestrutura + Configuração base | ✅ Concluída |
| Sprint 2 | Autenticação + Modelagem do banco | ✅ Concluída |
| Sprint 3 | CRUD empresas/vagas + candidatos | ✅ Concluída |
| Sprint 4 | Matching engine + Agente LangGraph | ✅ Concluída |
| Sprint 5 | WhatsApp + Fases + Agendamento | ✅ Concluída |
| Sprint 6 | Testes automatizados + Deploy | 🔒 Aguarda Sprint 5 |
