import { cn } from '@/lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-xl', className)} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="card flex flex-col gap-3 p-3">
      <Skeleton className="aspect-square w-full rounded-2xl" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-1/3" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>
    </div>
  );
}
