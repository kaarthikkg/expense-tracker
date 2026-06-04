import { useState } from 'react';
import type { Holding } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ASSET_TYPE_OPTIONS } from '@/utils/portfolio';

export type HoldingFormData = {
  name: string;
  assetType: Holding['assetType'];
  investedAmount: number;
  currentValue: number;
  notes?: string;
};

interface HoldingFormProps {
  initial?: Holding;
  onSubmit: (data: HoldingFormData) => void | Promise<void>;
  onCancel: () => void;
}

export function HoldingForm({ initial, onSubmit, onCancel }: HoldingFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [assetType, setAssetType] = useState<Holding['assetType']>(
    initial?.assetType ?? 'mutual_fund',
  );
  const [investedAmount, setInvestedAmount] = useState(
    String(initial?.investedAmount ?? ''),
  );
  const [currentValue, setCurrentValue] = useState(
    String(initial?.currentValue ?? initial?.investedAmount ?? ''),
  );
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const invested = parseFloat(investedAmount);
    const current = parseFloat(currentValue);
    if (!name.trim()) {
      setError('Enter where you invested');
      return;
    }
    if (!invested || invested <= 0) {
      setError('Enter total amount invested');
      return;
    }
    if (!current || current < 0) {
      setError('Enter current total value');
      return;
    }
    setError('');
    await onSubmit({
      name: name.trim(),
      assetType,
      investedAmount: invested,
      currentValue: current,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Where you invested"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Zerodha MF, PPF, NPS, Gold"
        required
      />
      <Select
        label="Type"
        value={assetType}
        onChange={(e) => setAssetType(e.target.value as Holding['assetType'])}
        options={ASSET_TYPE_OPTIONS}
      />
      <Input
        label="Total invested"
        type="number"
        min="0"
        step="0.01"
        value={investedAmount}
        onChange={(e) => setInvestedAmount(e.target.value)}
        required
      />
      <Input
        label="Current total value"
        type="number"
        min="0"
        step="0.01"
        value={currentValue}
        onChange={(e) => setCurrentValue(e.target.value)}
        required
      />
      <Input
        label="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Account, folio, reminders…"
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" fullWidth>
          {initial ? 'Update' : 'Add investment'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
