# Muestra logs en vivo del stack (o de un servicio puntual).
# Uso: .\scripts\preprod-logs.ps1
#      .\scripts\preprod-logs.ps1 backend
param([string]$Service)

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if ($Service) {
    docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f --tail=200 $Service
} else {
    docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f --tail=200
}
