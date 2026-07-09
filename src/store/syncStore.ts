import { create } from 'zustand';
import { db } from '@/db';
import {
  isApplyingRemoteSync,
  pullCloudToLocal,
  pushLocalToCloud,
  syncOnSignIn,
} from '@/services/cloudSync';
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

export type DataSource = 'local' | 'firebase';
export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

interface SyncState {
  status: SyncStatus;
  dataSource: DataSource;
  lastSyncedAt: string | null;
  error: string | null;
  message: string | null;
  hooksAttached: boolean;
  attachDexieHooks: () => void;
  schedulePush: () => void;
  syncNow: () => Promise<void>;
  pullNow: () => Promise<void>;
  pushNow: () => Promise<void>;
  onSignedIn: (uid: string) => Promise<void>;
  onSignedOut: () => void;
  reloadStores: () => Promise<void>;
}

let pushTimer: ReturnType<typeof setTimeout> | null = null;
const PUSH_DEBOUNCE_MS = 1500;

async function reloadAllStores(): Promise<void> {
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
}

export const useSyncStore = create<SyncState>((set, get) => ({
  status: 'idle',
  dataSource: 'local',
  lastSyncedAt: null,
  error: null,
  message: null,
  hooksAttached: false,

  reloadStores: reloadAllStores,

  attachDexieHooks: () => {
    if (get().hooksAttached) return;
    const tables = [
      db.expenses,
      db.categories,
      db.paymentSources,
      db.budgets,
      db.goals,
      db.recurringExpenses,
      db.holdings,
      db.loans,
      db.settings,
    ];
    const onChange = () => {
      if (isApplyingRemoteSync()) return;
      get().schedulePush();
    };
    for (const table of tables) {
      // Dexie TableHooks is callable: table.hook(eventName, subscriber)
      table.hook('creating', () => {
        onChange();
      });
      table.hook('updating', () => {
        onChange();
      });
      table.hook('deleting', () => {
        onChange();
      });
    }
    set({ hooksAttached: true });
  },

  schedulePush: () => {
    const uid = useAuthStore.getState().user?.uid;
    if (!uid || !navigator.onLine) return;
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
      void get().pushNow();
    }, PUSH_DEBOUNCE_MS);
  },

  onSignedIn: async (uid) => {
    if (!navigator.onLine) {
      set({
        dataSource: 'local',
        status: 'offline',
        message: 'Signed in offline — using local data until you sync.',
      });
      return;
    }
    set({ status: 'syncing', error: null, message: 'Syncing with Firebase…' });
    try {
      const result = await syncOnSignIn(uid);
      await reloadAllStores();
      set({
        status: 'idle',
        dataSource: 'firebase',
        lastSyncedAt: new Date().toISOString(),
        message:
          result === 'pulled'
            ? 'Loaded data from Firebase'
            : 'Uploaded local data to Firebase',
      });
    } catch (error) {
      set({
        status: 'error',
        dataSource: 'local',
        error: error instanceof Error ? error.message : 'Sync failed',
        message: null,
      });
    }
  },

  onSignedOut: () => {
    if (pushTimer) {
      clearTimeout(pushTimer);
      pushTimer = null;
    }
    set({
      dataSource: 'local',
      status: 'idle',
      lastSyncedAt: null,
      error: null,
      message: 'Signed out — data is local only',
    });
  },

  pushNow: async () => {
    const uid = useAuthStore.getState().user?.uid;
    if (!uid) return;
    if (!navigator.onLine) {
      set({ status: 'offline', error: 'You are offline' });
      return;
    }
    set({ status: 'syncing', error: null, message: 'Uploading to Firebase…' });
    try {
      await pushLocalToCloud(uid);
      set({
        status: 'idle',
        dataSource: 'firebase',
        lastSyncedAt: new Date().toISOString(),
        message: 'Uploaded to Firebase',
      });
    } catch (error) {
      set({
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed',
        message: null,
      });
    }
  },

  pullNow: async () => {
    const uid = useAuthStore.getState().user?.uid;
    if (!uid) return;
    if (!navigator.onLine) {
      set({ status: 'offline', error: 'You are offline' });
      return;
    }
    set({ status: 'syncing', error: null, message: 'Downloading from Firebase…' });
    try {
      const pulled = await pullCloudToLocal(uid);
      if (!pulled) {
        set({
          status: 'idle',
          message: 'No cloud data yet — upload local data first',
        });
        return;
      }
      await reloadAllStores();
      set({
        status: 'idle',
        dataSource: 'firebase',
        lastSyncedAt: new Date().toISOString(),
        message: 'Downloaded from Firebase',
      });
    } catch (error) {
      set({
        status: 'error',
        error: error instanceof Error ? error.message : 'Download failed',
        message: null,
      });
    }
  },

  syncNow: async () => {
    await get().pushNow();
  },
}));
