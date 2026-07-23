#!/bin/sh
# Emite el certificado TLS de Let's Encrypt y deja Nginx sirviendo HTTPS.
#
# Requiere, antes de correr esto:
#   - DOMAIN_NAME y CERTBOT_EMAIL definidos en .env (raíz del repo).
#   - DNS de DOMAIN_NAME apuntando a este servidor.
#   - Puertos 80 y 443 abiertos al exterior en el firewall.
#   - El stack ya construido al menos una vez (./scripts/preprod-up.sh).
#
# Uso: ./scripts/preprod-init-https.sh
set -e
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "Falta .env en la raíz del repo (copia .env.example y completa DOMAIN_NAME/CERTBOT_EMAIL)." >&2
  exit 1
fi

DOMAIN_NAME=$(grep -E '^DOMAIN_NAME=' .env | tail -n1 | cut -d= -f2-)
CERTBOT_EMAIL=$(grep -E '^CERTBOT_EMAIL=' .env | tail -n1 | cut -d= -f2-)

if [ -z "$DOMAIN_NAME" ]; then
  echo "DOMAIN_NAME no está definido en .env (dominio público real, ej. innova.huap.cl)." >&2
  exit 1
fi
if [ -z "$CERTBOT_EMAIL" ]; then
  echo "CERTBOT_EMAIL no está definido en .env (correo para avisos de renovación de Let's Encrypt)." >&2
  exit 1
fi

COMPOSE="docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.https.yml"

echo "==> Creando certificado autofirmado temporal para que Nginx pueda arrancar..."
$COMPOSE run --rm --entrypoint sh certbot -c "
  mkdir -p /etc/letsencrypt/live/$DOMAIN_NAME && \
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout /etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem \
    -out /etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem \
    -subj '/CN=localhost'
"

echo "==> Levantando el stack con Nginx usando el certificado temporal..."
$COMPOSE up -d --build

echo "==> Eliminando el certificado temporal..."
$COMPOSE run --rm --entrypoint sh certbot -c "
  rm -rf /etc/letsencrypt/live/$DOMAIN_NAME \
         /etc/letsencrypt/archive/$DOMAIN_NAME \
         /etc/letsencrypt/renewal/$DOMAIN_NAME.conf
"

echo "==> Solicitando el certificado real a Let's Encrypt para $DOMAIN_NAME..."
$COMPOSE run --rm --entrypoint certbot certbot certonly \
  --webroot -w /var/www/certbot \
  -d "$DOMAIN_NAME" \
  --email "$CERTBOT_EMAIL" \
  --agree-tos --no-eff-email --non-interactive

echo "==> Recargando Nginx con el certificado real..."
$COMPOSE exec nginx nginx -s reload

echo ""
echo "Listo. Verificar con: curl -I https://$DOMAIN_NAME/api/health"
echo "La renovación automática ya queda corriendo (contenedor 'certbot', cada 12h; Nginx recarga solo cada 12h para tomarla)."
