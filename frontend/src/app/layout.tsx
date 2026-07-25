import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { ToastProvider } from '@/components/ui/toast';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { MobileNav } from '@/components/layout/mobile-nav';
import { MobileMenu } from '@/components/layout/mobile-menu';
import { CartDrawer } from '@/components/cart/cart-drawer';
import { AuthHydrator } from '@/components/layout/auth-hydrator';

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL('https://rica-cafe-clean2.vercel.app'),
  title: {
    default: 'Рица — кафе и доставка, Сочи',
    template: '%s · Рица',
  },
  description:
    'Кафе «Рица» в Сочи: сувлаки, морепродукты, грузинская кухня, пицца и напитки. Доставка и самовывоз.',
  applicationName: 'Рица',
  manifest: '/manifest.json',
  keywords: [
    'кафе Сочи', 'доставка еды Сочи', 'сувлаки Сочи', 'морепродукты Сочи',
    'грузинская кухня Сочи', 'рица кафе', 'пицца Сочи', 'самовывоз Сочи',
  ],
  openGraph: {
    type: 'website',
    siteName: 'Рица',
    title: 'Рица — кафе и доставка, Сочи',
    description: 'Сувлаки, морепродукты, грузинская кухня и пицца. Доставка и самовывоз.',
  },
  twitter: { card: 'summary_large_image' },
  icons: { icon: '/icons/icon.svg', apple: '/icons/icon.svg' },
};

export const viewport: Viewport = {
  themeColor: '#0B6E6E',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={inter.variable}>
      <body className="min-h-screen font-sans">
        <Providers>
          <ToastProvider>
            <AuthHydrator />
            <Header />
            <MobileMenu />
            <main className="pb-20 lg:pb-0">{children}</main>
            <Footer />
            <MobileNav />
            <CartDrawer />
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
