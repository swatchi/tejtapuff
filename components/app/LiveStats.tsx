"use client";

import { useEffect, useState } from "react";
import { formatEuros } from "@/lib/savings";
import { savedEuros } from "@/lib/program";

function split(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}
const pad = (n: number) => String(n).padStart(2, "0");

function useNow(initial: number) {
  const [now, setNow] = useState(initial);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

/** Compteur « sans puff depuis » en direct. */
export function LiveCounter({ startIso, serverNow }: { startIso: string; serverNow: number }) {
  const now = useNow(serverNow);
  const t = split(now - Date.parse(startIso));
  const blocks: [string, string][] = [
    [String(t.d), t.d > 1 ? "jours" : "jour"],
    [pad(t.h), "h"],
    [pad(t.m), "min"],
    [pad(t.s), "s"],
  ];
  return (
    <div className="flex items-end gap-1.5 font-mono tabular-nums" role="timer" aria-label={`${t.d} jours ${t.h} heures ${t.m} minutes`}>
      {blocks.map(([v, unit]) => (
        <span key={unit} className="flex items-end gap-1">
          <span className="rounded-xl bg-creme px-2 py-1 text-[2rem] font-bold leading-none text-encre" suppressHydrationWarning>
            {v}
          </span>
          <span className="pb-1 text-xs text-creme/70">{unit}</span>
        </span>
      ))}
    </div>
  );
}

/** € économisés qui montent en direct (temps sans puff × conso déclarée). */
export function LiveSavings({
  closedMs,
  currentStartIso,
  unitsPerWeek,
  unitPriceCents,
  serverNow,
}: {
  closedMs: number;
  currentStartIso: string | null;
  unitsPerWeek: number;
  unitPriceCents: number;
  serverNow: number;
}) {
  const now = useNow(serverNow);
  const ms = closedMs + (currentStartIso ? Math.max(0, now - Date.parse(currentStartIso)) : 0);
  return <span suppressHydrationWarning>{formatEuros(savedEuros(ms, unitsPerWeek, unitPriceCents))}</span>;
}
