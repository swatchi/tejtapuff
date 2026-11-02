import type { Metadata } from "next";
import { Suspense } from "react";
import { PlanClient } from "./PlanClient";

export const metadata: Metadata = { title: "Ton plan 21 jours", robots: { index: false } };

export default function PlanPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-creme" />}>
      <PlanClient />
    </Suspense>
  );
}
