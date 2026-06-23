# Restaura la base de datos PostgreSQL desde un archivo de backup.
# ADVERTENCIA: sobrescribe los datos actuales.
# Uso: .\scripts\preprod-restore-db.ps1 backups\innovahuap360_20260623_120000.sql
# Nota: si se ejecuta directo en el servidor Docker (Linux), prefiere el script .sh equivalente.
param([Parameter(Mandatory = $true)][string]$BackupFile)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Test-Path $BackupFile)) {
    Write-Error "No existe el archivo: $BackupFile"
    exit 1
}

Write-Host "ADVERTENCIA: esto sobrescribe la base de datos actual con el contenido de $BackupFile"
$confirm = Read-Host "Escribe RESTAURAR para confirmar"
if ($confirm -ne "RESTAURAR") {
    Write-Host "Cancelado."
    exit 1
}

Get-Content -Path $BackupFile -Encoding UTF8 | docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T postgres `
    sh -c 'psql -U "$POSTGRES_USER" "$POSTGRES_DB"'

Write-Host "Restauracion completada."
