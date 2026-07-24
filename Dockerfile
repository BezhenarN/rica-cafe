# =============================================================================
# Stage 1: NestJS Backend
# =============================================================================
FROM node:22-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci 2>/dev/null || npm install
COPY backend/ .
RUN npx prisma generate && npm run build

# =============================================================================
# Stage 2: Next.js Frontend
# =============================================================================
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci 2>/dev/null || npm install
COPY frontend/ .
# NEXT_PUBLIC_API_URL будет заменён при запуске через env
RUN NEXT_PUBLIC_API_URL=http://localhost:3001 npm run build

# =============================================================================
# Stage 3: Final Image
# =============================================================================
FROM node:22-alpine

# Install Nginx and healthcheck tools
RUN apk add --no-cache nginx openssl curl

WORKDIR /app

# Copy backend
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /app/backend/prisma ./backend/prisma
COPY --from=backend-builder /app/backend/uploads ./backend/uploads
COPY --from=backend-builder /app/backend/package*.json ./backend/
COPY --from=backend-builder /app/backend/src ./backend/src
COPY --from=backend-builder /app/backend/tsconfig*.json ./backend/
COPY --from=backend-builder /app/backend/nest-cli.json ./backend/

# Copy frontend
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder /app/frontend/node_modules ./frontend/node_modules
COPY --from=frontend-builder /app/frontend/public ./frontend/public
COPY --from=frontend-builder /app/frontend/package*.json ./frontend/
COPY --from=frontend-builder /app/frontend/next.config.* ./frontend/
COPY --from=frontend-builder /app/frontend/src ./frontend/src

# Prisma for backend
RUN cd backend && npx prisma generate

# Create uploads directory
RUN mkdir -p /app/backend/uploads/products

# Copy Nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy startup script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:80/api/health || exit 1

CMD ["/docker-entrypoint.sh"]
