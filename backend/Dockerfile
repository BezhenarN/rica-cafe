FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci 2>/dev/null || npm install
COPY . .
RUN npx prisma generate && npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/uploads ./uploads
RUN npx prisma generate

# Создаём директорию для загрузок фото (пригодится для image upload)
RUN mkdir -p /app/uploads/products

EXPOSE 3001
# amvera-healthcheck: Amvera healthcheck запросит /api/health
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD wget -qO- http://localhost:3001/api/health || exit 1
CMD ["node", "dist/main.js"]
