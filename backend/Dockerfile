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
RUN npx prisma generate

EXPOSE 3001
CMD ["node", "dist/main.js"]
