"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="wrap flex min-h-dvh flex-col justify-center py-16">
      <h1 className="text-4xl font-extrabold leading-none">Oups, un bug</h1>
      <p className="mt-3 text-lg">Ce n&apos;est pas toi, c&apos;est nous. Réessaie dans un instant.</p>
      <div className="mt-6 grid gap-3">
        <button type="button" className="btn btn-primary" onClick={reset}>
          Réessayer
        </button>
        <Link href="/" className="btn btn-light">
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
