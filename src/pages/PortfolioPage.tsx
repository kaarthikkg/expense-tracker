import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { Holding } from '@/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PageShell } from '@/components/layout/PageShell';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { CategoryPieChart } from '@/components/charts/CategoryPieChart';
import { HoldingForm } from '@/components/portfolio/HoldingForm';
import { NetWorthCompact } from '@/components/dashboard/NetWorthCompact';
import { useCurrency } from '@/hooks/useCurrency';
import { useNetWorth } from '@/hooks/useNetWorth';
import { useHoldingStore } from '@/store/holdingStore';
import {
  ASSET_TYPE_META,
  allocationByAssetType,
  computePortfolioSummary,
  holdingGain,
  holdingGainPercent,
  holdingInvested,
  holdingMarketValue,
} from '@/utils/portfolio';

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
  accent?: 'default' | 'success' | 'danger';
  delay?: number;
}) {
  const accentClass =
    accent === 'success' ? 'text-success' : accent === 'danger' ? 'text-danger' : 'text-fg';
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

export function PortfolioPage() {
  const holdings = useHoldingStore((s) => s.holdings);
  const add = useHoldingStore((s) => s.add);
  const update = useHoldingStore((s) => s.update);
  const remove = useHoldingStore((s) => s.remove);
  const { format } = useCurrency();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Holding | null>(null);

  const netWorth = useNetWorth();
  const summary = useMemo(() => computePortfolioSummary(holdings), [holdings]);
  const allocation = useMemo(() => allocationByAssetType(holdings), [holdings]);
  const pieData = useMemo(
    () =>
      allocation.map((a) => ({
        categoryId: a.assetType,
        name: a.name,
        color: a.color,
        total: a.total,
      })),
    [allocation],
  );

  const openCreate = () => {
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (h: Holding) => {
    setEditing(h);
    setOpen(true);
  };

  const gainAccent = summary.totalGain >= 0 ? 'success' : 'danger';

  return (
    <PageShell
      title="Portfolio"
      subtitle="Where you invested and total value — no stock symbols or units"
      action={
        <Button size="sm" onClick={openCreate}>
          + Add investment
        </Button>
      }
    >
      <NetWorthCompact data={netWorth} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryStat
          label="Portfolio value"
          value={format(summary.totalValue)}
          sub={`${summary.count} investment${summary.count === 1 ? '' : 's'}`}
          delay={0}
        />
        <SummaryStat
          label="Total invested"
          value={format(summary.totalInvested)}
          sub="Cost basis"
          delay={0.05}
        />
        <SummaryStat
          label="Unrealized P&L"
          value={`${summary.totalGain >= 0 ? '+' : ''}${format(summary.totalGain)}`}
          sub={`${summary.totalGainPercent >= 0 ? '+' : ''}${summary.totalGainPercent.toFixed(2)}%`}
          accent={gainAccent}
          delay={0.1}
        />
        <SummaryStat
          label="Largest investment"
          value={
            holdings.length > 0
              ? format(
                  Math.max(...holdings.map((h) => holdingMarketValue(h))),
                )
              : '—'
          }
          sub="By current value"
          delay={0.15}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSection
          title="Allocation by asset type"
          subtitle="Based on current market value"
          delay={0.2}
        >
          <CategoryPieChart
            data={pieData}
            monthKey="portfolio-allocation"
            emptyLabel="Add investments to see allocation"
            height={220}
          />
        </DashboardSection>

        <DashboardSection
          title="How it works"
          subtitle="Offline portfolio tracking"
          delay={0.25}
        >
          <ul className="space-y-3 text-sm text-fg-secondary">
            <li className="rounded-xl border border-cockpit-border bg-cockpit-elevated/50 px-4 py-3">
              Name each place you invested — mutual fund, FD, broker, gold, etc.
            </li>
            <li className="rounded-xl border border-cockpit-border bg-cockpit-elevated/50 px-4 py-3">
              Enter <strong className="text-fg">total invested</strong> and{' '}
              <strong className="text-fg">current total value</strong> only.
            </li>
            <li className="rounded-xl border border-cockpit-border bg-cockpit-elevated/50 px-4 py-3">
              P&L updates when you change current value. No stock symbols or unit counts.
            </li>
          </ul>
        </DashboardSection>
      </div>

      <DashboardSection title="Investments" subtitle="All entries" delay={0.3}>
        {holdings.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-fg-muted">No investments yet</p>
            <Button className="mt-4" size="sm" onClick={openCreate}>
              Add your first investment
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {holdings.map((h, i) => {
              const invested = holdingInvested(h);
              const value = holdingMarketValue(h);
              const gain = holdingGain(h);
              const gainPct = holdingGainPercent(h);
              const meta = ASSET_TYPE_META[h.assetType];
              const positive = gain >= 0;

              return (
                <motion.div
                  key={h.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-xl border border-cockpit-border bg-cockpit-elevated/40 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: meta.color }}
                        />
                        <p className="truncate font-semibold text-fg">{h.name}</p>
                      </div>
                      <p className="mt-1 text-xs text-fg-muted">{meta.label}</p>
                      {h.notes && (
                        <p className="mt-1 text-xs text-fg-secondary">{h.notes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-lg font-semibold">{format(value)}</p>
                      <p
                        className={`font-mono text-sm ${positive ? 'text-success' : 'text-danger'}`}
                      >
                        {positive ? '+' : ''}
                        {format(gain)} ({positive ? '+' : ''}
                        {gainPct.toFixed(1)}%)
                      </p>
                      <p className="text-[11px] text-fg-muted">
                        Invested {format(invested)} → now {format(value)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2 border-t border-cockpit-border pt-3">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(h)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        confirm(`Delete "${h.name}" from portfolio?`) && void remove(h.id)
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
        title={editing ? 'Edit investment' : 'Add investment'}
        onClose={() => setOpen(false)}
      >
        <HoldingForm
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
