export const DEFAULT_TZ = "Europe/Paris";

/** "mardi 3 novembre" (ou "Mardi 3 novembre" avec capitalize) */
export function formatDayFr(date: string | Date | null | undefined, opts: { capitalize?: boolean; timeZone?: string } = {}): string {
  if (!date) return "?";
  const d = typeof date === "string" ? new Date(date) : date;
  const s = d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: opts.timeZone ?? DEFAULT_TZ,
  });
  return opts.capitalize ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/** Une date "AAAA-MM-JJ" (sans heure) interprétée à midi pour éviter les décalages de fuseau. */
export function fromDateOnly(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00Z`);
}
