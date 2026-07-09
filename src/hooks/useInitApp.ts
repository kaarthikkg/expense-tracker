import { useEffect, useState } from 'react';
import { seedDatabase } from '@/db';
import { processRecurringExpenses } from '@/services/recurring';
import { useAuthStore } from '@/store/authStore';
import { useBudgetStore } from '@/store/budgetStore';
import { useCategoryStore } from '@/store/categoryStore';
import { useExpenseStore } from '@/store/expenseStore';
import { useGoalStore } from '@/store/goalStore';
import { useHoldingStore } from '@/store/holdingStore';
import { useLoanStore } from '@/store/loanStore';
import { usePaymentSourceStore } from '@/store/paymentSourceStore';
import { useRecurringStore } from '@/store/recurringStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useSyncStore } from '@/store/syncStore';

export function useInitApp(): { ready: boolean } {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let unsubAuth: (() => void) | undefined;
    let prevUid: string | null | undefined;

    async function init() {
      await seedDatabase();
      await processRecurringExpenses();
      await Promise.all([
        useExpenseStore.getState().load(),
        useCategoryStore.getState().load(),
        useBudgetStore.getState().load(),
        useGoalStore.getState().load(),
        useRecurringStore.getState().load(),
        useHoldingStore.getState().load(),
        useLoanStore.getState().load(),
        usePaymentSourceStore.getState().load(),
        useSettingsStore.getState().load(),
      ]);

      useSyncStore.getState().attachDexieHooks();

      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const onChange = () => useSettingsStore.getState().applyThemeToDocument();
      media.addEventListener('change', onChange);

      unsubAuth = useAuthStore.getState().init();

      const unsubAuthStore = useAuthStore.subscribe((state) => {
        const uid = state.user?.uid ?? null;
        if (!state.ready) return;
        if (uid === prevUid) return;
        const previous = prevUid;
        prevUid = uid;
        if (uid) {
          void useSyncStore.getState().onSignedIn(uid);
        } else if (previous) {
          useSyncStore.getState().onSignedOut();
        }
      });

      if (!cancelled) setReady(true);

      return () => {
        media.removeEventListener('change', onChange);
        unsubAuthStore();
      };
    }

    const cleanupPromise = init();
    return () => {
      cancelled = true;
      unsubAuth?.();
      void cleanupPromise.then((cleanup) => cleanup?.());
    };
  }, []);

  return { ready };
}
