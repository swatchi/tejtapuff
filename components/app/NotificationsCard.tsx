"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { detectPlatform } from "@/lib/client/platform";
import { Icon } from "@/components/Icon";

type State = "loading" | "unsupported" | "needs-install" | "off" | "on" | "denied" | "error";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function registration() {
  const existing = await navigator.serviceWorker.getRegistration("/");
  return existing ?? navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

/**
 * Activer / tester / couper les notifications.
 * Sur iPhone, les notifications web ne marchent qu'une fois l'app ajoutée à l'écran d'accueil.
 */
export function NotificationsCard({ compact = false }: { compact?: boolean }) {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const p = detectPlatform();
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    if (!supported) return setState(p.ios && !p.standalone ? "needs-install" : "unsupported");
    if (Notification.permission === "denied") return setState("denied");
    const reg = await navigator.serviceWorker.getRegistration("/");
    const sub = await reg?.pushManager.getSubscription();
    setState(sub && Notification.permission === "granted" ? "on" : "off");
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh().catch(() => setState("error"));
  }, [refresh]);

  const enable = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return;
      }
      const keyRes = await fetch("/api/push/key");
      const { publicKey, error } = await keyRes.json();
      if (!publicKey) throw new Error(error ?? "Clé indisponible");
      const reg = await registration();
      await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) }));
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
      });
      if (!res.ok) throw new Error("Enregistrement impossible");
      setState("on");
      setMessage("Notifications activées.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Activation impossible");
      setState("error");
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState("off");
      setMessage("Notifications coupées sur cet appareil.");
    } finally {
      setBusy(false);
    }
  };

  const test = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      const { delivered } = await res.json();
      setMessage(delivered ? "Notification envoyée, regarde ton écran." : "Aucun appareil joignable, réactive les notifications.");
    } finally {
      setBusy(false);
    }
  };

  if (state === "loading") return null;
  if (compact && (state === "on" || state === "unsupported")) return null;

  return (
    <div className="card p-4">
      <p className="flex items-center gap-2 font-extrabold">
        <Icon name="bell" className="h-5 w-5" /> Notifications
      </p>
      {state === "needs-install" && (
        <p className="mt-1 text-[0.95rem]">
          Sur iPhone, les notifications marchent une fois l&apos;app ajoutée à l&apos;écran d&apos;accueil.{" "}
          <Link href="/app/installer" className="font-bold underline">
            Comment faire
          </Link>
        </p>
      )}
      {state === "unsupported" && (
        <p className="mt-1 text-[0.95rem]">Ce navigateur ne gère pas les notifications. Tu recevras ta mission par email.</p>
      )}
      {state === "denied" && (
        <p className="mt-1 text-[0.95rem]">
          Elles sont bloquées. Autorise-les dans les réglages de ton téléphone (Réglages → Notifications), puis reviens ici.
        </p>
      )}
      {(state === "off" || state === "error") && (
        <>
          <p className="mt-1 text-[0.95rem]">Ta mission le matin, et un petit mot aux moments où l&apos;envie frappe le plus.</p>
          <button type="button" className="btn btn-primary mt-3 min-h-12 w-full py-2" disabled={busy} onClick={enable}>
            {busy ? "Activation…" : "Activer les notifications"}
          </button>
        </>
      )}
      {state === "on" && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button type="button" className="btn btn-light min-h-11 py-1.5 text-base" disabled={busy} onClick={test}>
            Tester
          </button>
          <button type="button" className="btn btn-light min-h-11 py-1.5 text-base" disabled={busy} onClick={disable}>
            Couper
          </button>
        </div>
      )}
      {message && <p className="mt-2 text-sm font-semibold">{message}</p>}
    </div>
  );
}
