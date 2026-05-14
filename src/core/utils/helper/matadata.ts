
import type { Metadata } from "next";
import { getPublicSiteSettingsAction } from "@/modules/admin/actions/settings.action";

interface SeoOptions {
  title: string;
  description?: string;
  image?: string;
  url?: string;
}

export async function getSeoMetadata({
                                 title,
                                 description = "Plextype으로 만든 멋진 사이트입니다.", // 기본 설명
                                 image = "/default-og.png", // 기본 OG 이미지
                                 url, // 이제 호출 시 없으면 환경변수에서 가져옵니다.
                               }: SeoOptions): Promise<Metadata> {

  const settings = await getPublicSiteSettingsAction();
  const siteTitle = settings.data?.projectTitle || "Plextype";
  const siteUrl = settings.data?.siteUrl || "http://localhost:3000";

  // 최종 타이틀 구성 (예: "공지사항 | Plextype")
  const fullTitle = `${title} - ${siteTitle}`;
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;

  return {
    title: fullTitle,
    description,
    openGraph: {
      title: fullTitle,
      description,
      url: fullUrl,
      siteName: siteTitle, // 사이트 이름 추가
      images: [{ url: image }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image],
    },
    // 파비콘 설정 같은 것도 여기에 통합해두면 편해요!
    icons: {
      icon: "/favicon.ico",
    },
  };
}
