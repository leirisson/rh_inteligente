-- Testes de integração (vitest) rodam contra convoca_test, criado manualmente
-- historicamente. `docker compose down -v` apaga o volume inteiro (inclusive
-- esse banco); recriá-lo automaticamente no init evita "Database `convoca_test`
-- does not exist" na primeira execução de `npm test` após um ambiente limpo.
SELECT 'CREATE DATABASE convoca_test OWNER convoca'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'convoca_test')\gexec
