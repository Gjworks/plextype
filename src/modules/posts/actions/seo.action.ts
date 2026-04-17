import { getPostsInfo } from "./posts.action";
import { getDocumentBySlugAction } from "@modules/document/actions/document.action";
import { getSeoMetadata } from "@/core/utils/helper/matadata"; // 🌟 공통 헬퍼 임포트
import { Metadata } from "next";

/**
 * 📋 1. 게시판 목록용 SEO 헬퍼
 */
export async function getPostListMetadata(mid: string): Promise<Metadata> {
  const res = await getPostsInfo(mid);
  const info = res.data;

  // 🌟 공통 헬퍼에 데이터만 던져줍니다.
  return getSeoMetadata({
    title: info?.moduleName ?? "게시판",
    description: info?.desc ?? `${info?.moduleName ?? "게시판"}의 게시글 목록입니다.`,
    url: `/posts/${mid}`, // 상대 경로만 전달
  });
}

/**
 * 📖 2. 게시글 상세용 SEO 헬퍼
 */
export async function getPostReadMetadata(slug: string, mid: string): Promise<Metadata> {
  const res = await getDocumentBySlugAction(slug);
  const doc = res.data;

  if (!doc) {
    return getSeoMetadata({ title: "존재하지 않는 게시글입니다." });
  }

  const postTitle = doc.title ?? "제목 없음";
  const description = doc.content?.slice(0, 150).replace(/<[^>]+>/g, "") || "";
  const author = doc.user?.nickName || "작성자";

  // 🌟 상세 페이지도 공통 헬퍼로 포장!
  return getSeoMetadata({
    title: postTitle,
    description: `${author}님의 글: ${description}`,
    image: doc.thumbnail || undefined, // 썸네일 있으면 전달
    url: `/posts/${mid}/${slug}`,
  });
}