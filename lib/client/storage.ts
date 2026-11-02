"use client";

/** sessionStorage qui ne plante jamais (navigation privée, navigateurs intégrés…). */
export function readSession<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeSession(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export const KEYS = {
  calc: "ttp_calc",
  quizDraft: "ttp_quiz_draft",
  quiz: "ttp_quiz",
} as const;

export type CalcState = { unit: string; perMonth: number; unitPrice: number };
