import {
  collection,
  doc,
  getDoc,
  getDocs,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import { db as dexie } from '@/db';
import { getFirebaseDb, isFirebaseConfigured } from '@/lib/firebase';
import { buildExportData, importBackup } from '@/services/importExport';
import type { ExportData } from '@/types';

const COLLECTIONS = [
  'expenses',
  'categories',
  'paymentSources',
  'budgets',
  'goals',
  'recurringExpenses',
  'holdings',
  'loans',
] as const;

type SyncCollection = (typeof COLLECTIONS)[number];

const BATCH_LIMIT = 400;

/** Skip Dexie→cloud push while applying a remote pull. */
let applyingRemote = false;

export function isApplyingRemoteSync(): boolean {
  return applyingRemote;
}

function stripUndefined<T extends Record<string, unknown>>(data: T): T {
  const out = { ...data };
  for (const key of Object.keys(out)) {
    if (out[key] === undefined) delete out[key];
  }
  return out;
}

function userCol(firestore: Firestore, uid: string, name: SyncCollection) {
  return collection(firestore, 'users', uid, name);
}

function metaRef(firestore: Firestore, uid: string) {
  return doc(firestore, 'users', uid, 'sync', 'meta');
}

export async function cloudHasData(uid: string): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;
  const firestore = getFirebaseDb();
  const meta = await getDoc(metaRef(firestore, uid));
  if (meta.exists()) return true;
  const snap = await getDocs(userCol(firestore, uid, 'expenses'));
  return !snap.empty;
}

async function commitBatches(
  firestore: Firestore,
  ops: Array<(batch: ReturnType<typeof writeBatch>) => void>,
): Promise<void> {
  for (let i = 0; i < ops.length; i += BATCH_LIMIT) {
    const batch = writeBatch(firestore);
    for (const op of ops.slice(i, i + BATCH_LIMIT)) op(batch);
    await batch.commit();
  }
}

export async function pushLocalToCloud(uid: string): Promise<void> {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured');
  }
  const firestore = getFirebaseDb();
  const data = await buildExportData();
  const ops: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];

  for (const name of COLLECTIONS) {
    const localItems = (data[name] ?? []) as unknown as Array<{ id: string } & Record<string, unknown>>;
    const localIds = new Set(localItems.map((item) => item.id));
    const remoteSnap = await getDocs(userCol(firestore, uid, name));

    for (const remoteDoc of remoteSnap.docs) {
      if (!localIds.has(remoteDoc.id)) {
        ops.push((batch) => batch.delete(remoteDoc.ref));
      }
    }

    for (const item of localItems) {
      const ref = doc(userCol(firestore, uid, name), item.id);
      ops.push((batch) => batch.set(ref, stripUndefined({ ...item })));
    }
  }

  const settingsRef = doc(firestore, 'users', uid, 'settings', 'app');
  ops.push((batch) => batch.set(settingsRef, stripUndefined({ ...data.settings })));

  ops.push((batch) =>
    batch.set(metaRef(firestore, uid), {
      updatedAt: new Date().toISOString(),
      version: data.version,
      exportedAt: data.exportedAt,
    }),
  );

  await commitBatches(firestore, ops);
}

export async function pullCloudToLocal(uid: string): Promise<boolean> {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured');
  }
  const firestore = getFirebaseDb();
  const meta = await getDoc(metaRef(firestore, uid));
  const expenseSnap = await getDocs(userCol(firestore, uid, 'expenses'));
  if (!meta.exists() && expenseSnap.empty) {
    return false;
  }

  const loadCollection = async <T>(name: SyncCollection): Promise<T[]> => {
    const snap = await getDocs(userCol(firestore, uid, name));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
  };

  const settingsSnap = await getDoc(doc(firestore, 'users', uid, 'settings', 'app'));
  const settings = settingsSnap.exists()
    ? (settingsSnap.data() as ExportData['settings'])
    : { id: 'app' as const, theme: 'system' as const, currency: 'INR' as const };

  const exportData: ExportData = {
    version: (meta.data()?.version as number) ?? 4,
    exportedAt: (meta.data()?.exportedAt as string) ?? new Date().toISOString(),
    expenses: await loadCollection('expenses'),
    categories: await loadCollection('categories'),
    paymentSources: await loadCollection('paymentSources'),
    budgets: await loadCollection('budgets'),
    goals: await loadCollection('goals'),
    recurringExpenses: await loadCollection('recurringExpenses'),
    holdings: await loadCollection('holdings'),
    loans: await loadCollection('loans'),
    settings: { ...settings, id: 'app' },
  };

  applyingRemote = true;
  try {
    await importBackup(exportData);
  } finally {
    applyingRemote = false;
  }
  return true;
}

/** First login: pull cloud if present, otherwise upload local Dexie data. */
export async function syncOnSignIn(uid: string): Promise<'pulled' | 'pushed'> {
  const hasCloud = await cloudHasData(uid);
  if (hasCloud) {
    await pullCloudToLocal(uid);
    return 'pulled';
  }
  await pushLocalToCloud(uid);
  return 'pushed';
}

export async function localRecordCount(): Promise<number> {
  const [expenses, categories, goals, holdings, loans] = await Promise.all([
    dexie.expenses.count(),
    dexie.categories.count(),
    dexie.goals.count(),
    dexie.holdings.count(),
    dexie.loans.count(),
  ]);
  return expenses + categories + goals + holdings + loans;
}
