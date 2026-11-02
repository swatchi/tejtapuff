// Tests des calculs du programme. Lancer : npm run test:unit
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  attemptStats,
  currentMission,
  isMissionUnlocked,
  programDay,
  savedEuros,
  streakDays,
} from "../../lib/program.ts";

const TZ = "Europe/Paris";
const IDS = Array.from({ length: 21 }, (_, i) => `j${i + 1}`);

test("jour du programme en heure de Paris", () => {
  const start = new Date("2026-11-02T22:30:00Z"); // 23h30 à Paris, le 2
  assert.equal(programDay(null, new Date(), TZ), 0);
  assert.equal(programDay(start, new Date("2026-11-02T22:59:00Z"), TZ), 1);
  assert.equal(programDay(start, new Date("2026-11-02T23:01:00Z"), TZ), 2); // minuit passé à Paris
  assert.equal(programDay(start, new Date("2026-11-22T12:00:00Z"), TZ), 21);
});

test("compteur, meilleure série et rechutes", () => {
  const now = new Date("2026-11-10T12:00:00Z");
  const s = attemptStats(
    [
      { started_at: "2026-11-01T12:00:00Z", ended_at: "2026-11-04T12:00:00Z" }, // 3 jours
      { started_at: "2026-11-05T12:00:00Z", ended_at: null }, // en cours : 5 jours
    ],
    now,
  );
  assert.equal(streakDays(s.currentMs), 5);
  assert.equal(streakDays(s.bestMs), 5);
  assert.equal(streakDays(s.totalMs), 8);
  assert.equal(s.relapses, 1);
  assert.equal(s.firstStart.toISOString(), "2026-11-01T12:00:00.000Z");
});

test("économies : 5 pods à 4 € par semaine", () => {
  assert.equal(savedEuros(7 * 86_400_000, 5, 400), 20);
  assert.equal(savedEuros(0, 5, 400), 0);
  assert.equal(savedEuros(86_400_000, 0, 400), 0);
});

test("mission à afficher pendant les 21 jours", () => {
  assert.deepEqual(currentMission(0, new Set(), IDS, 8), { kind: "not_started" });
  assert.deepEqual(currentMission(1, new Set(), IDS, 8), { kind: "program", id: "j1", number: 1, late: false });
  assert.deepEqual(currentMission(1, new Set(["j1"]), IDS, 8), { kind: "program_done_today", nextNumber: 2 });
  // En retard : J5 mais seulement J1 et J2 faites → on propose J3
  assert.deepEqual(currentMission(5, new Set(["j1", "j2"]), IDS, 8), { kind: "program", id: "j3", number: 3, late: true });
});

test("consolidation hebdo après J21", () => {
  const all = new Set(IDS);
  assert.deepEqual(currentMission(22, all, IDS, 8), { kind: "consolidation", id: "w0", week: 0, contentIndex: 0 });
  assert.deepEqual(currentMission(29, all, IDS, 8), { kind: "consolidation", id: "w1", week: 1, contentIndex: 1 });
  assert.deepEqual(currentMission(22 + 7 * 8, all, IDS, 8), { kind: "consolidation", id: "w8", week: 8, contentIndex: 0 });
  assert.deepEqual(currentMission(23, new Set([...IDS, "w0"]), IDS, 8), { kind: "consolidation_done", week: 0 });
});

test("impossible de valider une mission pas encore débloquée", () => {
  assert.equal(isMissionUnlocked("j3", 2, IDS), false);
  assert.equal(isMissionUnlocked("j2", 2, IDS), true);
  assert.equal(isMissionUnlocked("w0", 21, IDS), false);
  assert.equal(isMissionUnlocked("w0", 22, IDS), true);
  assert.equal(isMissionUnlocked("w1", 22, IDS), false);
  assert.equal(isMissionUnlocked("nimportequoi", 30, IDS), false);
});
