import { cn } from '@/lib/cn';
import type { ImageType } from '@/lib/types';

/** Цветовые схемы для каждого типа блюда. */
const PALETTE: Record<ImageType, { bg: string; fg: string; accent: string }> = {
  PIZZA:    { bg: '#FFF3E0', fg: '#E65100', accent: '#FF9800' },
  BURGER:   { bg: '#FBE9E7', fg: '#BF360C', accent: '#FF5722' },
  SALAD:    { bg: '#E8F5E9', fg: '#1B5E20', accent: '#4CAF50' },
  SOUP:     { bg: '#FFF8E1', fg: '#F57F17', accent: '#FFC107' },
  DRINK:    { bg: '#E3F2FD', fg: '#0D47A1', accent: '#42A5F5' },
  DESSERT:  { bg: '#FCE4EC', fg: '#880E4F', accent: '#EC407A' },
  SNACK:    { bg: '#F3E5F5', fg: '#4A148C', accent: '#AB47BC' },
  OTHER:    { bg: '#ECEFF1', fg: '#37474F', accent: '#90A4AE' },
};

/** Простые SVG-иконки для каждого типа. */
function TypeIcon({ type, color }: { type: ImageType; color: string }) {
  const s = 40;
  switch (type) {
    case 'PIZZA':
      return (
        <svg viewBox="0 0 48 48" className="h-10 w-10 sm:h-12 sm:w-12" fill="none">
          <circle cx="24" cy="24" r="18" stroke={color} strokeWidth="2" />
          <circle cx="18" cy="20" r="3" fill={color} opacity={0.5} />
          <circle cx="30" cy="18" r="3" fill={color} opacity={0.5} />
          <circle cx="24" cy="30" r="3" fill={color} opacity={0.5} />
        </svg>
      );
    case 'BURGER':
      return (
        <svg viewBox="0 0 48 48" className="h-10 w-10 sm:h-12 sm:w-12" fill="none">
          <path d="M8 28h32" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M10 22c0-6 6-10 14-10s14 4 14 10" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M12 34c0 2 2 3 12 3s12-1 12-3" stroke={color} strokeWidth="2" />
        </svg>
      );
    case 'SALAD':
      return (
        <svg viewBox="0 0 48 48" className="h-10 w-10 sm:h-12 sm:w-12" fill="none">
          <ellipse cx="24" cy="28" rx="14" ry="10" stroke={color} strokeWidth="2" />
          <path d="M24 18v-6M20 20l-4-4M28 20l4-4" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'SOUP':
      return (
        <svg viewBox="0 0 48 48" className="h-10 w-10 sm:h-12 sm:w-12" fill="none">
          <path d="M8 20h32v14a6 6 0 01-6 6H14a6 6 0 01-6-6V20z" stroke={color} strokeWidth="2" />
          <path d="M14 16c0-2 2-4 4-4M24 14c0-2 2-4 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity={0.5} />
        </svg>
      );
    case 'DRINK':
      return (
        <svg viewBox="0 0 48 48" className="h-10 w-10 sm:h-12 sm:w-12" fill="none">
          <rect x="14" y="12" width="20" height="26" rx="3" stroke={color} strokeWidth="2" />
          <path d="M12 18h24" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <path d="M20 8h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'DESSERT':
      return (
        <svg viewBox="0 0 48 48" className="h-10 w-10 sm:h-12 sm:w-12" fill="none">
          <path d="M14 34l4-16h12l4 16z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
          <circle cx="24" cy="14" r="4" stroke={color} strokeWidth="2" />
        </svg>
      );
    case 'SNACK':
      return (
        <svg viewBox="0 0 48 48" className="h-10 w-10 sm:h-12 sm:w-12" fill="none">
          <rect x="12" y="18" width="24" height="14" rx="2" stroke={color} strokeWidth="2" />
          <path d="M18 18v-4M24 18v-6M30 18v-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 48 48" className="h-10 w-10 sm:h-12 sm:w-12" fill="none">
          <circle cx="24" cy="24" r="12" stroke={color} strokeWidth="2" />
        </svg>
      );
  }
}

interface ProductImageProps {
  imageType?: ImageType;
  name?: string;
  className?: string;
  /** Для совместимости с next/image, но мы рендерим SVG inline. */
  alt?: string;
  priority?: boolean;
}

/**
 * SVG-плейсхолдер для изображений блюд.
 * Замените на <Image src={...}> при подключении реальных фото.
 */
export function ProductImage({ imageType = 'OTHER', name, className }: ProductImageProps) {
  const { bg, fg } = PALETTE[imageType] ?? PALETTE.OTHER;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl',
        className,
      )}
      style={{ backgroundColor: bg }}
    >
      <TypeIcon type={imageType} color={fg} />
      {name && (
        <span className="px-3 text-center text-xs font-semibold" style={{ color: fg }}>
          {name}
        </span>
      )}
    </div>
  );
}
