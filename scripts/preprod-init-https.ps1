# Emite el certificado TLS de Let's Encrypt y deja Nginx sirviendo HTTPS.
#
# Requiere, antes de correr esto:
#   - DOMAIN_NAME y CERTBOT_EMAIL definidos en .env (raíz del repo).
#   - DNS de DOMAIN_NAME apuntando a este servidor.
#   - Puertos 80 y 443 abiertos al exterior en el firewall.
#   - El stack ya construido al menos una vez (.\scripts\preprod-up.ps1).
#
# Uso: .\scripts\preprod-init-https.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Test-Path .env)) {
  Write-Error "Falta .env en la raíz del repo (copia .env.example y completa DOMAIN_NAME/CERTBOT_EMAIL)."
  exit 1
}

$envContent = Get-Content .env
$domainLine = $envContent | Where-Object { $_ -match '^DOMAIN_NAME=' } | Select-Object -Last 1
$emailLine = $envContent | Where-Object { $_ -match '^CERTBOT_EMAIL=' } | Select-Object -Last 1
$DomainName = if ($domainLine) { ($domainLine -split '=', 2)[1] } else { '' }
$CertbotEmail = if ($emailLine) { ($emailLine -split '=', 2)[1] } else { '' }

if ([string]::IsNullOrWhiteSpace($DomainName)) {
  Write-Error "DOMAIN_NAME no está definido en .env (dominio público real, ej. innova.huap.cl)."
  exit 1
}
if ([string]::IsNullOrWhiteSpace($CertbotEmail)) {
  Write-Error "CERTBOT_EMAIL no está definido en .env (correo para avisos de renovación de Let's Encrypt)."
  exit 1
}

$composeFiles = @('-f', 'docker-compose.yml', '-f', 'docker-compose.prod.yml', '-f', 'docker-compose.https.yml')

Write-Host "==> Creando certificado autofirmado temporal para que Nginx pueda arrancar..."
$certScript = "mkdir -p /etc/letsencrypt/live/$DomainName && " +
  "openssl req -x509 -nodes -newkey rsa:2048 -days 1 " +
  "-keyout /etc/letsencrypt/live/$DomainName/privkey.pem " +
  "-out /etc/letsencrypt/live/$DomainName/fullchain.pem " +
  "-subj '/CN=localhost'"
docker compose @composeFiles run --rm --entrypoint sh certbot -c $certScript

Write-Host "==> Levantando el stack con Nginx usando el certificado temporal..."
docker compose @composeFiles up -d --build

Write-Host "==> Eliminando el certificado temporal..."
$cleanupScript = "rm -rf /etc/letsencrypt/live/$DomainName " +
  "/etc/letsencrypt/archive/$DomainName " +
  "/etc/letsencrypt/renewal/$DomainName.conf"
docker compose @composeFiles run --rm --entrypoint sh certbot -c $cleanupScript

Write-Host "==> Solicitando el certificado real a Let's Encrypt para $DomainName..."
docker compose @composeFiles run --rm --entrypoint certbot certbot certonly `
  --webroot -w /var/www/certbot `
  -d $DomainName `
  --email $CertbotEmail `
  --agree-tos --no-eff-email --non-interactive

Write-Host "==> Recargando Nginx con el certificado real..."
docker compose @composeFiles exec nginx nginx -s reload

Write-Host ""
Write-Host "Listo. Verificar con: curl -I https://$DomainName/api/health"
Write-Host "La renovación automática ya queda corriendo (contenedor 'certbot', cada 12h; Nginx recarga solo cada 12h para tomarla)."
