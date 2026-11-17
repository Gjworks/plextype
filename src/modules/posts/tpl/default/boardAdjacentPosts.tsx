import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";
import { getAdjacentPostsAction } from "../../actions/adjacent.action";
import { boardLabelCell, boardRowLine } from "./boardStyles";

// 기본 스킨 본문 아래의 이전 글·다음 글 줄.
export default async function BoardAdjacentPosts({ mid, slug }: { mid: string; slug: string }) {
  const posts = await getAdjacentPostsAction(mid, slug);
  if (!posts.previous && !posts.next) return null;

  return (
    <nav aria-label="이전 글과 다음 글" className="border-t border-gray-200 dark:border-dark-800">
      {(["previous", "next"] as const).map((direction) => {
        const post = posts[direction];
        const previous = direction === "previous";
        const Icon = previous ? ChevronUp : ChevronDown;
        return (
          <div key={direction} className={`flex min-w-0 items-stretch ${boardRowLine}`}>
            <span className={`flex w-24 shrink-0 items-center justify-center gap-1 py-3 ${boardLabelCell}`}>
              <Icon size={14} aria-hidden="true" />{previous ? "이전 글" : "다음 글"}
            </span>
            {post ? (
              <Link
                href={`/posts/${encodeURIComponent(mid)}/${encodeURIComponent(post.slug)}`}
                className="min-w-0 flex-1 truncate px-4 py-3 text-sm text-gray-800 hover:underline dark:text-dark-100"
              >
                {post.title || "제목 없음"}
              </Link>
            ) : (
              <span className="flex-1 px-4 py-3 text-sm text-gray-400 dark:text-dark-500">{previous ? "이전 글이 없습니다." : "다음 글이 없습니다."}</span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
