import Link from "next/link";

export default function NotFound() {
  return (
    <main className="wrap flex min-h-dvh flex-col justify-center py-16">
      <h1 className="text-4xl font-extrabold leading-none">Page introuvable</h1>
      <p className="mt-3 text-lg">Elle a peut-être été tej, elle aussi.</p>
      <Link href="/" className="btn btn-primary mt-6">
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
