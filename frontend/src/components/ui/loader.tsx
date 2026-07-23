import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

interface LoaderProps {
  className?: string;
  size?: 'sm' | 'md';
}

export function Loader({ className, size = 'md' }: LoaderProps) {
  return (
    <Loader2
      className={cn(
        'animate-spin text-primary',
        size === 'sm' ? 'h-4 w-4' : 'h-6 w-6',
        className,
      )}
    />
  );
}

/** Центрированный экран загрузки для страниц. */
export function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader size="md" />
    </div>
  );
}
