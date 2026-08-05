/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Docker & standalone server deployment
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
