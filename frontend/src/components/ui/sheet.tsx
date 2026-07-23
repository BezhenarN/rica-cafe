'use client';

import { Fragment, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  side?: 'right' | 'bottom';
}

/** Slide-over панель (справа на десктопе, снизу на мобиле). */
export function Sheet({ open, onClose, title, children, side = 'right' }: SheetProps) {
  const isBottom = side === 'bottom';

  return (
    <AnimatePresence>
      {open && (
        <Fragment>
          {/* Оверлей */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Панель */}
          <motion.div
            initial={isBottom ? { y: '100%' } : { x: '100%' }}
            animate={isBottom ? { y: 0 } : { x: 0 }}
            exit={isBottom ? { y: '100%' } : { x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className={cn(
              'fixed z-50 bg-surface shadow-pop',
              isBottom
                ? 'inset-x-0 bottom-0 max-h-[85vh] rounded-t-3xl'
                : 'inset-y-0 right-0 w-full max-w-md',
            )}
          >
            {title && (
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <h2 className="text-lg font-bold">{title}</h2>
                <button onClick={onClose} className="btn-ghost rounded-full p-2" aria-label="Закрыть">
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
            <div className={cn('overflow-y-auto', isBottom ? 'max-h-[calc(85vh-4rem)]' : 'h-full')}>
              {children}
            </div>
          </motion.div>
        </Fragment>
      )}
    </AnimatePresence>
  );
}
