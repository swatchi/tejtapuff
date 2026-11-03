"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";

const CLE = "ttp_badges_vus";
const COULEURS = ["#ffd43b", "#ff5b3a", "#1fb57a", "#8fd3ff", "#ffb8cb", "#9c7cff"];

/**
 * Fête un badge tout juste gagné (une seule fois par badge, mémorisé sur le téléphone).
 * Confettis + petit message. Rien ne s'affiche si le badge a déjà été vu.
 */
export function Celebrate({ earned }: { earned: { id: string; emoji: string; label: string }[] }) {
  const [badge, setBadge] = useState<{ emoji: string; label: string } | null>(null);

  useEffect(() => {
    let vus: string[] = [];
    try {
      vus = JSON.parse(localStorage.getItem(CLE) ?? "[]");
    } catch {}
    const nouveaux = earned.filter((b) => !vus.includes(b.id));
    if (!nouveaux.length) return;
    try {
      localStorage.setItem(CLE, JSON.stringify([...new Set([...vus, ...earned.map((b) => b.id)])]));
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBadge(nouveaux[nouveaux.length - 1]);
    const t = setTimeout(() => setBadge(null), 5200);
    return () => clearTimeout(t);
  }, [earned]);

  if (!badge) return null;
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {Array.from({ length: 44 }, (_, i) => (
        <span
          key={i}
          className="absolute top-0 block h-3 w-2 rounded-sm"
          style={{
            left: `${(i * 37) % 100}%`,
            background: COULEURS[i % COULEURS.length],
            animation: `ttp-tombe ${2.2 + ((i * 13) % 10) / 6}s ${((i * 7) % 10) / 12}s cubic-bezier(.2,.6,.4,1) forwards`,
            ["--dx" as string]: `${((i * 53) % 80) - 40}px`,
            ["--r" as string]: `${360 + ((i * 97) % 540)}deg`,
          }}
        />
      ))}
      <div className="absolute inset-x-0 top-24 flex justify-center px-4">
        <div
          className="rounded-3xl border-2 border-encre bg-jaune px-6 py-4 text-center shadow-[3px_4px_0_0_#1b1a17]"
          style={{ animation: "ttp-pop .5s ease-out both" }}
        >
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border-2 border-encre bg-white">
            <Icon name={badge.emoji} className="h-8 w-8" />
          </span>
          <p className="mt-1 text-sm font-bold uppercase tracking-wide">Nouveau badge</p>
          <p className="text-xl font-extrabold">{badge.label}</p>
        </div>
      </div>
    </div>
  );
}
