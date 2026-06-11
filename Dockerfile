# ---- Dependencias ----
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- Build ----
FROM node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Las variables de la app NO se necesitan aquí: se leen en runtime
RUN npm run build

# ---- Runtime ----
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# Migraciones SQL: se aplican solas al arrancar (lib/db/index.ts)
COPY --from=builder /app/drizzle ./drizzle

RUN mkdir -p /app/data && chown -R node:node /app
USER node

VOLUME /app/data
EXPOSE 3000

CMD ["node", "server.js"]
