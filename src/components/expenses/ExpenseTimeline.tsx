import { motion } from 'framer-motion';
import type { Category, Expense } from '@/types';
import { groupExpensesByPeriod } from '@/utils/expenseGroups';
import { useCurrency } from '@/hooks/useCurrency';
import { formatDisplayDate } from '@/utils/dates';
import { isIncome } from '@/utils/transaction';
import { MerchantAvatar } from './MerchantAvatar';

interface ExpenseTimelineProps {
  expenses: Expense[];
  categoryMap: Map<string, Category>;
  onView: (expense: Expense) => void;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

export function ExpenseTimeline({
  expenses,
  categoryMap,
  onView,
  onEdit,
  onDelete,
}: ExpenseTimelineProps) {
  const { format } = useCurrency();
  const groups = groupExpensesByPeriod(expenses);

  return (
    <div className="space-y-8">
      {groups.map((group, gi) => (
        <section key={group.key}>
          <div className="mb-3 flex items-center gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">
              {group.label}
            </h3>
            <div className="h-px flex-1 bg-gradient-to-r from-accent/30 to-transparent" />
            <span className="font-mono text-xs text-fg-muted">
              {group.items.length}
            </span>
          </div>

          <div className="relative space-y-1 pl-1">
            <div className="absolute bottom-2 left-[23px] top-2 w-px bg-gradient-to-b from-accent/40 via-white/10 to-transparent" />

            {group.items.map((expense, i) => {
              const category = categoryMap.get(expense.categoryId);
              const income = isIncome(expense);
              return (
                <motion.article
                  key={expense.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: gi * 0.04 + i * 0.03 }}
                  whileHover={{ x: 4 }}
                  className="group relative flex cursor-pointer gap-4 rounded-2xl border border-transparent px-3 py-3 transition hover:border-cockpit-border-strong hover-surface"
                  onClick={() => onView(expense)}
                >
                  <MerchantAvatar
                    category={category}
                    description={expense.description}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-fg">
                            {expense.description || 'Transaction'}
                          </p>
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                              income
                                ? 'bg-success/15 text-success'
                                : 'surface-muted text-fg-muted'
                            }`}
                          >
                            {income ? 'Income' : 'Expense'}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          {category && (
                            <span
                              className="inline-flex rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                              style={{
                                backgroundColor: `${category.color}22`,
                                color: category.color,
                              }}
                            >
                              {category.name}
                            </span>
                          )}
                          <span className="text-xs text-fg-muted">
                            {formatDisplayDate(expense.date)}
                          </span>
                        </div>
                      </div>
                      <p
                        className={`shrink-0 font-mono text-sm font-semibold ${
                          income ? 'text-success' : 'text-fg'
                        }`}
                      >
                        {income ? '+' : '−'}
                        {format(expense.amount)}
                      </p>
                    </div>

                    <div className="mt-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(expense);
                        }}
                        className="rounded-lg px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-fg-muted hover:bg-surface-hover hover:text-accent"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(expense);
                        }}
                        className="rounded-lg px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-fg-muted hover:bg-danger/10 hover:text-danger"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
