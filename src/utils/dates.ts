export function toDateString(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function getMonthKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function parseMonthKey(month: string): { year: number; month: number } {
  const [y, m] = month.split('-').map(Number);
  return { year: y, month: m };
}

export function formatMonthLabel(monthKey: string): string {
  const { year, month } = parseMonthKey(monthKey);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

export function isSameDay(a: string, b: string): boolean {
  return a.slice(0, 10) === b.slice(0, 10);
}

export function isInMonth(dateStr: string, monthKey: string): boolean {
  const day = dateStr.slice(0, 10);
  const { start, end } = getMonthRange(monthKey);
  return day >= start && day <= end;
}

export function formatDisplayDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return toDateString(d);
}

export function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setMonth(d.getMonth() + months);
  return toDateString(d);
}

export function addYears(dateStr: string, years: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setFullYear(d.getFullYear() + years);
  return toDateString(d);
}

export function getMonthRange(monthKey: string): { start: string; end: string } {
  const { year, month } = parseMonthKey(monthKey);
  const days = getDaysInMonth(year, month);
  const m = String(month).padStart(2, '0');
  return {
    start: `${year}-${m}-01`,
    end: `${year}-${m}-${String(days).padStart(2, '0')}`,
  };
}

export function getYearRange(year: number): { start: string; end: string } {
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}
