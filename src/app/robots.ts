import type { MetadataRoute } from "next";
import { urlSitio } from "@/lib/sitio";

const sitio = urlSitio();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api"] },
    sitemap: `${sitio}/sitemap.xml`,
  };
}
