import type { MetadataRoute } from "next";
import { SITE } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/legal/mentions-legales", "/legal/cgv", "/legal/confidentialite", "/legal/cookies"].map((p) => ({
    url: `${SITE.url}${p}`,
  }));
}
