#!/bin/sh
set -e

echo "🚀 Starting fullstack app..."

# Create required directories
mkdir -p /app/backend/uploads/products
mkdir -p /var/log/nginx

# Start Nginx
echo "▶ Starting Nginx..."
nginx

# Start NestJS Backend
echo "▶ Starting NestJS Backend on port 3001..."
cd /app/backend
PORT=3001 \
DATABASE_URL=${DATABASE_URL} \
JWT_SECRET=${JWT_SECRET} \
CORS_ORIGIN=${CORS_ORIGIN} \
ADMIN_EMAIL=${ADMIN_EMAIL} \
ADMIN_PASSWORD=${ADMIN_PASSWORD} \
node dist/main.js &

# Start Next.js Frontend
echo "▶ Starting Next.js Frontend on port 3000..."
cd /app/frontend
NEXT_PUBLIC_API_URL=http://localhost:3001 \
node node_modules/.bin/next start -p 3000 -H 0.0.0.0 &

echo "✅ All services started!"
echo "   Nginx: http://localhost:80"
echo "   NestJS: http://localhost:3001"
echo "   Next.js: http://localhost:3000"

# Wait for all background processes
wait
