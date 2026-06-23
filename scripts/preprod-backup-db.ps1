# Respalda la base de datos PostgreSQL a scripts\..\backups\.
# Uso: .\scripts\preprod-backup-db.ps1
# Nota: si se ejecuta directo en el servidor Docker (Linux), prefiere el script .sh equivalente.
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

New-Item -ItemType Directory -Force -Path backups | Out-Null
$ts = Get-Date -Format "yyyyMMdd_HHmmss"
$file = "backups/innovahuap360_$ts.sql"

$lines = docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T postgres `
    sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"'

[System.IO.File]::WriteAllLines($file, $lines, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "Backup creado en $file"
