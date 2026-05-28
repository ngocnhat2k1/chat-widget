# Multi-stage Dockerfile for @chat-widget/backend
# Render config: Root Directory = . (repo root), Dockerfile Path = apps/backend/Dockerfile

# ---------- Stage 1: build ----------
FROM node:20-alpine AS build
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /repo

# Copy workspace manifests first for better layer caching
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/backend/package.json apps/backend/
COPY packages/eslint-config-custom/package.json packages/eslint-config-custom/
COPY packages/tsconfig/package.json packages/tsconfig/
COPY packages/ui/package.json packages/ui/

RUN pnpm install --frozen-lockfile

# Copy the rest of the sources and build the backend
COPY . .
WORKDIR /repo/apps/backend
RUN pnpm prisma generate
RUN pnpm build

# Produce a self-contained deploy bundle (prod-only deps, hoisted)
WORKDIR /repo
RUN pnpm --filter @chat-widget/backend deploy --prod /out

# ---------- Stage 2: runtime ----------
FROM node:20-alpine AS runtime
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY --from=build /out/package.json ./package.json
COPY --from=build /out/node_modules ./node_modules
COPY --from=build /out/dist ./dist
COPY --from=build /out/prisma ./prisma

EXPOSE 3001

CMD ["sh", "-c", "npx -y prisma@5 db push --skip-generate && node dist/main.js"]
