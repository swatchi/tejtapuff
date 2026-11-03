"use client";

import { useEffect, useState } from "react";
import { detectPlatform, type Platform } from "@/lib/client/platform";

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function InstallGuide() {
  const [p, setP] = useState<Platform | null>(null);
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setP(detectPlatform());
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!p) return null;

  if (p.standalone) {
    return <Box title="C'est installé ✅">Tu utilises déjà l&apos;app depuis ton écran d&apos;accueil.</Box>;
  }

  const appUrl = `${window.location.origin}/app`;

  return (
    <div className="space-y-4">
      {p.inApp && (
        <Box title={`1. Sors de ${p.inApp === "tiktok" ? "TikTok" : p.inApp === "instagram" ? "Instagram" : "Facebook"}`}>
          <p>
            L&apos;installation ne marche pas depuis le navigateur de {p.inApp === "tiktok" ? "TikTok" : "l'app"}. Appuie sur{" "}
            <strong>•••</strong> en haut à droite, puis <strong>« Ouvrir dans le navigateur »</strong>
            {p.ios ? " (Safari)" : " (Chrome)"}.
          </p>
          <button
            type="button"
            className="btn btn-light mt-3 min-h-11 w-full py-2"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(appUrl);
                setCopied(true);
              } catch {
                /* ignore */
              }
            }}
          >
            {copied ? "Lien copié ✅ colle-le dans Safari/Chrome" : "Ou copier le lien de l'app"}
          </button>
        </Box>
      )}

      {p.ios ? (
        <Box title={p.inApp ? "2. Dans Safari" : "Dans Safari"}>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              Appuie sur <strong>Partager</strong> (le carré avec une flèche ↑).
            </li>
            <li>
              Choisis <strong>« Sur l&apos;écran d&apos;accueil »</strong>.
            </li>
            <li>
              Appuie sur <strong>Ajouter</strong>.
            </li>
          </ol>
          <p className="mt-3 text-sm text-gris">
            Ouvre ensuite TejTaPuff depuis ton écran d&apos;accueil : tu te reconnectes une fois avec un code, et c&apos;est
            bon. C&apos;est aussi indispensable pour recevoir les notifications sur iPhone.
          </p>
        </Box>
      ) : promptEvent ? (
        <button
          type="button"
          className="btn btn-primary w-full"
          onClick={async () => {
            await promptEvent.prompt();
            setPromptEvent(null);
          }}
        >
          Installer l&apos;app
        </button>
      ) : (
        <Box title={p.inApp ? "2. Dans Chrome" : "Dans Chrome"}>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              Appuie sur <strong>⋮</strong> en haut à droite.
            </li>
            <li>
              Choisis <strong>« Installer l&apos;application »</strong> ou <strong>« Ajouter à l&apos;écran d&apos;accueil »</strong>.
            </li>
          </ol>
        </Box>
      )}
    </div>
  );
}

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <h2 className="text-xl font-extrabold">{title}</h2>
      <div className="mt-2">{children}</div>
    </div>
  );
}
