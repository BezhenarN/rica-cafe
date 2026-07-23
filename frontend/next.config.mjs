/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Проксируем /api → NestJS (по умолчанию http://localhost:3001), чтобы избежать CORS в dev.
  async rewrites() {
    const apiBase = process.env.BACKEND_URL ?? 'http://localhost:3001';
    return [
      { source: '/api/:path*', destination: `${apiBase}/api/:path*` },
    ];
  },
  images: {
    // Используем только локальные SVG-плейсхолдеры, но оставляем настройку для будущих фото.
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
