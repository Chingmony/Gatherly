FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
RUN addgroup -S gatherly && adduser -S gatherly -G gatherly
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder --chown=gatherly:gatherly /app/.next/standalone ./
COPY --from=builder --chown=gatherly:gatherly /app/.next/static ./.next/static
USER gatherly
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD wget -q --spider http://localhost:3000 || exit 1
CMD ["node", "server.js"]
