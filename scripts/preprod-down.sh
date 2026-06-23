#!/bin/sh
# Detiene el stack de InnovaHUAP 360 (los volumenes persistentes no se borran).
# Uso: ./scripts/preprod-down.sh
set -e
cd "$(dirname "$0")/.."

docker compose -f docker-compose.yml -f docker-compose.prod.yml down
