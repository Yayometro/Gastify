// Spanish names for the dates the phone shows. The core's own month list is in English (it is
// used for keys and ranges); this one is only for what the person reads.
export const MONTHS_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

export const WEEKDAYS_ES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"] as const;

// "octubre 2026", with the first letter in capitals.
export function monthTitleEs(date: Date): string {
  const name = MONTHS_ES[date.getMonth()];
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${date.getFullYear()}`;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// "Hoy", "Ayer", or "lunes 14 de octubre" (with the year when it is not the current one).
export function dayLabelEs(date: Date, today: Date = new Date()): string {
  if (sameDay(date, today)) return "Hoy";
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (sameDay(date, yesterday)) return "Ayer";
  const base = `${WEEKDAYS_ES[date.getDay()]} ${date.getDate()} de ${MONTHS_ES[date.getMonth()]}`;
  return date.getFullYear() === today.getFullYear() ? base : `${base} de ${date.getFullYear()}`;
}

export const MONTHS_ES_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"] as const;
