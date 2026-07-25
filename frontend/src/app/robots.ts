import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/account', '/admin', '/checkout', '/cart'] },
    sitemap: 'https://rica-cafe-clean2.vercel.app/sitemap.xml',
  };
}
