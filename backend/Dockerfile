# ===== Etapa 1: dependencias + build =====
FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npm run build

RUN npx tsc prisma/seed.ts --outDir dist-seed --module commonjs --target ES2021 \
    --esModuleInterop --skipLibCheck --resolveJsonModule --moduleResolution node

# ===== Etapa 2: dependencias de producción =====
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY prisma ./prisma
RUN npx prisma generate

# ===== Etapa 3: imagen final =====
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache openssl wget && \
    addgroup -S innovahuap && adduser -S innovahuap -G innovahuap

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-seed ./dist-seed
COPY package.json ./
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN mkdir -p /app/uploads && \
    chmod +x /usr/local/bin/docker-entrypoint.sh && \
    chown -R innovahuap:innovahuap /app

USER innovahuap

EXPOSE 3001
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
