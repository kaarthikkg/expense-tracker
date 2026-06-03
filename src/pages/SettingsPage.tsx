import { useRef, useState } from 'react';
import type { CurrencyCode, Theme } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { PageShell } from '@/components/layout/PageShell';
import { useSettingsStore } from '@/store/settingsStore';
import { useExpenseStore } from '@/store/expenseStore';
import { useCategoryStore } from '@/store/categoryStore';
import { useBudgetStore } from '@/store/budgetStore';
import { useGoalStore } from '@/store/goalStore';
import { useRecurringStore } from '@/store/recurringStore';
import {
  buildExportData,
  downloadCsv,
  downloadJson,
  expensesToCsv,
  importBackup,
  parseImportFile,
} from '@/services/importExport';
import { downloadMonthlyExpensesExcel } from '@/services/excelExport';
import { getMonthKey } from '@/utils/dates';

export function SettingsPage() {
  const settings = useSettingsStore((s) => s.settings);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const setCurrency = useSettingsStore((s) => s.setCurrency);
  const expenses = useExpenseStore((s) => s.expenses);
  const categories = useCategoryStore((s) => s.categories);
  const fileRef = useRef<HTMLInputElement>(null);
  const [exportMonth, setExportMonth] = useState(getMonthKey());

  const reloadAll = async () => {
    await Promise.all([
      useExpenseStore.getState().load(),
      useCategoryStore.getState().load(),
      useBudgetStore.getState().load(),
      useGoalStore.getState().load(),
      useRecurringStore.getState().load(),
      useSettingsStore.getState().load(),
    ]);
  };

  const handleExportJson = async () => {
    const data = await buildExportData();
    downloadJson(data, `expense-backup-${Date.now()}.json`);
  };

  const handleExportCsv = async () => {
    const data = await buildExportData();
    const csv = expensesToCsv(data.expenses, data.categories);
    downloadCsv(csv, `expenses-${Date.now()}.csv`);
  };

  const handleExportMonthlyExcel = async () => {
    const currency = settings?.currency ?? 'INR';
    await downloadMonthlyExpensesExcel(exportMonth, currency, expenses, categories);
  };

  const handleImport = async (file: File) => {
    try {
      const data = await parseImportFile(file);
      if (!confirm('This will replace all local data. Continue?')) return;
      await importBackup(data);
      await reloadAll();
      alert('Restore complete!');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Import failed');
    }
  };

  return (
    <PageShell title="System" subtitle="Terminal configuration & data ops">
      <Card title="Appearance">
        <Select
          label="Theme"
          value={settings?.theme ?? 'system'}
          onChange={(e) => void setTheme(e.target.value as Theme)}
          options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'system', label: 'System' },
          ]}
        />
      </Card>

      <Card title="Currency">
        <Select
          label="Display currency"
          value={settings?.currency ?? 'INR'}
          onChange={(e) => void setCurrency(e.target.value as CurrencyCode)}
          options={[
            { value: 'INR', label: 'INR (₹)' },
            { value: 'USD', label: 'USD ($)' },
            { value: 'EUR', label: 'EUR (€)' },
            { value: 'GBP', label: 'GBP (£)' },
          ]}
        />
      </Card>

      <Card title="Monthly Excel export">
        <p className="mb-4 text-sm text-fg-secondary">
          Exports every expense for the selected month on the <strong>All expenses</strong> sheet
          (plus income, totals, and category breakdowns).
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <Input label="Month" type="month" value={exportMonth} onChange={(e) => setExportMonth(e.target.value)} />
          <Button onClick={() => void handleExportMonthlyExcel()}>Export .xlsx</Button>
        </div>
      </Card>

      <Card title="Data operations">
        <p className="mb-4 text-sm text-fg-secondary">
          All data is local. Export regularly.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void handleExportJson()}>Export JSON</Button>
          <Button variant="secondary" onClick={() => void handleExportCsv()}>Export CSV</Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>Import backup</Button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImport(file);
              e.target.value = '';
            }}
          />
        </div>
      </Card>

      <Card title="PWA">
        <p className="text-sm text-fg-secondary">
          Install via browser menu for offline terminal access.
        </p>
      </Card>
    </PageShell>
  );
}
