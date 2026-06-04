import { useState } from 'react';
import type { Loan } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { LOAN_TYPE_OPTIONS } from '@/utils/loans';

export type LoanFormData = {
  name: string;
  loanType: Loan['loanType'];
  principalAmount: number;
  outstandingAmount: number;
  monthlyEmi?: number;
  interestRate?: number;
  startDate?: string;
  notes?: string;
};

interface LoanFormProps {
  initial?: Loan;
  onSubmit: (data: LoanFormData) => void | Promise<void>;
  onCancel: () => void;
}

export function LoanForm({ initial, onSubmit, onCancel }: LoanFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [loanType, setLoanType] = useState<Loan['loanType']>(initial?.loanType ?? 'personal');
  const [principalAmount, setPrincipalAmount] = useState(
    String(initial?.principalAmount ?? ''),
  );
  const [outstandingAmount, setOutstandingAmount] = useState(
    String(initial?.outstandingAmount ?? ''),
  );
  const [hasEmi, setHasEmi] = useState((initial?.monthlyEmi ?? 0) > 0);
  const [monthlyEmi, setMonthlyEmi] = useState(
    initial?.monthlyEmi ? String(initial.monthlyEmi) : '',
  );
  const [interestRate, setInterestRate] = useState(
    initial?.interestRate != null ? String(initial.interestRate) : '',
  );
  const [startDate, setStartDate] = useState(initial?.startDate ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const principal = parseFloat(principalAmount);
    const outstanding = parseFloat(outstandingAmount);
    const emi = hasEmi ? parseFloat(monthlyEmi) : undefined;
    const rate = interestRate.trim() ? parseFloat(interestRate) : undefined;

    if (!name.trim()) {
      setError('Enter loan name or lender');
      return;
    }
    if (!principal || principal <= 0) {
      setError('Enter original loan amount');
      return;
    }
    if (outstanding < 0 || Number.isNaN(outstanding)) {
      setError('Enter current outstanding balance');
      return;
    }
    if (outstanding > principal) {
      setError('Outstanding cannot be more than original amount');
      return;
    }
    if (hasEmi && (!emi || emi <= 0)) {
      setError('Enter monthly EMI amount');
      return;
    }

    setError('');
    await onSubmit({
      name: name.trim(),
      loanType,
      principalAmount: principal,
      outstandingAmount: outstanding,
      monthlyEmi: hasEmi ? emi : undefined,
      interestRate: rate,
      startDate: startDate || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Loan / lender name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. SBI Home Loan, HDFC Personal"
        required
      />
      <Select
        label="Loan type"
        value={loanType}
        onChange={(e) => setLoanType(e.target.value as Loan['loanType'])}
        options={LOAN_TYPE_OPTIONS}
      />
      <Input
        label="Original loan amount"
        type="number"
        min="0"
        step="0.01"
        value={principalAmount}
        onChange={(e) => setPrincipalAmount(e.target.value)}
        required
      />
      <Input
        label="Outstanding balance"
        type="number"
        min="0"
        step="0.01"
        value={outstandingAmount}
        onChange={(e) => setOutstandingAmount(e.target.value)}
        required
      />

      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-cockpit-border px-4 py-3">
        <input
          type="checkbox"
          checked={hasEmi}
          onChange={(e) => setHasEmi(e.target.checked)}
          className="h-4 w-4 rounded accent-accent"
        />
        <span className="text-sm text-fg">Has monthly EMI</span>
      </label>

      {hasEmi && (
        <Input
          label="Monthly EMI"
          type="number"
          min="0"
          step="0.01"
          value={monthlyEmi}
          onChange={(e) => setMonthlyEmi(e.target.value)}
          required
        />
      )}

      <Input
        label="Interest rate % per year (optional)"
        type="number"
        min="0"
        step="0.01"
        value={interestRate}
        onChange={(e) => setInterestRate(e.target.value)}
      />
      <Input
        label="Start date (optional)"
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
      />
      <Input
        label="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Tenure, account number…"
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" fullWidth>
          {initial ? 'Update loan' : 'Add loan'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
