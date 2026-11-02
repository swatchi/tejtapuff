"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { LIMITS } from "@/config/site";

type Props = { mode: "checkout"; checkoutSessionId: string } | { mode: "email"; next?: string };

/**
 * Connexion par code à 6 chiffres reçu par email.
 * Mode « checkout » : juste après le paiement, l'email vient de Stripe.
 * Mode « email » : la personne tape son email (page /connexion).
 */
export function OtpForm(props: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [masked, setMasked] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const autoSent = useRef(false);

  const identity = props.mode === "checkout" ? { checkoutSessionId: props.checkoutSessionId } : { email };

  const sendCode = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(props.mode === "checkout" ? { checkoutSessionId: props.checkoutSessionId } : { email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Envoi impossible");
      setMasked(data.email);
      setCooldown(LIMITS.loginCodeCooldownSeconds);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Envoi impossible");
    } finally {
      setBusy(false);
    }
  }, [props, email]);

  // Après paiement : on envoie le code tout de suite (une seule fois par session de paiement).
  useEffect(() => {
    if (props.mode !== "checkout" || autoSent.current) return;
    autoSent.current = true;
    const key = `ttp_code_sent_${props.checkoutSessionId}`;
    let already = false;
    try {
      already = Boolean(sessionStorage.getItem(key));
      sessionStorage.setItem(key, "1");
    } catch {
      /* ignore */
    }
    if (already) {
      setMasked("ton adresse email");
    } else {
      void sendCode();
    }
  }, [props, sendCode]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...identity, code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Code invalide");
      const next = props.mode === "email" && props.next ? props.next : "/app";
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Code invalide");
      setBusy(false);
    }
  };

  // Étape 1 (mode email) : demander l'email
  if (props.mode === "email" && !masked) {
    return (
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (/\S+@\S+\.\S+/.test(email)) void sendCode();
        }}
      >
        <label className="block">
          <span className="font-bold">Ton email</span>
          <input
            type="email"
            className="field mt-1"
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            value={email}
            onChange={(e) => setEmail(e.target.value.trim())}
            placeholder="toi@exemple.fr"
          />
        </label>
        {error && <ErrorBox>{error}</ErrorBox>}
        <button type="submit" className="btn btn-primary w-full" disabled={busy || !/\S+@\S+\.\S+/.test(email)}>
          {busy ? "Envoi…" : "Recevoir mon code"}
        </button>
      </form>
    );
  }

  return (
    <form className="space-y-4" onSubmit={verify}>
      <p className="text-[1.05rem]">
        {masked ? (
          <>
            On a envoyé un code à <strong>{masked}</strong>
            {props.mode === "email" && " (si un compte existe avec cet email)"}.
          </>
        ) : busy ? (
          "On t'envoie ton code…"
        ) : (
          "Ton code arrive par email."
        )}
      </p>
      <label className="block">
        <span className="font-bold">Code à 6 chiffres</span>
        <input
          className="field mt-1 text-center font-mono text-3xl tracking-[0.4em]"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={10}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 10))}
          placeholder="••••••"
          aria-describedby="code-help"
        />
        <span id="code-help" className="mt-1 block text-sm text-gris">
          Regarde aussi dans tes spams / promotions.
        </span>
      </label>
      {error && <ErrorBox>{error}</ErrorBox>}
      <button type="submit" className="btn btn-primary w-full" disabled={busy || code.length < 6}>
        {busy ? "Vérification…" : "Entrer dans l'app →"}
      </button>
      <button
        type="button"
        className="w-full py-2 text-[0.95rem] font-semibold underline underline-offset-4 disabled:no-underline disabled:opacity-50"
        disabled={busy || cooldown > 0}
        onClick={() => void sendCode()}
      >
        {cooldown > 0 ? `Renvoyer un code (${cooldown} s)` : "Renvoyer un code"}
      </button>
    </form>
  );
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-2xl border-2 border-braise bg-white p-3 text-[0.95rem]">
      {children}
    </p>
  );
}
