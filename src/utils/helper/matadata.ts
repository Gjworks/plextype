// lib/seo.ts
import type { Metadata } from "next";

interface SeoOptions {
  title: string;
  description?: string;
  image?: string;
  url?: string;
}

export function getSeoMetadata({
                                 title,
                                 description = "기본 설명입니다.",
                                 image = "/default.png",
                                 url = "https://example.com",
                               }: SeoOptions): Metadata {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}