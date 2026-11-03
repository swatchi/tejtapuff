"use client";

import { useState } from "react";

export function ShareCard({ imageUrl }: { imageUrl: string }) {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const getFile = async () => {
    const res = await fetch(imageUrl, { cache: "no-store" });
    if (!res.ok) throw new Error("Image indisponible");
    const blob = await res.blob();
    return new File([blob], "tejtapuff-story.png", { type: "image/png" });
  };

  const share = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const file = await getFile();
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
        setStatus("Partagé.");
      } else {
        download(file);
        setStatus("Image enregistrée. Ajoute-la à ta story depuis ta galerie.");
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setStatus("Partage impossible ici : appuie longuement sur l'image pour l'enregistrer.");
    } finally {
      setBusy(false);
    }
  };

  const download = (file: File) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  return (
    <div>
      <div className="mx-auto w-full max-w-[18rem] -rotate-1 overflow-hidden rounded-3xl border-2 border-encre shadow-[5px_6px_0_0_#1b1a17]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="Ta carte TejTaPuff à partager" width={1080} height={1920} className="block h-auto w-full bg-jaune" />
      </div>
      <div className="mt-8 grid gap-3">
        <button type="button" className="btn btn-primary w-full" disabled={busy} onClick={share}>
          {busy ? "Préparation…" : "Partager en story"}
        </button>
        <button
          type="button"
          className="btn btn-light w-full"
          disabled={busy}
          onClick={async () => {
            try {
              download(await getFile());
              setStatus("Image enregistrée.");
            } catch {
              setStatus("Téléchargement impossible ici : appuie longuement sur l'image pour l'enregistrer.");
            }
          }}
        >
          Enregistrer l&apos;image
        </button>
      </div>
      {status && <p className="mt-3 text-center text-sm font-semibold">{status}</p>}
      <p className="mt-6 text-center text-sm text-gris">
        Sur Instagram ou TikTok : nouvelle story → choisis l&apos;image dans ta galerie.
      </p>
    </div>
  );
}
