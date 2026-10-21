const MONTHS: Record<string, string> = {
  January: 'Enero', February: 'Febrero', March: 'Marzo', April: 'Abril', May: 'Mayo', June: 'Junio', July: 'Julio',
  August: 'Agosto', September: 'Septiembre', October: 'Octubre', November: 'Noviembre', December: 'Diciembre',
  Jan: 'Ene', Feb: 'Feb', Mar: 'Mar', Apr: 'Abr', Jun: 'Jun', Jul: 'Jul', Aug: 'Ago', Sep: 'Sep', Sept: 'Sep', Oct: 'Oct', Nov: 'Nov', Dec: 'Dic',
};

// The analyzer's month labels come out of the shared calculations in English ("October 2026", "Oct"); the phone shows
// them in Spanish.
export function esMonthLabel(label: string | undefined | null): string {
  return String(label ?? '').replace(/\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec)\b/gi, (match) => {
    const key = match[0].toUpperCase() + match.slice(1).toLowerCase();
    return MONTHS[key] ?? match;
  });
}
