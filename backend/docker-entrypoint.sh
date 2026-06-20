#!/bin/sh
set -e

echo "Aplicando migraciones de Prisma..."
npx prisma migrate deploy

if [ "$RUN_SEED" = "true" ]; then
  echo "Ejecutando seed (roles, permisos, usuario administrador)..."
  node dist-seed/seed.js
fi

exec "$@"
