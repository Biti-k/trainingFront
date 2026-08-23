// Workout/analytics dates represent a calendar day, not a specific instant.
// Parsing the ISO string with `new Date(iso)` and then formatting with
// `toLocaleDateString()` re-applies the viewer's timezone offset, which can
// shift the displayed day backward or forward depending on where they are.
// This extracts the Y-M-D directly and builds a local-midnight Date, so the
// day shown always matches the day that was picked/stored, in every timezone.
export function parseDateOnly(value: string): Date {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

// The app's copy is in English, but dates are shown DD/MM/YYYY (en-GB)
// regardless of the viewer's own browser locale, since the target audience
// reads dates that way rather than the US MM/DD/YYYY convention.
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB');
}

export function formatDateLong(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
