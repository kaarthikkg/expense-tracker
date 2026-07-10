import {
  collection,
  doc,
  getDoc,
  getDocs,
  writeBatch,
  type Firestore,
  type QuerySnapshot,
} from 'firebase/firestore';
import { db as dexie } from '@/db';
import { getFirebaseDb, isFirebaseConfigured } from '@/lib/firebase';
import { importBackup } from '@/services/importExport';
import type { ExportData } from '@/types';

export const SYNC_COLLECTIONS = [
  'expenses',
  'categories',
  'paymentSources',
  'budgets',
  'goals',
  'recurringExpenses',
  'holdings',
  'loans',
] as const;

export type SyncCollection = (typeof SYNC_COLLECTIONS)[number];
export type SyncTarget = SyncCollection | 'settings';

const BATCH_LIMIT = 400;
const BATCH_CONCURRENCY = 3;

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

function stableStringify(data: Record<string, unknown>): string {
  const cleaned = stripUndefined(data);
  const keys = Object.keys(cleaned).sort();
  const sorted: Record<string, unknown> = {};
  for (const key of keys) sorted[key] = cleaned[key];
  return JSON.stringify(sorted);
}

function docsEqual(
  local: Record<string, unknown>,
  remote: Record<string, unknown>,
): boolean {
  return stableStringify(local) === stableStringify(remote);
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
  if (ops.length === 0) return;

  const chunks: Array<typeof ops> = [];
  for (let i = 0; i < ops.length; i += BATCH_LIMIT) {
    chunks.push(ops.slice(i, i + BATCH_LIMIT));
  }

  for (let i = 0; i < chunks.length; i += BATCH_CONCURRENCY) {
    const wave = chunks.slice(i, i + BATCH_CONCURRENCY);
    await Promise.all(
      wave.map(async (chunk) => {
        const batch = writeBatch(firestore);
        for (const op of chunk) op(batch);
        await batch.commit();
      }),
    );
  }
}

function buildCollectionOps(
  firestore: Firestore,
  uid: string,
  name: SyncCollection,
  localItems: Array<{ id: string } & Record<string, unknown>>,
  remoteSnap: QuerySnapshot,
): Array<(batch: ReturnType<typeof writeBatch>) => void> {
  const ops: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];
  const localIds = new Set(localItems.map((item) => item.id));
  const remoteById = new Map(
    remoteSnap.docs.map((d) => [d.id, d.data() as Record<string, unknown>]),
  );

  for (const remoteDoc of remoteSnap.docs) {
    if (!localIds.has(remoteDoc.id)) {
      ops.push((batch) => batch.delete(remoteDoc.ref));
    }
  }

  for (const item of localItems) {
    const payload = stripUndefined({ ...item });
    const remote = remoteById.get(item.id);
    if (remote && docsEqual(payload, { id: item.id, ...remote })) {
      continue;
    }
    const ref = doc(userCol(firestore, uid, name), item.id);
    ops.push((batch) => batch.set(ref, payload));
  }

  return ops;
}

export interface PushOptions {
  /** When set, only these targets are synced (plus meta). Full sync if omitted. */
  targets?: SyncTarget[];
}

async function loadLocalCollection(
  name: SyncCollection,
): Promise<Array<{ id: string } & Record<string, unknown>>> {
  const rows = await dexie.table(name).toArray();
  return rows as Array<{ id: string } & Record<string, unknown>>;
}

/**
 * Push local Dexie data to Firestore.
 * Diff-only writes + parallel collection reads — much faster on mobile than a full mirror.
 */
export async function pushLocalToCloud(
  uid: string,
  options: PushOptions = {},
): Promise<void> {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured');
  }
  const firestore = getFirebaseDb();
  const targets = options.targets;
  const syncAll = !targets || targets.length === 0;

  const collections: SyncCollection[] = syncAll
    ? [...SYNC_COLLECTIONS]
    : SYNC_COLLECTIONS.filter((name) => targets.includes(name));
  const includeSettings = syncAll || Boolean(targets?.includes('settings'));

  const settingsRef = doc(firestore, 'users', uid, 'settings', 'app');

  const [localLists, remoteSnaps, remoteSettings, localSettings] = await Promise.all([
    Promise.all(collections.map((name) => loadLocalCollection(name))),
    Promise.all(collections.map((name) => getDocs(userCol(firestore, uid, name)))),
    includeSettings ? getDoc(settingsRef) : Promise.resolve(null),
    includeSettings
      ? dexie.settings.get('app')
      : Promise.resolve(undefined),
  ]);

  const ops: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];

  for (let i = 0; i < collections.length; i++) {
    ops.push(
      ...buildCollectionOps(
        firestore,
        uid,
        collections[i],
        localLists[i],
        remoteSnaps[i],
      ),
    );
  }

  if (includeSettings) {
    const settings = localSettings ?? {
      id: 'app' as const,
      theme: 'system' as const,
      currency: 'INR' as const,
    };
    const payload = stripUndefined({ ...settings } as Record<string, unknown>);
    const remoteData = remoteSettings?.exists()
      ? (remoteSettings.data() as Record<string, unknown>)
      : null;
    if (!remoteData || !docsEqual(payload, remoteData)) {
      ops.push((batch) => batch.set(settingsRef, payload));
    }
  }

  // Always bump meta so other devices know something changed
  ops.push((batch) =>
    batch.set(metaRef(firestore, uid), {
      updatedAt: new Date().toISOString(),
      version: 4,
      exportedAt: new Date().toISOString(),
    }),
  );

  await commitBatches(firestore, ops);
}

export async function pullCloudToLocal(uid: string): Promise<boolean> {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured');
  }
  const firestore = getFirebaseDb();

  const [meta, settingsSnap, ...collectionSnaps] = await Promise.all([
    getDoc(metaRef(firestore, uid)),
    getDoc(doc(firestore, 'users', uid, 'settings', 'app')),
    ...SYNC_COLLECTIONS.map((name) => getDocs(userCol(firestore, uid, name))),
  ]);

  const expenseSnap = collectionSnaps[0];
  if (!meta.exists() && expenseSnap.empty) {
    return false;
  }

  const settings = settingsSnap.exists()
    ? (settingsSnap.data() as ExportData['settings'])
    : { id: 'app' as const, theme: 'system' as const, currency: 'INR' as const };

  const asRows = <T>(snap: QuerySnapshot): T[] =>
    snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);

  const exportData: ExportData = {
    version: (meta.data()?.version as number) ?? 4,
    exportedAt: (meta.data()?.exportedAt as string) ?? new Date().toISOString(),
    expenses: asRows(collectionSnaps[0]),
    categories: asRows(collectionSnaps[1]),
    paymentSources: asRows(collectionSnaps[2]),
    budgets: asRows(collectionSnaps[3]),
    goals: asRows(collectionSnaps[4]),
    recurringExpenses: asRows(collectionSnaps[5]),
    holdings: asRows(collectionSnaps[6]),
    loans: asRows(collectionSnaps[7]),
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

/** Map Dexie table name → sync target. */
export function tableToSyncTarget(tableName: string): SyncTarget | null {
  if (tableName === 'settings') return 'settings';
  if ((SYNC_COLLECTIONS as readonly string[]).includes(tableName)) {
    return tableName as SyncCollection;
  }
  return null;
}
