-- Evolution API (docker-compose service "evolution") requires DATABASE_PROVIDER +
-- DATABASE_CONNECTION_URI pointing at a real, existing database even when
-- DATABASE_ENABLED=false (see CLAUDE.md raiz, obstaculo 5.23) — its internal
-- deploy script fails otherwise. This runs once, on first container init.
SELECT 'CREATE DATABASE evolution_dev OWNER convoca'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'evolution_dev')\gexec
