// Utility functions for consistent formatting

/**
 * Formats a date in Georgian format (DD.MM.YYYY)
 * This ensures consistent formatting between server and client
 */
export function formatGeorgianDate(date: Date | string | null): string {
  if (!date) return '';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();

  return `${day}.${month}.${year}`;
}

/**
 * Formats a date using locale if available, falls back to Georgian format
 */
export function formatDateSafe(date: Date | string | null, locale: string = 'ka-GE'): string {
  if (!date) return '';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  try {
    return d.toLocaleDateString(locale);
  } catch {
    // Fallback to manual formatting if locale not supported
    return formatGeorgianDate(d);
  }
}