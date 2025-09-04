import type { Metadata } from "next";

export function createMetadata({
  title,
  description,
  url,
}: {
  title?: string;
  description?: string;
  url?: string;
}): Metadata {
  return {
    title: title || "지제이웍스",
    description: description || "지제이웍스 홈페이지에 오신 것을 환영합니다!",
    openGraph: {
      title,
      description,
      url,
      siteName: "지제이웍스",
      type: "website",
    },
  };
}
