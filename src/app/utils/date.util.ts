/** Local calendar date as `YYYY-MM-DD` (not UTC). */
export function formatLocalISODate(date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** First day of the given month as `YYYY-MM-DD`. month is 0-based. */
export function monthStartDate(year: number, month: number): string {
  return formatLocalISODate(new Date(year, month, 1));
}

/** Last day of the given month as `YYYY-MM-DD`. month is 0-based. */
export function monthEndDate(year: number, month: number): string {
  return formatLocalISODate(new Date(year, month + 1, 0));
}

/** Short month label like "May 2026". */
export function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}
