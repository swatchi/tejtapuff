"use client";

export type Platform = {
  ios: boolean;
  android: boolean;
  inApp: "tiktok" | "instagram" | "facebook" | null;
  standalone: boolean;
};

export function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const android = /Android/i.test(ua);
  const inApp = /musical_ly|BytedanceWebview|TikTok|trill/i.test(ua)
    ? "tiktok"
    : /Instagram/i.test(ua)
      ? "instagram"
      : /FBAN|FBAV|FB_IAB/i.test(ua)
        ? "facebook"
        : null;
  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return { ios, android, inApp, standalone };
}
