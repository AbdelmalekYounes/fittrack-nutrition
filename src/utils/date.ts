// Utilitaires de manipulation de dates au format ISO yyyy-mm-dd (fuseau local).

export function todayISO(): string {
  return toISODate(new Date());
}

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(isoDate: string, days: number): string {
  const date = new Date(isoDate + 'T00:00:00');
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

/** Retourne les n derniers jours (du plus ancien au plus récent), aujourd'hui inclus. */
export function lastNDays(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    days.push(addDays(todayISO(), -i));
  }
  return days;
}

/** Lundi de la semaine en cours pour une date ISO donnée. */
export function startOfWeek(isoDate: string): string {
  const date = new Date(isoDate + 'T00:00:00');
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diffToMonday);
  return toISODate(date);
}

export function isSameOrAfter(dateA: string, dateB: string): boolean {
  return dateA >= dateB;
}

export function formatDateFr(isoDate: string): string {
  const date = new Date(isoDate + 'T00:00:00');
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}
