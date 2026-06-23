# Levanta el stack de InnovaHUAP 360 en modo preproductivo.
# Uso: .\scripts\preprod-up.ps1
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
