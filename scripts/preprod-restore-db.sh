#!/bin/sh
# Restaura la base de datos PostgreSQL desde un archivo de backup.
# ADVERTENCIA: sobrescribe los datos actuales.
# Uso: ./scripts/preprod-restore-db.sh backups/innovahuap360_20260623_120000.sql
set -e
cd "$(dirname "$0")/.."

file="$1"
if [ -z "$file" ]; then
  echo "Uso: $0 <archivo_backup.sql>" >&2
  exit 1
fi
if [ ! -f "$file" ]; then
  echo "No existe el archivo: $file" >&2
  exit 1
fi

echo "ADVERTENCIA: esto sobrescribe la base de datos actual con el contenido de $file"
printf "Escribe RESTAURAR para confirmar: "
read confirm
if [ "$confirm" != "RESTAURAR" ]; then
  echo "Cancelado."
  exit 1
fi

docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T postgres \
  sh -c 'psql -U "$POSTGRES_USER" "$POSTGRES_DB"' < "$file"

echo "Restauracion completada."
