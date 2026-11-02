import type { MetadataRoute } from "next";
import { SITE } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/app", "/admin", "/api", "/merci", "/plan", "/quiz", "/connexion"] },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
