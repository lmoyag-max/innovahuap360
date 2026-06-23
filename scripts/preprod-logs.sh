#!/bin/sh
# Muestra logs en vivo del stack (o de un servicio puntual).
# Uso: ./scripts/preprod-logs.sh [servicio]
#   ./scripts/preprod-logs.sh
#   ./scripts/preprod-logs.sh backend
set -e
cd "$(dirname "$0")/.."

docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f --tail=200 "$@"
