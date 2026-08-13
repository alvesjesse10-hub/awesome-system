# Build único para deploy no Railway: gera o build do frontend, o build do
# backend, e empacota os dois num único serviço Node (o Nest serve a API em
# /api e os arquivos estáticos do frontend, com fallback de SPA — ver
# backend/src/main.ts). Root Directory do serviço no Railway deve ser a raiz
# do repositório (onde este arquivo está).

# ---- Frontend ----
FROM node:20-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- Backend ----
FROM node:20-slim AS backend-build
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY backend/ ./
RUN npx prisma generate
RUN npm run build

# ---- Runtime ----
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY backend/package.json backend/package-lock.json ./
# npm ci completo (não --omit=dev): "prisma" (CLI, usado no start para
# aplicar migrations) e "ts-node" (usado pelo prisma:seed) são devDependencies.
RUN npm ci

COPY --from=backend-build /app/backend/prisma ./prisma
RUN npx prisma generate

COPY --from=backend-build /app/backend/dist ./dist
COPY --from=frontend-build /app/frontend/dist ./public

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
