/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Rewrite /api/* → backend только в dev (когда BACKEND_URL указывает на localhost).
  // В production Next.js ходит напрямую к NEXT_PUBLIC_API_URL (CORS).
  async rewrites() {
    const apiBase = process.env.BACKEND_URL ?? 'http://localhost:3001';
    if (apiBase.startsWith('http://localhost') || apiBase.startsWith('http://127.0.0.1')) {
      return [{ source: '/api/:path*', destination: `${apiBase}/api/:path*` }];
    }
    return []; // production: CORS, direct calls
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
