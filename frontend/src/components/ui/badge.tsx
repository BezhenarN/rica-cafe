import * as React from 'react';
import { cn } from '@/lib/cn';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'danger' | 'success';
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium transition',
          variant === 'default' && 'bg-surface text-foreground',
          variant === 'primary' && 'bg-primary/10 text-primary',
          variant === 'danger' && 'bg-red-600/10 text-red-700 dark:bg-red-600/20 dark:text-red-400',
          variant === 'success' && 'bg-emerald-600/10 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400',
          className,
        )}
        {...props}
      />
    );
  },
);
Badge.displayName = 'Badge';

export { Badge };
