/**
 * Calculs du programme (jour X/21, compteur, économies, mission à afficher).
 * Fonctions pures, sans dépendance : testées dans tests/unit/program.test.mjs.
 * Tous les chiffres affichés dans l'app sortent d'ici, à partir des données en base.
 */

export const PROGRAM_DAYS = 21;
export const DAY_MS = 86_400_000;

export type Attempt = { started_at: string; ended_at: string | null };

/** Date locale "AAAA-MM-JJ" dans un fuseau donné. */
export function localDateKey(d: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

function dayIndex(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / DAY_MS;
}

/** Nombre de jours calendaires entre deux dates (dans le fuseau de l'utilisateur). */
export function calendarDaysBetween(from: Date, to: Date, timeZone: string): number {
  return dayIndex(localDateKey(to, timeZone)) - dayIndex(localDateKey(from, timeZone));
}

/** Jour du programme : 1 le jour où la personne a démarré, 0 si elle n'a pas encore démarré. */
export function programDay(firstStart: Date | null, now: Date, timeZone: string): number {
  if (!firstStart) return 0;
  return Math.max(1, calendarDaysBetween(firstStart, now, timeZone) + 1);
}

export function attemptStats(attempts: Attempt[], now: Date) {
  let totalMs = 0;
  let bestMs = 0;
  let current: Attempt | null = null;
  let firstStart: number | null = null;
  for (const a of attempts) {
    const start = Date.parse(a.started_at);
    const end = a.ended_at ? Date.parse(a.ended_at) : now.getTime();
    const ms = Math.max(0, end - start);
    totalMs += ms;
    bestMs = Math.max(bestMs, ms);
    if (!a.ended_at) current = a;
    if (firstStart === null || start < firstStart) firstStart = start;
  }
  const currentMs = current ? Math.max(0, now.getTime() - Date.parse(current.started_at)) : 0;
  return {
    /** Temps total sans puff, toutes tentatives confondues */
    totalMs,
    /** Meilleure série */
    bestMs,
    /** Tentative en cours (le compteur en direct) */
    currentMs,
    currentStart: current?.started_at ?? null,
    firstStart: firstStart === null ? null : new Date(firstStart),
    relapses: attempts.filter((a) => a.ended_at).length,
  };
}

/** € économisés pour une durée sans puff, d'après la conso déclarée. */
export function savedEuros(smokeFreeMs: number, unitsPerWeek: number, unitPriceCents: number): number {
  if (!unitsPerWeek || !unitPriceCents) return 0;
  return (smokeFreeMs / (7 * DAY_MS)) * unitsPerWeek * (unitPriceCents / 100);
}

/** Série en jours entiers (« Jour 12 sans puff »). */
export function streakDays(ms: number): number {
  return Math.floor(ms / DAY_MS);
}

export type MissionSlot =
  | { kind: "not_started" }
  | { kind: "program"; id: string; number: number; late: boolean }
  | { kind: "program_done_today"; nextNumber: number }
  | { kind: "consolidation"; id: string; week: number; contentIndex: number }
  | { kind: "consolidation_done"; week: number };

/**
 * Mission à afficher.
 * - Pendant les 21 jours : la 1re mission débloquée et pas encore faite (une nouvelle par jour).
 * - Après J21 (ou quand les 21 sont faites et qu'on a passé J21) : une mission de consolidation par semaine.
 */
export function currentMission(
  day: number,
  completed: Set<string>,
  programIds: string[],
  consolidationCount: number,
): MissionSlot {
  if (day <= 0) return { kind: "not_started" };
  const unlocked = programIds.slice(0, Math.min(day, programIds.length));
  const idx = unlocked.findIndex((id) => !completed.has(id));
  if (idx !== -1) return { kind: "program", id: unlocked[idx], number: idx + 1, late: idx + 1 < Math.min(day, PROGRAM_DAYS) };
  if (day <= PROGRAM_DAYS) return { kind: "program_done_today", nextNumber: day + 1 };
  const week = Math.floor((day - PROGRAM_DAYS - 1) / 7);
  const id = `w${week}`;
  if (completed.has(id)) return { kind: "consolidation_done", week };
  return { kind: "consolidation", id, week, contentIndex: week % consolidationCount };
}

/** Mission débloquée ? (empêche de valider une mission future) */
export function isMissionUnlocked(id: string, day: number, programIds: string[]): boolean {
  const n = programIds.indexOf(id);
  if (n !== -1) return day >= n + 1;
  const m = /^w(\d+)$/.exec(id);
  if (!m) return false;
  return day > PROGRAM_DAYS && Number(m[1]) <= Math.floor((day - PROGRAM_DAYS - 1) / 7);
}
