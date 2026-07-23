'use client';

import { useState, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';

export function Providers({ children }: { children: ReactNode }) {
  // React Query recommends creating client inside provider to avoid shared state in SSR.
  const [client] = useState(() => queryClient);

  return (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}
