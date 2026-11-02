"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CALCULATOR } from "@/content/landing";
import { getUnit, UNITS, type UnitId } from "@/content/units";
import { trackOnce } from "@/lib/client/attribution";
import { KEYS, writeSession } from "@/lib/client/storage";
import { costs, formatEuros } from "@/lib/savings";

export function parsePrice(text: string): number {
  const n = parseFloat(text.replace(",", ".").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? Math.min(n, 100) : 0;
}

export function Calculator() {
  const [unitId, setUnitId] = useState<UnitId>("puff");
  const unit = getUnit(unitId);
  const [perMonth, setPerMonth] = useState(unit.defaultPerMonth);
  const [priceText, setPriceText] = useState(String(unit.defaultPrice));
  const price = parsePrice(priceText);
  const c = costs(perMonth, price);
  const touched = useRef(false);

  const touch = () => {
    if (touched.current) return;
    touched.current = true;
    trackOnce("calc_used");
  };

  useEffect(() => {
    writeSession(KEYS.calc, { unit: unitId, perMonth, unitPrice: price });
  }, [unitId, perMonth, price]);

  const pickUnit = (id: UnitId) => {
    touch();
    const u = getUnit(id);
    setUnitId(id);
    setPerMonth(u.defaultPerMonth);
    setPriceText(String(u.defaultPrice));
  };

  const step = (delta: number) => {
    touch();
    setPerMonth((n) => Math.min(unit.maxPerMonth, Math.max(1, n + delta)));
  };

  const equivalent = Math.floor(c.year / CALCULATOR.equivalent.unitPrice);

  return (
    <div>
      <div className="card p-4 sm:p-5">
        <fieldset>
          <legend className="text-sm font-bold uppercase tracking-wide text-gris">{CALCULATOR.unitQuestion}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {UNITS.map((u) => (
              <button
                key={u.id}
                type="button"
                className="chip min-h-11 px-3.5 py-2 text-[0.95rem]"
                aria-pressed={u.id === unitId}
                onClick={() => pickUnit(u.id)}
              >
                {u.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-4 grid grid-cols-[1fr_auto] items-end gap-3">
          <div>
            <p id="permonth-label" className="text-sm font-bold uppercase tracking-wide text-gris">
              {CALCULATOR.perMonthQuestion}
            </p>
            <div className="mt-2 flex items-center gap-2" role="group" aria-labelledby="permonth-label">
              <button
                type="button"
                className="btn btn-light h-12 min-h-12 w-12 p-0 text-2xl"
                onClick={() => step(-1)}
                aria-label="Moins"
                disabled={perMonth <= 1}
              >
                −
              </button>
              <output className="min-w-[4.5rem] text-center text-3xl font-extrabold tabular-nums" aria-live="polite">
                {perMonth}
                <span className="block text-xs font-semibold text-gris">{perMonth > 1 ? unit.plural : unit.singular}</span>
              </output>
              <button
                type="button"
                className="btn btn-light h-12 min-h-12 w-12 p-0 text-2xl"
                onClick={() => step(1)}
                aria-label="Plus"
                disabled={perMonth >= unit.maxPerMonth}
              >
                +
              </button>
            </div>
          </div>
          <label className="block w-[6.75rem]">
            <span className="text-sm font-bold uppercase tracking-wide text-gris">{CALCULATOR.priceQuestion}</span>
            <span className="relative mt-2 block">
              <input
                className="field min-h-12 pr-8 text-right text-xl font-bold tabular-nums"
                inputMode="decimal"
                value={priceText}
                onChange={(e) => {
                  touch();
                  setPriceText(e.target.value.slice(0, 6));
                }}
                aria-label={`Prix d'un ${unit.singular} en euros`}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-lg font-bold">€</span>
            </span>
          </label>
        </div>
      </div>

      {/* Le ticket */}
      <div className="relative z-0 mx-2 -mt-3 -rotate-[1.2deg] drop-shadow-[3px_4px_0_#1b1a17]">
        <div className="receipt px-5 pt-7 font-mono text-[0.95rem]">
          <p className="text-center text-xs font-bold uppercase tracking-[0.25em] text-gris">
            ★ {CALCULATOR.title} ★
          </p>
          <p className="mt-1 text-center text-xs text-gris">
            {perMonth} {perMonth > 1 ? unit.plural : unit.singular} × {formatEuros(price)} / mois
          </p>
          <div className="my-3 border-t-2 border-dashed border-encre/40" />
          {(
            [
              [CALCULATOR.lines.month, c.month],
              [CALCULATOR.lines.halfYear, c.halfYear],
              [CALCULATOR.lines.year, c.year],
            ] as const
          ).map(([label, amount]) => (
            <p key={label} className="flex items-baseline py-0.5">
              <span>{label}</span>
              <span className="mx-2 mb-1 flex-1 border-b-2 border-dotted border-encre/30" />
              <span className="font-bold tabular-nums">{formatEuros(amount)}</span>
            </p>
          ))}
          <div className="my-3 border-t-2 border-double border-encre" />
          <p className="text-center text-xs font-bold uppercase tracking-[0.2em]">{CALCULATOR.totalLabel}</p>
          <p
            className="text-center font-sans text-[3.25rem] font-extrabold leading-none tracking-tight text-braise tabular-nums"
            aria-live="polite"
          >
            {formatEuros(c.year)}
          </p>
          {equivalent >= 2 && (
            <p className="mt-2 text-center text-xs text-gris">
              ≈ {equivalent} {CALCULATOR.equivalent.label} (à {CALCULATOR.equivalent.unitPrice} €)
            </p>
          )}
        </div>
      </div>

      <Link href="/quiz" className="btn btn-primary mt-6 w-full text-lg">
        {CALCULATOR.cta} →
      </Link>
      <p className="mt-3 text-center text-xs text-encre/70">{CALCULATOR.footnote}</p>
    </div>
  );
}
