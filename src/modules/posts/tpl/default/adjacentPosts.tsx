import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getAdjacentPostsAction } from "../../actions/adjacent.action";

export default async function AdjacentPosts({ mid, slug }: { mid: string; slug: string }) {
  const posts = await getAdjacentPostsAction(mid, slug);
  if (!posts.previous && !posts.next) return null;
  return <nav aria-label="이전 글과 다음 글" className="mx-auto grid max-w-screen-md grid-cols-1 gap-3 px-3 pt-4 sm:grid-cols-2">
    {(["previous", "next"] as const).map(direction => {
      const post = posts[direction];
      const previous = direction === "previous";
      const label = previous ? "이전 글" : "다음 글";
      const Icon = previous ? ArrowLeft : ArrowRight;
      const content = <>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:bg-dark-800 dark:text-dark-200"><Icon size={20} strokeWidth={1.5} aria-hidden="true" /></span>
        <span className={`min-w-0 flex-1 ${previous ? "text-left" : "text-right"}`}><span className="block text-xs font-medium text-gray-500 dark:text-dark-400">{label}</span><span className="mt-1 block truncate text-sm font-semibold text-gray-800 dark:text-dark-100">{post ? post.title || "제목 없음" : `${label}이 없습니다`}</span></span>
      </>;
      const className = `flex min-w-0 items-center gap-3 rounded-lg border border-gray-200 p-4 dark:border-dark-800 ${previous ? "" : "flex-row-reverse"}`;
      return post ? <Link key={direction} href={`/posts/${encodeURIComponent(mid)}/${encodeURIComponent(post.slug)}`} title={post.title || "제목 없음"} className={`${className} transition-colors hover:border-gray-300 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-primary-500 dark:hover:border-dark-600 dark:hover:bg-dark-900`}>{content}</Link> : <div key={direction} aria-disabled="true" className={`${className} opacity-50`}>{content}</div>;
    })}
  </nav>;
}
