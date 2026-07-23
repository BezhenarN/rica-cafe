'use client';

import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';

interface QuantityStepperProps {
  value: number;
  onChange: (v: number) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function QuantityStepper({ value, onChange, size = 'md', className }: QuantityStepperProps) {
  const isSm = size === 'sm';
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-line bg-surface',
        isSm ? 'h-8' : 'h-10',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        className={cn(
          'flex items-center justify-center rounded-full transition hover:bg-line',
          isSm ? 'h-7 w-7' : 'h-9 w-9',
        )}
        aria-label="Уменьшить"
      >
        <Minus className={isSm ? 'h-3 w-3' : 'h-4 w-4'} />
      </button>
      <span className={cn('w-6 text-center font-semibold tabular-nums', isSm ? 'text-sm' : 'text-base')}>
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className={cn(
          'flex items-center justify-center rounded-full transition hover:bg-line',
          isSm ? 'h-7 w-7' : 'h-9 w-9',
        )}
        aria-label="Увеличить"
      >
        <Plus className={isSm ? 'h-3 w-3' : 'h-4 w-4'} />
      </button>
    </div>
  );
}
