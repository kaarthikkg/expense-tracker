import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { Loan } from '@/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PageShell } from '@/components/layout/PageShell';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { CategoryPieChart } from '@/components/charts/CategoryPieChart';
import { LoanForm } from '@/components/loans/LoanForm';
import { NetWorthCompact } from '@/components/dashboard/NetWorthCompact';
import { useCurrency } from '@/hooks/useCurrency';
import { useNetWorth } from '@/hooks/useNetWorth';
import { useLoanStore } from '@/store/loanStore';
import {
  LOAN_TYPE_META,
  computeLoansSummary,
  loanHasEmi,
  loanRepaid,
  loanRepaidPercent,
  outstandingByLoanType,
} from '@/utils/loans';
import { formatDisplayDate } from '@/utils/dates';

function SummaryStat({
  label,
  value,
  sub,
  accent = 'default',
  delay = 0,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: 'default' | 'danger' | 'warning';
  delay?: number;
}) {
  const accentClass =
    accent === 'danger' ? 'text-danger' : accent === 'warning' ? 'text-warning' : 'text-fg';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="glass-panel rounded-2xl p-5"
    >
      <p className="text-[11px] font-medium uppercase tracking-widest text-fg-muted">{label}</p>
      <p className={`mt-2 font-mono text-2xl font-semibold tracking-tight sm:text-3xl ${accentClass}`}>
        {value}
      </p>
      {sub && <p className="mt-1.5 text-xs text-fg-secondary">{sub}</p>}
    </motion.div>
  );
}

export function LoansPage() {
  const loans = useLoanStore((s) => s.loans);
  const add = useLoanStore((s) => s.add);
  const update = useLoanStore((s) => s.update);
  const remove = useLoanStore((s) => s.remove);
  const { format } = useCurrency();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Loan | null>(null);

  const netWorth = useNetWorth();
  const summary = useMemo(() => computeLoansSummary(loans), [loans]);
  const pieData = useMemo(
    () =>
      outstandingByLoanType(loans).map((s) => ({
        categoryId: s.loanType,
        name: s.name,
        color: s.color,
        total: s.total,
      })),
    [loans],
  );

  const openCreate = () => {
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (loan: Loan) => {
    setEditing(loan);
    setOpen(true);
  };

  return (
    <PageShell
      title="Loans"
      subtitle="Outstanding balance, optional monthly EMI, and repayment progress"
      action={
        <Button size="sm" onClick={openCreate}>
          + Add loan
        </Button>
      }
    >
      <NetWorthCompact data={netWorth} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryStat
          label="Total outstanding"
          value={format(summary.totalOutstanding)}
          sub={`${summary.count} loan${summary.count === 1 ? '' : 's'}`}
          accent="danger"
          delay={0}
        />
        <SummaryStat
          label="Monthly EMI"
          value={summary.totalMonthlyEmi > 0 ? format(summary.totalMonthlyEmi) : '—'}
          sub={
            summary.withEmiCount > 0
              ? `${summary.withEmiCount} loan${summary.withEmiCount === 1 ? '' : 's'} with EMI`
              : 'No EMI set (lump-sum / flexible loans OK)'
          }
          accent="warning"
          delay={0.05}
        />
        <SummaryStat
          label="Total repaid"
          value={format(summary.totalRepaid)}
          sub={`${summary.repaidPercent.toFixed(1)}% of original principal`}
          delay={0.1}
        />
        <SummaryStat
          label="Original borrowed"
          value={format(summary.totalPrincipal)}
          sub="Sum of all loan principals"
          delay={0.15}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSection
          title="Outstanding by type"
          subtitle="Share of debt still owed"
          delay={0.2}
        >
          <CategoryPieChart
            data={pieData}
            monthKey="loans-outstanding"
            emptyLabel="Add loans to see breakdown"
            height={220}
          />
        </DashboardSection>

        <DashboardSection title="Loan tracking" subtitle="What you can record" delay={0.25}>
          <ul className="space-y-3 text-sm text-fg-secondary">
            <li className="rounded-xl border border-cockpit-border bg-cockpit-elevated/50 px-4 py-3">
              Original amount and <strong className="text-fg">current outstanding</strong> — update
              outstanding anytime after payments.
            </li>
            <li className="rounded-xl border border-cockpit-border bg-cockpit-elevated/50 px-4 py-3">
              <strong className="text-fg">Monthly EMI</strong> is optional — uncheck for loans
              without a fixed EMI (overdraft, informal, bullet repayment).
            </li>
            <li className="rounded-xl border border-cockpit-border bg-cockpit-elevated/50 px-4 py-3">
              Repayment progress bar shows how much of the principal you have cleared.
            </li>
          </ul>
        </DashboardSection>
      </div>

      <DashboardSection title="Your loans" subtitle="All liabilities" delay={0.3}>
        {loans.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-fg-muted">No loans added yet</p>
            <Button className="mt-4" size="sm" onClick={openCreate}>
              Add your first loan
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {loans.map((loan, i) => {
              const meta = LOAN_TYPE_META[loan.loanType];
              const repaid = loanRepaid(loan);
              const pct = loanRepaidPercent(loan);

              return (
                <motion.div
                  key={loan.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-xl border border-cockpit-border bg-cockpit-elevated/40 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: meta.color }}
                        />
                        <p className="truncate font-semibold text-fg">{loan.name}</p>
                      </div>
                      <p className="mt-1 text-xs text-fg-muted">{meta.label}</p>
                      {loan.startDate && (
                        <p className="text-xs text-fg-muted">
                          Started {formatDisplayDate(loan.startDate)}
                        </p>
                      )}
                      {loan.interestRate != null && loan.interestRate > 0 && (
                        <p className="text-xs text-fg-muted">{loan.interestRate}% p.a.</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-lg font-semibold text-danger">
                        {format(loan.outstandingAmount)}
                      </p>
                      <p className="text-[11px] text-fg-muted">outstanding</p>
                      {loanHasEmi(loan) ? (
                        <p className="mt-1 font-mono text-sm text-warning">
                          EMI {format(loan.monthlyEmi!)}/mo
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-fg-muted">No fixed EMI</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs text-fg-muted">
                      <span>Repaid {format(repaid)}</span>
                      <span>
                        of {format(loan.principalAmount)} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <ProgressBar value={repaid} max={loan.principalAmount} color={meta.color} />
                  </div>

                  {loan.notes && (
                    <p className="mt-2 text-xs text-fg-secondary">{loan.notes}</p>
                  )}

                  <div className="mt-3 flex gap-2 border-t border-cockpit-border pt-3">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(loan)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        confirm(`Delete "${loan.name}"?`) && void remove(loan.id)
                      }
                    >
                      Delete
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </DashboardSection>

      <Modal
        open={open}
        title={editing ? 'Edit loan' : 'Add loan'}
        onClose={() => setOpen(false)}
      >
        <LoanForm
          initial={editing ?? undefined}
          onCancel={() => setOpen(false)}
          onSubmit={async (data) => {
            if (editing) {
              await update(editing.id, data);
            } else {
              await add(data);
            }
            setOpen(false);
          }}
        />
      </Modal>
    </PageShell>
  );
}
