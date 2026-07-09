import type { PaymentSource, PaymentSourceKind } from '@/types';
import { createId } from '@/utils/id';

const INITIAL_PAYMENT_SOURCES: Array<Omit<PaymentSource, 'id'>> = [
  { name: 'HDFC Bank', kind: 'bank', color: '#3b82f6' },
  { name: 'SBI Bank', kind: 'bank', color: '#2563eb' },
  { name: 'Credit card', kind: 'credit_card', color: '#8b5cf6' },
  { name: 'Debit card', kind: 'debit_card', color: '#5B8CFF' },
  { name: 'UPI / Wallet', kind: 'upi', color: '#06b6d4' },
  { name: 'Cash', kind: 'cash', color: '#22c55e' },
];

async function getDb() {
  const { db } = await import('@/db/index');
  return db;
}

export function normalizePaymentSourceName(name: string): string {
  return name.trim().toLowerCase();
}

export async function findPaymentSourceByName(
  name: string,
  excludeId?: string,
): Promise<PaymentSource | undefined> {
  const db = await getDb();
  const key = normalizePaymentSourceName(name);
  const all = await db.paymentSources.toArray();
  return all.find(
    (p) => p.id !== excludeId && normalizePaymentSourceName(p.name) === key,
  );
}

export async function getPaymentSourceUsage(paymentSourceId: string): Promise<number> {
  const db = await getDb();
  return db.expenses.where('paymentSourceId').equals(paymentSourceId).count();
}

export async function reassignPaymentSourceReferences(
  fromId: string,
  toId: string,
): Promise<void> {
  const db = await getDb();
  await db.expenses.where('paymentSourceId').equals(fromId).modify({
    paymentSourceId: toId,
  });
}

export async function seedInitialPaymentSourcesIfEmpty(): Promise<void> {
  const db = await getDb();
  if ((await db.paymentSources.count()) > 0) return;

  await db.paymentSources.bulkAdd(
    INITIAL_PAYMENT_SOURCES.map((p) => ({
      ...p,
      id: createId(),
    })),
  );
}

export const PAYMENT_SOURCE_KIND_META: Record<
  PaymentSourceKind,
  { label: string }
> = {
  bank: { label: 'Bank account' },
  credit_card: { label: 'Credit card' },
  debit_card: { label: 'Debit card' },
  wallet: { label: 'Wallet' },
  upi: { label: 'UPI' },
  cash: { label: 'Cash' },
  other: { label: 'Other' },
};

export const PAYMENT_SOURCE_KIND_OPTIONS = (
  Object.keys(PAYMENT_SOURCE_KIND_META) as PaymentSourceKind[]
).map((value) => ({
  value,
  label: PAYMENT_SOURCE_KIND_META[value].label,
}));
