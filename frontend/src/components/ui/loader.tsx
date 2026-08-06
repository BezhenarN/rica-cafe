import { cn } from '@/lib/cn';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export function Loader({ size = 'md', className }: LoaderProps) {
  return (
    <div className={cn('animate-spin rounded-full border-2 border-current border-t-transparent opacity-60', sizeMap[size], className)}>
      <span className="sr-only">Загрузка...</span>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader size="lg" />
    </div>
  );
}
