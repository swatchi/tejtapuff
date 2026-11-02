import type { Metadata } from "next";
import { requireMember } from "@/lib/member";
import { InstallGuide } from "./InstallGuide";

export const metadata: Metadata = { title: "Installer l'app", robots: { index: false } };

export default async function InstallerPage() {
  await requireMember({ allowInactive: true });
  return (
    <main className="wrap pt-8">
      <h1 className="text-[2.4rem] font-extrabold leading-none">Installe l&apos;app</h1>
      <p className="mt-3 text-lg">Une icône sur ton écran d&apos;accueil, comme une vraie app. Pas besoin de store.</p>
      <div className="mt-6">
        <InstallGuide />
      </div>
    </main>
  );
}
