"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { usePostContext } from "@/modules/posts/tpl/default/PostProvider";

const tabClass = (active: boolean) =>
  "-ml-px inline-flex h-9 shrink-0 items-center whitespace-nowrap border px-4 text-[13px] transition-colors first:ml-0 focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-primary-500 " +
  (active
    ? "relative z-[1] border-gray-900 bg-gray-900 font-semibold text-white dark:border-dark-100 dark:bg-dark-100 dark:text-dark-950"
    : "border-gray-300 bg-white text-gray-600 hover:text-gray-950 dark:border-dark-700 dark:bg-dark-900 dark:text-dark-300 dark:hover:text-white");

// 분류가 없는 게시판에서는 "전체" 하나만 남으므로 아무것도 그리지 않는다.
const PostsCategories = () => {
  const pathname = usePathname() || "/";
  const currentCategory = useSearchParams()?.get("category");
  const { postInfo } = usePostContext();
  const categories = postInfo.categories ?? [];
  if (!categories.length) return null;

  const hasActiveCategory = categories.some((item) => String(item.id) === currentCategory);

  return (
    <nav aria-label="분류" className="flex overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Link href={pathname} aria-current={hasActiveCategory ? undefined : "page"} className={tabClass(!hasActiveCategory)}>
        전체
      </Link>
      {categories.map((item) => {
        const active = String(item.id) === currentCategory;
        return (
          <Link
            key={item.id}
            href={{ pathname, query: { category: item.id } }}
            aria-current={active ? "page" : undefined}
            className={tabClass(active)}
          >
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
};

export default PostsCategories;
