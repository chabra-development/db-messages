# ============================
# Stage 1: Instalar dependencias
# ============================
FROM oven/bun:1.2-alpine AS deps
WORKDIR /app

COPY package.json bun.lock ./
# Sem --frozen-lockfile: lockfile pode ter sido gerado por versao diferente do Bun
RUN bun install

# ============================
# Stage 2: Build da aplicacao
# ============================
FROM oven/bun:1.2-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Placeholders so para satisfazer Zod validation em build time
# (prisma generate + next build importam env.ts e validam todas as envs required).
# Valores reais vem do .env em runtime.
ENV DATABASE_URL=postgresql://placeholder@localhost:5432/placeholder
ENV DIRECT_URL=postgresql://placeholder@localhost:5432/placeholder
ENV BETTER_AUTH_SECRET=placeholder_build_only_32_chars_minimum_xxxxx
ENV BETTER_AUTH_URL=http://localhost:3000
ENV STORAGE_ENDPOINT=http://localhost:9000
ENV STORAGE_BUCKET=placeholder
ENV STORAGE_ACCESS_KEY=placeholder
ENV STORAGE_SECRET_KEY=placeholder
ENV ROUTER_API_KEY=placeholder
ENV BLIP_DESK_API_KEY=placeholder
ENV GOOGLE_CLIENT_ID=placeholder
ENV GOOGLE_CLIENT_SECRET=placeholder

RUN bunx prisma generate --schema=./prisma/schema

# Build Next.js (standalone)
RUN bun run build

# ============================
# Stage 3: Runner de producao (Bun em vez de Node)
# Trocado de node:20-alpine para oven/bun:1.2-alpine para
# evitar pull bloqueado por docker credential helper em Session 0.
# Bun roda Next.js standalone via `bun server.js`.
# ============================
FROM oven/bun:1.2-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup -S -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nextjs

# Copiar arquivos publicos
COPY --from=builder /app/public ./public

# Copiar standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copiar node_modules inteiro do builder (Bun pode resolver deps de forma
# diferente do npm; listar pacote-por-pacote falha em obuf/postgres-range/etc).
# Custo: ~200MB a mais na imagem; benefício: build robusto.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copiar Prisma schema + config (para migrate deploy no entrypoint)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Copiar entrypoint
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
