#!/bin/sh
# Levanta el stack de InnovaHUAP 360 en modo preproductivo.
# Uso: ./scripts/preprod-up.sh
set -e
cd "$(dirname "$0")/.."

docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
