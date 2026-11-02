import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import { CookieBanner } from "@/components/CookieBanner";
import { VisitTracker } from "@/components/VisitTracker";
import { PRICE_SENTENCE } from "@/config/pricing";
import { SITE } from "@/config/site";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "TejTaPuff : arrête la puff en 21 jours",
    template: "%s · TejTaPuff",
  },
  description: `Calcule combien tu crames en puff, puis arrête en 21 jours avec un programme dans ta poche. ${PRICE_SENTENCE}`,
  applicationName: SITE.name,
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: SITE.name,
    title: "Combien tu crames en puff ?",
    description: "Fais le calcul. Puis arrête en 21 jours.",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#ffd43b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={bricolage.variable}>
      <body className="min-h-dvh">
        {children}
        <VisitTracker />
        <CookieBanner />
      </body>
    </html>
  );
}
