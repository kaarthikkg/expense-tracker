import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { EvOdometerReading } from '@/types';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { PageShell } from '@/components/layout/PageShell';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { useCurrency } from '@/hooks/useCurrency';
import { useEvStore } from '@/store/evStore';
import {
  computeEvSummary,
  formatKm,
  getMonthMetrics,
  missingCurrentMonthReading,
  needsFirstOfMonthReading,
} from '@/utils/ev';
import { formatMonthLabel, getMonthKey } from '@/utils/dates';

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
  accent?: 'default' | 'success' | 'warning';
  delay?: number;
}) {
  const accentClass =
    accent === 'success' ? 'text-success' : accent === 'warning' ? 'text-warning' : 'text-fg';
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

export function EvTrackingPage() {
  const readings = useEvStore((s) => s.readings);
  const config = useEvStore((s) => s.config);
  const upsertReading = useEvStore((s) => s.upsertReading);
  const updateReading = useEvStore((s) => s.updateReading);
  const removeReading = useEvStore((s) => s.removeReading);
  const saveConfig = useEvStore((s) => s.saveConfig);
  const { format } = useCurrency();

  const currentMonth = getMonthKey();
  const summary = useMemo(() => computeEvSummary(readings, config), [readings, config]);
  const thisMonth = useMemo(
    () => getMonthMetrics(summary, currentMonth),
    [summary, currentMonth],
  );
  const needsFirst = needsFirstOfMonthReading(readings);
  const missingMonth = missingCurrentMonthReading(readings);

  const [readingOpen, setReadingOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [editing, setEditing] = useState<EvOdometerReading | null>(null);
  const [monthKey, setMonthKey] = useState(currentMonth);
  const [odometer, setOdometer] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const [vehicleName, setVehicleName] = useState(config.vehicleName);
  const [petrolPrice, setPetrolPrice] = useState(String(config.petrolPricePerLitre));
  const [petrolKm, setPetrolKm] = useState(String(config.petrolKmPerLitre));

  const openCreate = (preferMonth = currentMonth) => {
    setEditing(null);
    setMonthKey(preferMonth);
    setOdometer('');
    setNotes('');
    setFormError(null);
    setReadingOpen(true);
  };

  const openEdit = (row: EvOdometerReading) => {
    setEditing(row);
    setMonthKey(row.monthKey);
    setOdometer(String(row.odometerKm));
    setNotes(row.notes ?? '');
    setFormError(null);
    setReadingOpen(true);
  };

  const openConfig = () => {
    setVehicleName(config.vehicleName);
    setPetrolPrice(String(config.petrolPricePerLitre));
    setPetrolKm(String(config.petrolKmPerLitre));
    setConfigOpen(true);
  };

  const saveReading = async () => {
    const km = parseFloat(odometer);
    if (!monthKey || Number.isNaN(km) || km < 0) {
      setFormError('Enter a valid month and odometer reading');
      return;
    }
    if (editing) {
      const previous = summary.segments
        .map((s) => s.reading)
        .filter((r) => r.id !== editing.id)
        .sort((a, b) => a.monthKey.localeCompare(b.monthKey));
      const prior = [...previous].reverse().find((r) => r.monthKey < monthKey);
      if (prior && km < prior.odometerKm) {
        setFormError(`Odometer cannot be below previous reading (${prior.odometerKm} km)`);
        return;
      }
      try {
        await updateReading(editing.id, {
          monthKey,
          odometerKm: km,
          notes,
        });
      } catch (e) {
        setFormError(e instanceof Error ? e.message : 'Could not save');
        return;
      }
    } else {
      const prior = [...readings]
        .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
        .filter((r) => r.monthKey < monthKey)
        .at(-1);
      if (prior && km < prior.odometerKm) {
        setFormError(`Odometer cannot be below previous reading (${prior.odometerKm} km)`);
        return;
      }
      await upsertReading({ monthKey, odometerKm: km, notes });
    }
    setReadingOpen(false);
  };

  const saveConfigForm = async () => {
    const petrolPricePerLitre = parseFloat(petrolPrice);
    const petrolKmPerLitre = parseFloat(petrolKm);
    if (
      [petrolPricePerLitre, petrolKmPerLitre].some((n) => Number.isNaN(n) || n <= 0)
    ) {
      return;
    }
    await saveConfig({
      vehicleName,
      petrolPricePerLitre,
      petrolKmPerLitre,
    });
    setConfigOpen(false);
  };

  return (
    <PageShell
      title="EV usage & savings"
      subtitle={`${config.vehicleName} — monthly odometer, kilometres & petrol savings`}
      action={
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={openConfig}>
            Rates
          </Button>
          <Button size="sm" onClick={() => openCreate()}>
            + Log odometer
          </Button>
        </div>
      }
    >
      {(needsFirst || missingMonth) && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-2xl border border-accent/30 bg-accent-muted/60 px-4 py-4 sm:px-5"
        >
          <p className="text-sm font-semibold text-fg">
            {needsFirst
              ? '1st of the month — log your odometer'
              : `Missing ${formatMonthLabel(currentMonth)} reading`}
          </p>
          <p className="mt-1 text-sm text-fg-secondary">
            Enter today’s odometer on your {config.vehicleName} so we can calculate km driven and
            estimated fuel savings vs petrol.
          </p>
          <div className="mt-3">
            <Button size="sm" onClick={() => openCreate(currentMonth)}>
              Enter odometer
            </Button>
          </div>
        </motion.div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryStat
          label="Overall km driven"
          value={formatKm(summary.totalKm)}
          sub={
            summary.latestOdometer != null
              ? `Odometer ${formatKm(summary.latestOdometer)}`
              : 'Log at least two months'
          }
          delay={0}
        />
        <SummaryStat
          label="This month km"
          value={thisMonth.kmDriven != null ? formatKm(thisMonth.kmDriven) : '—'}
          sub={
            thisMonth.kmDriven != null
              ? formatMonthLabel(currentMonth)
              : missingMonth
                ? 'Log this month’s odometer'
                : 'Needs a prior month reading'
          }
          delay={0.05}
        />
        <SummaryStat
          label="Overall EV savings"
          value={format(summary.totalSavings)}
          sub="Estimated petrol spend avoided"
          accent="success"
          delay={0.1}
        />
        <SummaryStat
          label="This month savings"
          value={thisMonth.savings != null ? format(thisMonth.savings) : '—'}
          sub={
            thisMonth.savings != null
              ? formatMonthLabel(currentMonth)
              : missingMonth
                ? 'Log this month’s odometer'
                : 'Needs a prior month reading'
          }
          accent="success"
          delay={0.15}
        />
      </div>

      <DashboardSection
        className="mt-6"
        title="Monthly readings"
        subtitle="Difference between consecutive 1st-of-month odometer values"
      >
        {summary.segments.length === 0 ? (
          <EmptyState
            message="No odometer readings yet. Log the first snapshot to start tracking."
            action={
              <Button size="sm" onClick={() => openCreate()}>
                Log first reading
              </Button>
            }
          />
        ) : (
          <ul className="space-y-3">
            {summary.segments.map((seg, i) => (
              <motion.li
                key={seg.reading.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass-panel flex flex-col gap-3 rounded-2xl px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
              >
                <div className="min-w-0">
                  <p className="font-medium text-fg">{formatMonthLabel(seg.monthKey)}</p>
                  <p className="mt-0.5 font-mono text-sm text-fg-secondary">
                    Odometer {formatKm(seg.reading.odometerKm)}
                    {seg.kmDriven != null && (
                      <>
                        {' '}
                        · Driven {formatKm(seg.kmDriven)}
                        {seg.savings != null && <> · Saved {format(seg.savings)}</>}
                      </>
                    )}
                    {seg.kmDriven == null && (
                      <span className="text-fg-muted"> · Baseline reading</span>
                    )}
                  </p>
                  {seg.reading.notes && (
                    <p className="mt-1 text-xs text-fg-muted">{seg.reading.notes}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(seg.reading)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => confirm('Delete this reading?') && void removeReading(seg.reading.id)}
                  >
                    Del
                  </Button>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </DashboardSection>

      <Modal
        open={readingOpen}
        title={editing ? 'Edit odometer reading' : 'Log monthly odometer'}
        onClose={() => setReadingOpen(false)}
      >
        <div className="space-y-4">
          <Input
            label="Month (1st reading)"
            type="month"
            value={monthKey}
            onChange={(e) => setMonthKey(e.target.value)}
          />
          <Input
            label="Odometer (km)"
            type="number"
            min={0}
            step="0.1"
            inputMode="decimal"
            placeholder="e.g. 12450"
            value={odometer}
            onChange={(e) => setOdometer(e.target.value)}
          />
          <Input
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Service, trip, etc."
          />
          {formError && <p className="text-sm text-danger">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setReadingOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void saveReading()}>Save</Button>
          </div>
        </div>
      </Modal>

      <Modal open={configOpen} title="Savings rate assumptions" onClose={() => setConfigOpen(false)}>
        <div className="space-y-4">
          <Input
            label="Vehicle"
            value={vehicleName}
            onChange={(e) => setVehicleName(e.target.value)}
          />
          <Input
            label="Petrol price (per litre)"
            type="number"
            min={0}
            step="0.1"
            value={petrolPrice}
            onChange={(e) => setPetrolPrice(e.target.value)}
          />
          <Input
            label="Petrol vehicle mileage (km/L)"
            type="number"
            min={0}
            step="0.1"
            value={petrolKm}
            onChange={(e) => setPetrolKm(e.target.value)}
          />
          <p className="text-xs text-fg-muted">
            Savings = petrol cost for the same kilometres at these rates.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setConfigOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void saveConfigForm()}>Save rates</Button>
          </div>
        </div>
      </Modal>
    </PageShell>
  );
}
