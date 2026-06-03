import { useEffect, useState } from 'react';
import { seedDatabase } from '@/db';
import { processRecurringExpenses } from '@/services/recurring';
import { useBudgetStore } from '@/store/budgetStore';
import { useCategoryStore } from '@/store/categoryStore';
import { useExpenseStore } from '@/store/expenseStore';
import { useGoalStore } from '@/store/goalStore';
import { useRecurringStore } from '@/store/recurringStore';
import { useSettingsStore } from '@/store/settingsStore';

export function useInitApp(): { ready: boolean } {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      await seedDatabase();
      await processRecurringExpenses();
      await Promise.all([
        useExpenseStore.getState().load(),
        useCategoryStore.getState().load(),
        useBudgetStore.getState().load(),
        useGoalStore.getState().load(),
        useRecurringStore.getState().load(),
        useSettingsStore.getState().load(),
      ]);

      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const onChange = () => useSettingsStore.getState().applyThemeToDocument();
      media.addEventListener('change', onChange);

      if (!cancelled) setReady(true);

      return () => media.removeEventListener('change', onChange);
    }

    const cleanupPromise = init();
    return () => {
      cancelled = true;
      void cleanupPromise.then((cleanup) => cleanup?.());
    };
  }, []);

  return { ready };
}
