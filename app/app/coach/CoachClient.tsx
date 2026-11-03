"use client";

import { useEffect, useRef, useState } from "react";
import { COACH_SUGGESTIONS, COACH_WELCOME } from "@/content/coach-prompt";

type Msg = { id: string; role: "user" | "assistant"; content: string };

const MAX = 1000;

/** Nettoie le peu de Markdown que le modèle pourrait renvoyer. */
function clean(text: string) {
  return text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/^#+\s*/gm, "");
}

export function CoachClient({ initial, remaining: initialRemaining }: { initial: Msg[]; remaining: number }) {
  const [messages, setMessages] = useState<Msg[]>(initial);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [remaining, setRemaining] = useState(initialRemaining);
  const [crisis, setCrisis] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, crisis]);

  const send = async (raw: string) => {
    const text = raw.trim().slice(0, MAX);
    if (!text || streaming || remaining <= 0) return;
    setError(null);
    setInput("");
    setStreaming(true);
    const userMsg: Msg = { id: `u${Date.now()}`, role: "user", content: text };
    const botId = `a${Date.now()}`;
    setMessages((m) => [...m, userMsg, { id: botId, role: "assistant", content: "" }]);
    const appendBot = (chunk: string) =>
      setMessages((m) => m.map((x) => (x.id === botId ? { ...x, content: x.content + chunk } : x)));

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        if (typeof data.remaining === "number") setRemaining(data.remaining);
        setMessages((m) => m.filter((x) => x.id !== botId));
        setError(data.error ?? "Oups, réessaie dans un instant.");
        return;
      }
      const left = Number(res.headers.get("x-coach-remaining"));
      if (Number.isFinite(left)) setRemaining(left);
      if (res.headers.get("x-coach-crisis") === "1") setCrisis(true);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        appendBot(decoder.decode(value, { stream: true }));
      }
    } catch {
      setError("Pas de réseau ? Réessaie dans un instant.");
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100dvh-6rem)] flex-col">
      <header className="sticky top-0 z-10 border-b-2 border-encre bg-ciel">
        <div className="wrap flex items-center gap-3 py-3">
          <span aria-hidden className="grid h-10 w-10 place-items-center rounded-full border-2 border-encre bg-white text-xl">
            💬
          </span>
          <div className="flex-1">
            <h1 className="text-xl font-extrabold leading-none">Ton coach</h1>
            <p className="mt-1 text-xs font-semibold text-encre/70">IA · pas un professionnel de santé</p>
          </div>
          <span className="rounded-full border-2 border-encre bg-white px-2.5 py-1 text-xs font-bold tabular-nums">
            {remaining} msg restants
          </span>
        </div>
      </header>

      <div className="wrap flex-1 space-y-3 pb-6 pt-4" aria-live="polite">
        <Bubble role="assistant">{COACH_WELCOME}</Bubble>
        {messages.map((m) => (
          <Bubble key={m.id} role={m.role}>
            {m.content ? clean(m.content) : <TypingDots />}
          </Bubble>
        ))}

        {crisis && (
          <div role="alert" className="rounded-3xl border-2 border-encre bg-white p-4">
            <p className="font-extrabold">Si ça ne va pas du tout, tu n&apos;es pas seul·e.</p>
            <p className="mt-1 text-[0.95rem]">Des gens sont là pour t&apos;écouter, gratuitement, 24h/24 :</p>
            <div className="mt-3 grid gap-2">
              <a href="tel:3114" className="btn btn-primary min-h-12 py-2">
                📞 Appeler le 3114
              </a>
              <a href="tel:112" className="btn btn-light min-h-12 py-2">
                Danger immédiat : 112
              </a>
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-2xl border-2 border-braise bg-white p-3 text-[0.95rem]">
            {error}
          </p>
        )}
        {/* Ancre de défilement : la marge évite que le dernier message passe sous la zone de saisie */}
        <div ref={bottom} className="h-px scroll-mb-44" />
      </div>

      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 border-t-2 border-encre bg-creme">
        {!streaming && !input && remaining > 0 && (
          <div className="wrap flex gap-2 overflow-x-auto py-2 [scrollbar-width:none]">
            {COACH_SUGGESTIONS.map((s) => (
              <button key={s} type="button" className="chip min-h-10 shrink-0 px-3 py-1.5 text-sm" onClick={() => void send(s)}>
                {s}
              </button>
            ))}
          </div>
        )}
        <form
          className="wrap flex items-end gap-2 pb-6 pt-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          <label className="sr-only" htmlFor="coach-input">
            Ton message
          </label>
          <textarea
            id="coach-input"
            rows={1}
            maxLength={MAX}
            value={input}
            disabled={remaining <= 0}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !("ontouchstart" in window)) {
                e.preventDefault();
                void send(input);
              }
            }}
            placeholder={remaining > 0 ? "Écris au coach…" : "Le coach revient demain 👋"}
            className="field max-h-32 min-h-12 flex-1 resize-none py-2.5 text-base"
          />
          <button
            type="submit"
            className="btn btn-primary h-12 min-h-12 w-12 shrink-0 p-0 text-xl"
            disabled={streaming || !input.trim() || remaining <= 0}
            aria-label="Envoyer"
          >
            ↑
          </button>
        </form>
      </div>
    </div>
  );
}

function Bubble({ role, children }: { role: "user" | "assistant"; children: React.ReactNode }) {
  const mine = role === "user";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <p
        className={`max-w-[85%] whitespace-pre-wrap rounded-3xl border-2 border-encre px-4 py-3 text-[1rem] leading-snug ${
          mine ? "rounded-br-md bg-jaune" : "rounded-bl-md bg-white"
        }`}
      >
        {children}
      </p>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1 py-1" aria-label="Le coach écrit">
      {[0, 1, 2].map((i) => (
        <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-encre/50" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </span>
  );
}
