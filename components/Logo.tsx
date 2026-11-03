/**
 * Logo TejTaPuff : la bulle (fichiers dans public/, textes vectorisés).
 * La hauteur suit la taille du texte du parent (1.9em) : mets une classe text-* sur le parent pour le grandir.
 */
export function Logo({ fond = "clair", className = "" }: { fond?: "clair" | "sombre"; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={fond === "sombre" ? "/logo-fond-sombre.svg" : "/logo.svg"}
      alt="TejTaPuff"
      width={677}
      height={312}
      className={`inline-block h-[1.9em] w-auto align-middle ${className}`}
    />
  );
}
