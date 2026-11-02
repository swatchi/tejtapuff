"use client";

import { useSearchParams } from "next/navigation";

/** Message affiché sur la landing après suppression du compte. */
export function DeletedNotice() {
  const params = useSearchParams();
  if (params.get("compte") !== "supprime") return null;
  return (
    <div role="status" className="bg-encre px-4 py-3 text-center text-sm font-semibold text-creme">
      Ton compte et tes données ont bien été supprimés. Prends soin de toi. 💛
    </div>
  );
}
