// Prevent prerender of checkout — client-side form interactions need JS
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
