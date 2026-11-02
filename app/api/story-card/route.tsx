import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { SITE } from "@/config/site";
import { cardStats } from "@/lib/card";
import { formatEuros } from "@/lib/savings";
import { verify } from "@/lib/signing";

/**
 * Carte à partager en story (1080×1920), générée à partir des vraies données.
 * Lien signé : /api/story-card?u=<id>&s=<signature> (voir lib/card.ts).
 */
const fonts = Promise.all([
  readFile(path.join(process.cwd(), "assets/fonts/BricolageGrotesque-800.ttf")),
  readFile(path.join(process.cwd(), "assets/fonts/BricolageGrotesque-600.ttf")),
]);

const INK = "#1b1a17";
const YELLOW = "#ffd43b";
const CREAM = "#fffbef";
const EMBER = "#ff5b3a";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("u") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(userId) || !verify("card", userId, url.searchParams.get("s"))) {
    return new Response("Lien invalide", { status: 403 });
  }
  const stats = await cardStats(userId);
  if (!stats) return new Response("Introuvable", { status: 404 });
  const [extraBold, semiBold] = await fonts;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: YELLOW,
          color: INK,
          padding: "120px 96px 110px",
          fontFamily: "Bricolage",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "baseline", fontSize: 84, fontWeight: 800, letterSpacing: -2 }}>
          <span>tej ta</span>
          <span style={{ display: "flex", position: "relative", marginLeft: 22 }}>
            puff
            <span
              style={{
                position: "absolute",
                left: -10,
                right: -10,
                top: 52,
                height: 14,
                borderRadius: 14,
                background: EMBER,
                transform: "rotate(-6deg)",
              }}
            />
          </span>
        </div>

        {/* Le chiffre */}
        {stats.started ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 110, fontWeight: 600 }}>Jour</span>
            <span style={{ fontSize: 470, fontWeight: 800, lineHeight: 0.9, letterSpacing: -24 }}>{stats.day}</span>
            <span style={{ fontSize: 130, fontWeight: 800, letterSpacing: -4 }}>sans puff</span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 190, fontWeight: 800, lineHeight: 0.95, letterSpacing: -8 }}>J&apos;arrête</span>
            <span style={{ fontSize: 190, fontWeight: 800, lineHeight: 0.95, letterSpacing: -8 }}>la puff.</span>
            <span style={{ fontSize: 70, fontWeight: 600, marginTop: 40 }}>Programme 21 jours</span>
          </div>
        )}

        {/* Économies */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {stats.started && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                background: CREAM,
                border: `8px solid ${INK}`,
                borderRadius: 56,
                padding: "48px 56px",
                boxShadow: `14px 18px 0 0 ${INK}`,
              }}
            >
              <span style={{ fontSize: 150, fontWeight: 800, color: EMBER, letterSpacing: -4 }}>{formatEuros(stats.saved)}</span>
              <span style={{ fontSize: 64, fontWeight: 600 }}>économisés</span>
              {stats.cravings > 0 && (
                <span style={{ fontSize: 52, fontWeight: 600, marginTop: 18 }}>
                  {stats.cravings} envie{stats.cravings > 1 ? "s" : ""} battue{stats.cravings > 1 ? "s" : ""}
                </span>
              )}
            </div>
          )}
          <span style={{ fontSize: 60, fontWeight: 800, marginTop: 80 }}>{SITE.domain}</span>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
      fonts: [
        { name: "Bricolage", data: extraBold, weight: 800, style: "normal" },
        { name: "Bricolage", data: semiBold, weight: 600, style: "normal" },
      ],
      headers: { "cache-control": "private, max-age=300" },
    },
  );
}
