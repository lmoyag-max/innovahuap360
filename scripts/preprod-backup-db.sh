#!/bin/sh
# Respalda la base de datos PostgreSQL a scripts/../backups/.
# Uso: ./scripts/preprod-backup-db.sh
set -e
cd "$(dirname "$0")/.."

mkdir -p backups
ts=$(date +%Y%m%d_%H%M%S)
file="backups/innovahuap360_${ts}.sql"

docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T postgres \
  sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > "$file"

echo "Backup creado en $file"
