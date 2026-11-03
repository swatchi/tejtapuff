"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";

const ITEMS = [
  { href: "/app", label: "Accueil", icon: "home" },
  { href: "/app/mission", label: "Mission", icon: "check" },
  { href: "/app/sos", label: "SOS", icon: "SOS", sos: true },
  { href: "/app/coach", label: "Coach", icon: "chat" },
  { href: "/app/compte", label: "Compte", icon: "user" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navigation de l'app"
      className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-encre bg-creme pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {ITEMS.map((item) => {
          const active = item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="flex h-16 flex-col items-center justify-center gap-0.5 text-xs font-bold"
              >
                {item.sos ? (
                  <span className="-mt-7 grid h-14 w-14 place-items-center rounded-full border-2 border-encre bg-braise text-sm font-black text-white shadow-[2px_3px_0_0_#1b1a17]">
                    SOS
                  </span>
                ) : (
                  <span
                    aria-hidden
                    className={`grid h-8 w-12 place-items-center rounded-full ${active ? "bg-jaune" : ""}`}
                  >
                    <Icon name={item.icon} className="h-5 w-5" />
                  </span>
                )}
                <span className={active ? "" : "text-encre/60"}>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
