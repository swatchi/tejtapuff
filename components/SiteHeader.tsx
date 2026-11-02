import Link from "next/link";
import { Logo } from "@/components/Logo";

export function SiteHeader({ tone = "jaune" }: { tone?: "jaune" | "creme" }) {
  return (
    <header className={tone === "jaune" ? "bg-jaune" : "bg-creme"}>
      <div className="wrap flex h-16 items-center justify-between">
        <Link href="/" aria-label="TejTaPuff, accueil" className="text-[1.6rem]">
          <Logo />
        </Link>
        <Link href="/connexion" className="rounded-full px-3 py-2 text-[0.95rem] font-semibold underline-offset-4 hover:underline">
          Se connecter
        </Link>
      </div>
    </header>
  );
}
