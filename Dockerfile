# ── Stage 1: Install dependencies ──
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

RUN npm ci

# ── Stage 2: Build the Next.js app ──
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"

RUN npx prisma generate
RUN npx next build

# ── Stage 3: Production image ──
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/server.mjs ./
COPY --from=builder --chown=nextjs:nodejs /app/next.config.mjs ./
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./
COPY --from=builder --chown=nextjs:nodejs /app/src/generated ./src/generated

USER nextjs

EXPOSE 3000

CMD ["node", "server.mjs"]
