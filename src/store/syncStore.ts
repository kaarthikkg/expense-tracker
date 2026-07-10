import { create } from 'zustand';
import { db } from '@/db';
import {
  isApplyingRemoteSync,
  pullCloudToLocal,
  pushLocalToCloud,
  syncOnSignIn,
  tableToSyncTarget,
  type SyncTarget,
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
  pushNow: (opts?: { quiet?: boolean; full?: boolean }) => Promise<void>;
  onSignedIn: (uid: string) => Promise<void>;
  onSignedOut: () => void;
  reloadStores: () => Promise<void>;
}

/** Longer debounce on mobile-friendly networks — coalesce rapid edits into one push. */
const PUSH_DEBOUNCE_MS = 2800;

let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pushInFlight = false;
let pushQueued = false;
const dirtyTargets = new Set<SyncTarget>();

function markDirty(target: SyncTarget): void {
  dirtyTargets.add(target);
}

function takeDirtyTargets(): SyncTarget[] | undefined {
  if (dirtyTargets.size === 0) return undefined;
  const list = [...dirtyTargets];
  dirtyTargets.clear();
  return list;
}

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
    const onChange = (tableName: string) => {
      if (isApplyingRemoteSync()) return;
      const target = tableToSyncTarget(tableName);
      if (target) markDirty(target);
      get().schedulePush();
    };
    for (const table of tables) {
      const name = table.name;
      table.hook('creating', () => {
        onChange(name);
      });
      table.hook('updating', () => {
        onChange(name);
      });
      table.hook('deleting', () => {
        onChange(name);
      });
    }
    set({ hooksAttached: true });
  },

  schedulePush: () => {
    const uid = useAuthStore.getState().user?.uid;
    if (!uid || !navigator.onLine) return;
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
      void get().pushNow({ quiet: true });
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
      dirtyTargets.clear();
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
    dirtyTargets.clear();
    pushQueued = false;
    set({
      dataSource: 'local',
      status: 'idle',
      lastSyncedAt: null,
      error: null,
      message: 'Signed out — data is local only',
    });
  },

  pushNow: async (opts = {}) => {
    const uid = useAuthStore.getState().user?.uid;
    if (!uid) return;
    if (!navigator.onLine) {
      if (!opts.quiet) set({ status: 'offline', error: 'You are offline' });
      return;
    }

    // Coalesce: if a push is already running, queue one more after it finishes
    if (pushInFlight) {
      pushQueued = true;
      if (opts.full) {
        // Force a full sync on the queued run
        for (const t of [
          'expenses',
          'categories',
          'paymentSources',
          'budgets',
          'goals',
          'recurringExpenses',
          'holdings',
          'loans',
          'settings',
        ] as SyncTarget[]) {
          markDirty(t);
        }
      }
      return;
    }

    pushInFlight = true;
    const quiet = Boolean(opts.quiet);
    if (!quiet) {
      set({ status: 'syncing', error: null, message: 'Uploading to Firebase…' });
    }

    try {
      do {
        pushQueued = false;
        const doFull = Boolean(opts.full);
        // After the first iteration, queued follow-ups are incremental
        opts = { ...opts, full: false };

        if (doFull) {
          await pushLocalToCloud(uid);
          continue;
        }

        const targets = takeDirtyTargets();
        if (targets && targets.length > 0) {
          await pushLocalToCloud(uid, { targets });
          continue;
        }

        // Manual upload with nothing marked dirty → full mirror
        if (!quiet) {
          await pushLocalToCloud(uid);
        }
      } while (pushQueued);

      set({
        status: 'idle',
        dataSource: 'firebase',
        lastSyncedAt: new Date().toISOString(),
        error: null,
        message: quiet ? null : 'Uploaded to Firebase',
      });
    } catch (error) {
      set({
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed',
        message: null,
      });
    } finally {
      pushInFlight = false;
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
      dirtyTargets.clear();
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
    await get().pushNow({ full: true });
  },
}));
