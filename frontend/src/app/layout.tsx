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
  metadataBase: new URL('https://crudo.example.com'),
  title: {
    default: 'Crudo — доставка пиццы и готовых блюд',
    template: '%s · Crudo',
  },
  description:
    'Закажите свежую пиццу и готовые блюда с доставкой. Соберите пиццу в конструкторе, отслеживайте заказ в реальном времени.',
  applicationName: 'Crudo',
  manifest: '/manifest.json',
  keywords: ['доставка пиццы', 'доставка еды', 'конструктор пиццы', 'кафе', 'Crudo'],
  openGraph: {
    type: 'website',
    siteName: 'Crudo',
    title: 'Crudo — доставка пиццы и готовых блюд',
    description: 'Соберите пиццу в конструкторе и отследите заказ в реальном времени.',
  },
  twitter: { card: 'summary_large_image' },
  icons: { icon: '/icons/icon.svg', apple: '/icons/icon.svg' },
};

export const viewport: Viewport = {
  themeColor: '#0D5C57',
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
