# Detiene el stack de InnovaHUAP 360 (los volumenes persistentes no se borran).
# Uso: .\scripts\preprod-down.ps1
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

docker compose -f docker-compose.yml -f docker-compose.prod.yml down
