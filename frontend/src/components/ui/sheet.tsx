'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  children: React.ReactNode;
  className?: string;
}

const sideMap: Record<string, string> = {
  right: 'right-0 top-0 h-full w-80 border-l data-[state=closed]:slide-from-right data-[state=open]:slide-in-right',
  left: 'left-0 top-0 h-full w-80 border-r data-[state=closed]:slide-from-left data-[state=open]:slide-in-left',
  top: 'top-0 left-0 h-auto w-full border-b data-[state=closed]:slide-from-top data-[state=open]:slide-in-top',
  bottom: 'bottom-0 left-0 h-auto w-full border-t data-[state=closed]:slide-from-bottom data-[state=open]:slide-in-bottom',
};

export function Sheet({ open, onClose, title, side = 'right', children, className }: SheetProps) {
  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
        onClick={onClose}
      />
      {/* Content */}
      <div
        className={cn(
          'fixed z-50 flex flex-col bg-surface p-6 shadow-lg transition-all duration-300 ease-out',
          sideMap[side],
          className,
        )}
      >
        <div className="flex items-center justify-between pb-4">
          {title && <h2 className="text-lg font-bold">{title}</h2>}
          <button
            className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
            onClick={onClose}
            aria-label="Закрыть"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </>
  );
}
