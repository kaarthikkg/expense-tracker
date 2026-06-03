import { motion } from 'framer-motion';
import type { Expense } from '@/types';
import type { Category } from '@/types';
import { useCurrency } from '@/hooks/useCurrency';
import { formatDisplayDate } from '@/utils/dates';
import { MerchantAvatar } from './MerchantAvatar';

interface ExpenseListItemProps {
  expense: Expense;
  category?: Category;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/** Single-row variant (legacy); prefer ExpenseTimeline on list pages. */
export function ExpenseListItem({
  expense,
  category,
  onView,
  onEdit,
  onDelete,
}: ExpenseListItemProps) {
  const { format } = useCurrency();
  return (
    <motion.li
      whileHover={{ x: 4 }}
      className="group flex list-none items-center gap-4 rounded-2xl border border-cockpit-border px-4 py-3 transition hover-surface"
    >
      <MerchantAvatar category={category} description={expense.description} size="sm" />
      <button type="button" className="min-w-0 flex-1 text-left" onClick={onView}>
        <p className="truncate font-medium">{expense.description || 'Transaction'}</p>
        <p className="text-xs text-fg-muted">
          {category?.name ?? 'Unknown'} · {formatDisplayDate(expense.date)}
        </p>
      </button>
      <p className="font-mono text-sm font-semibold">{format(expense.amount)}</p>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100">
        <button type="button" onClick={onEdit} className="text-xs text-accent">
          Edit
        </button>
        <button type="button" onClick={onDelete} className="text-xs text-danger">
          Del
        </button>
      </div>
    </motion.li>
  );
}
