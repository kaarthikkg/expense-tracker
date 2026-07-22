import type { EvConfig, EvOdometerReading } from '@/types';

export const DEFAULT_EV_CONFIG: EvConfig = {
  id: 'app',
  vehicleName: 'My EV',
  petrolPricePerLitre: 105,
  petrolKmPerLitre: 45,
};

export type EvMonthSegment = {
  monthKey: string;
  reading: EvOdometerReading;
  previousReading: EvOdometerReading | null;
  /** km driven since previous reading; null for the first snapshot */
  kmDriven: number | null;
  /** Estimated petrol spend avoided for those km */
  savings: number | null;
};

export type EvSummary = {
  totalKm: number;
  totalSavings: number;
  readingCount: number;
  latestOdometer: number | null;
  segments: EvMonthSegment[];
};

export function sortReadingsAsc(readings: EvOdometerReading[]): EvOdometerReading[] {
  return [...readings].sort((a, b) => a.monthKey.localeCompare(b.monthKey));
}

/** Petrol cost for the same distance — treated as EV savings. */
export function savingsForKm(km: number, config: EvConfig): number {
  if (config.petrolKmPerLitre <= 0) return 0;
  return (km / config.petrolKmPerLitre) * config.petrolPricePerLitre;
}

export function normalizeEvConfig(raw: Partial<EvConfig> | null | undefined): EvConfig {
  return {
    id: 'app',
    vehicleName: (raw?.vehicleName ?? DEFAULT_EV_CONFIG.vehicleName).trim() || DEFAULT_EV_CONFIG.vehicleName,
    petrolPricePerLitre:
      typeof raw?.petrolPricePerLitre === 'number' && raw.petrolPricePerLitre > 0
        ? raw.petrolPricePerLitre
        : DEFAULT_EV_CONFIG.petrolPricePerLitre,
    petrolKmPerLitre:
      typeof raw?.petrolKmPerLitre === 'number' && raw.petrolKmPerLitre > 0
        ? raw.petrolKmPerLitre
        : DEFAULT_EV_CONFIG.petrolKmPerLitre,
  };
}

export function computeEvSummary(
  readings: EvOdometerReading[],
  config: EvConfig,
): EvSummary {
  const sorted = sortReadingsAsc(readings);
  const segments: EvMonthSegment[] = [];
  let totalKm = 0;
  let totalSavings = 0;

  for (let i = 0; i < sorted.length; i++) {
    const reading = sorted[i];
    const previous = i > 0 ? sorted[i - 1] : null;
    let kmDriven: number | null = null;
    let savings: number | null = null;

    if (previous) {
      const km = Math.max(0, reading.odometerKm - previous.odometerKm);
      kmDriven = km;
      savings = savingsForKm(km, config);
      totalKm += km;
      totalSavings += savings;
    }

    segments.push({
      monthKey: reading.monthKey,
      reading,
      previousReading: previous,
      kmDriven,
      savings,
    });
  }

  return {
    totalKm,
    totalSavings,
    readingCount: sorted.length,
    latestOdometer: sorted.length > 0 ? sorted[sorted.length - 1].odometerKm : null,
    segments: [...segments].reverse(),
  };
}

export function readingForMonth(
  readings: EvOdometerReading[],
  monthKey: string,
): EvOdometerReading | undefined {
  return readings.find((r) => r.monthKey === monthKey);
}

/** True when today is the 1st and the current month still has no reading. */
export function needsFirstOfMonthReading(
  readings: EvOdometerReading[],
  today: Date = new Date(),
): boolean {
  if (today.getDate() !== 1) return false;
  const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  return !readingForMonth(readings, monthKey);
}

export function missingCurrentMonthReading(
  readings: EvOdometerReading[],
  today: Date = new Date(),
): boolean {
  const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  return !readingForMonth(readings, monthKey);
}

export function formatKm(km: number): string {
  return `${km.toLocaleString(undefined, { maximumFractionDigits: 1 })} km`;
}

/** km / savings attributed to a calendar month (null if no completed segment yet). */
export function getMonthMetrics(
  summary: EvSummary,
  monthKey: string,
): { kmDriven: number | null; savings: number | null } {
  const seg = summary.segments.find((s) => s.monthKey === monthKey);
  return {
    kmDriven: seg?.kmDriven ?? null,
    savings: seg?.savings ?? null,
  };
}
