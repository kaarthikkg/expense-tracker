import type { Category } from '@/types';

interface MerchantAvatarProps {
  category?: Category;
  description?: string;
  size?: 'sm' | 'md';
}

export function MerchantAvatar({ category, description, size = 'md' }: MerchantAvatarProps) {
  const letter = (description?.trim() || category?.name || '?')[0].toUpperCase();
  const dim = size === 'sm' ? 'h-10 w-10 text-sm' : 'h-12 w-12 text-base';

  return (
    <div
      className={`${dim} flex shrink-0 items-center justify-center rounded-xl font-semibold text-white shadow-lg`}
      style={{
        background: category
          ? `linear-gradient(135deg, ${category.color}, ${category.color}99)`
          : 'linear-gradient(135deg, #5B8CFF, #7c3aed)',
        boxShadow: category ? `0 4px 20px ${category.color}33` : undefined,
      }}
    >
      {letter}
    </div>
  );
}
