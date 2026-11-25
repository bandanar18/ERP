# ============================================================
# BUSINESS ERP — Dockerfile multi-stage (Railway / cualquier host)
#
# Stage 1 (builder): instala deps con pnpm y buildea frontend + backend
#                    (turbo, excluyendo la app móvil Expo).
# Stage 2 (runner):  Node 22 + Chromium (para exports PDF del módulo QC)
#                    y arranca el backend servido desde dist/.
# ============================================================

# ---------- Stage 1: build ----------
FROM node:22-bookworm-slim AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="/pnpm:$PATH"
RUN corepack enable && corepack prepare pnpm@11.2.2 --activate

WORKDIR /app

# Dependencias primero (cache-friendly): solo los package.json + lockfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json
COPY apps/business-erp-app/package.json apps/business-erp-app/package.json
RUN pnpm install --frozen-lockfile

# Código completo y build (frontend + backend únicamente)
COPY . .
RUN pnpm turbo run build --filter=frontend --filter=backend

# ---------- Stage 2: runtime ----------
FROM node:22-bookworm-slim AS runner

ENV NODE_ENV=production
ENV PORT=3000
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
# Directorio de uploads — en Railway montar un volumen en /app/data y
# dejar UPLOADS_DIR=/app/data/uploads (persiste entre deploys).
ENV UPLOADS_DIR=/app/data/uploads

# Chromium + fuentes + librerías necesarias para html-pdf-node / puppeteer
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    fonts-noto-color-emoji \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc-s1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# node_modules (incluye devDeps: prisma CLI + tsx para runtime) + artefactos
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=builder /app/apps/frontend/node_modules ./apps/frontend/node_modules
COPY --from=builder /app/apps/backend/src ./apps/backend/src
COPY --from=builder /app/apps/backend/tsconfig.json ./apps/backend/tsconfig.json
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/apps/backend/docs ./apps/backend/docs
COPY --from=builder /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=builder /app/apps/frontend/dist ./apps/frontend/dist
COPY --from=builder /app/apps/frontend/package.json ./apps/frontend/package.json
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml /app/turbo.json ./
COPY --from=builder /app/apps/business-erp-app/package.json ./apps/business-erp-app/package.json
COPY --from=builder /app/apps/backend/prisma.config.js ./apps/backend/prisma.config.js

# Directorio de uploads (efímero sin volumen — Railway: montar volumen en /app/data)
RUN mkdir -p /app/data/uploads

WORKDIR /app/apps/backend
EXPOSE 3000

# Migraciones al arrancar + servidor con tsx (el dist de tsc usa imports de
# directorio que Node ESM no resuelve; tsx sí — mismo runtime que el dev).
# El seed corre solo si SEED_ON_BOOT=true (ej: primera vez, para crear el admin
# y usuarios de prueba). Es idempotente; se puede quitar la variable después.
CMD ["sh", "-c", "npx prisma migrate deploy && if [ \"$SEED_ON_BOOT\" = \"true\" ]; then npx prisma db seed; fi && NODE_ENV=production npx tsx src/index.ts"]
