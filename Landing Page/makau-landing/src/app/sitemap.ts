import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://example.com", lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    { url: "https://example.com/contact", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "https://example.com/terms", lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];
}
