/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // API routes теперь part of the Next.js app — no rewrites to NestJS backend needed.
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
