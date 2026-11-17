"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ImageIcon, LockKeyhole, PenLine } from "lucide-react";
import PostsHeader from "./header";
import { usePostContext } from "./PostProvider";
import { boardPrimaryButton, boardRowLine, boardTopLine } from "./boardStyles";
import { toKstDayjs } from "@/core/utils/date/kst";
import PageNavigation from "@components/nav/PageNavigation";
import PostNotPermission from "@/modules/posts/tpl/default/notPermission";

interface Pagination {
  page: number;
  totalPages: number;
  listCount: number;
  totalCount: number;
}

type BoardPost = {
  id: number;
  slug: string;
  title?: string | null;
  thumbnail?: string | null;
  createdAt: string;
  isNotice?: boolean | null;
  isSecrets?: boolean | null;
  commentCount?: number | null;
  readCount?: number | null;
  category?: { title: string } | null;
  user?: { nickName?: string | null } | null;
};

// 목록 라우트가 한 페이지에 요청하는 글 수. 글 번호를 거꾸로 매길 때 쓴다.
const PAGE_SIZE = 10;
const NEW_POST_HOURS = 24;

// 오늘 쓴 글은 시각, 그 전 글은 날짜로 보여준다.
const formatListDate = (value: string) => {
  const date = toKstDayjs(value);
  if (!date) return "";
  return date.format("YYYY-MM-DD") === toKstDayjs(new Date())?.format("YYYY-MM-DD") ? date.format("HH:mm") : date.format("YYYY.MM.DD");
};

const isNewPost = (value: string) => Date.now() - new Date(value).getTime() < NEW_POST_HOURS * 60 * 60 * 1000;

const headCell = "h-11 px-2 text-center text-[13px] font-medium text-gray-600 dark:text-dark-300";
const metaCell = "hidden px-2 text-center text-[13px] text-gray-500 dark:text-dark-400 md:table-cell";

const PostsListClient = ({ posts, pagination }: { posts: BoardPost[]; pagination: Pagination }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const { postInfo, permissions } = usePostContext();

  if (!permissions.doList) return <PostNotPermission />;

  const base = `/posts/${encodeURIComponent(postInfo.mid)}`;
  const firstNumber = pagination.totalCount - (pagination.page - 1) * PAGE_SIZE;

  const changePage = (page: number) => {
    const params = new URLSearchParams(searchParams?.toString());
    params.set("page", String(page));
    startTransition(() => router.push(`${base}?${params.toString()}`));
  };

  return (
    <div className="w-full pb-16">
      <PostsHeader />

      <div className="flex items-center justify-between pb-2 text-[13px] text-gray-500 dark:text-dark-400">
        <span>전체 <strong className="font-semibold text-gray-900 dark:text-dark-100">{pagination.totalCount.toLocaleString()}</strong>건</span>
        <span>{pagination.page} / {Math.max(pagination.totalPages, 1)} 페이지</span>
      </div>

      <table aria-busy={pending} className={`w-full table-fixed border-collapse ${boardTopLine} ${pending ? "pointer-events-none opacity-50" : ""}`}>
        <caption className="sr-only">{postInfo.moduleName} 글 목록</caption>
        <colgroup>
          <col className="hidden w-[72px] md:table-column" />
          <col />
          <col className="hidden w-[120px] md:table-column" />
          <col className="hidden w-[96px] md:table-column" />
          <col className="hidden w-[72px] md:table-column" />
        </colgroup>
        <thead className={`hidden bg-gray-50 dark:bg-dark-900 md:table-header-group ${boardRowLine}`}>
          <tr>
            <th scope="col" className={headCell}>번호</th>
            <th scope="col" className={headCell}>제목</th>
            <th scope="col" className={headCell}>글쓴이</th>
            <th scope="col" className={headCell}>날짜</th>
            <th scope="col" className={headCell}>조회</th>
          </tr>
        </thead>
        <tbody>
          {!posts.length && (
            <tr className={boardRowLine}>
              <td colSpan={5} className="py-20 text-center text-sm text-gray-500 dark:text-dark-400">등록된 글이 없습니다.</td>
            </tr>
          )}
          {posts.map((post, index) => {
            const author = post.user?.nickName || "작성자";
            const comments = post.commentCount || 0;
            return (
              <tr
                key={post.id}
                className={`${boardRowLine} transition-colors hover:bg-gray-50 dark:hover:bg-dark-900/70 ${post.isNotice ? "bg-gray-50/70 dark:bg-dark-900/50" : ""}`}
              >
                <td className={metaCell}>
                  {post.isNotice
                    ? <span className="inline-flex h-6 items-center rounded-sm bg-gray-900 px-2 text-[11px] font-semibold text-white dark:bg-dark-100 dark:text-dark-950">공지</span>
                    : <span className="tabular-nums">{Math.max(firstNumber - index, 1)}</span>}
                </td>
                <td className="px-2 py-3 md:py-0">
                  <Link href={`${base}/${encodeURIComponent(post.slug)}`} className="group flex min-w-0 items-center gap-1.5 md:h-12">
                    {post.isNotice && <span className="inline-flex h-5 shrink-0 items-center rounded-sm bg-gray-900 px-1.5 text-[11px] font-semibold text-white dark:bg-dark-100 dark:text-dark-950 md:hidden">공지</span>}
                    {post.category?.title && <span className="shrink-0 text-[13px] text-gray-500 dark:text-dark-400">[{post.category.title}]</span>}
                    {post.isSecrets && <LockKeyhole size={13} aria-label="비밀글" className="shrink-0 text-gray-400 dark:text-dark-500" />}
                    <span className={`truncate text-sm text-gray-900 group-hover:underline dark:text-dark-100 ${post.isNotice ? "font-semibold" : ""}`}>
                      {post.title || "제목 없음"}
                    </span>
                    {comments > 0 && <span className="shrink-0 text-[13px] font-semibold tabular-nums text-primary-600 dark:text-primary-400" aria-label={`댓글 ${comments}개`}>[{comments}]</span>}
                    {post.thumbnail && <ImageIcon size={13} aria-label="이미지 있음" className="shrink-0 text-gray-400 dark:text-dark-500" />}
                    {isNewPost(post.createdAt) && <span aria-label="새 글" className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm bg-primary-500 text-[10px] font-bold leading-none text-white">N</span>}
                  </Link>
                  <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-500 dark:text-dark-400 md:hidden">
                    <span>{author}</span>
                    <span aria-hidden="true" className="h-2.5 w-px bg-gray-300 dark:bg-dark-700" />
                    <span>{formatListDate(post.createdAt)}</span>
                    <span aria-hidden="true" className="h-2.5 w-px bg-gray-300 dark:bg-dark-700" />
                    <span>조회 {(post.readCount || 0).toLocaleString()}</span>
                  </div>
                </td>
                <td className={`${metaCell} truncate`}>{author}</td>
                <td className={`${metaCell} tabular-nums`}>{formatListDate(post.createdAt)}</td>
                <td className={`${metaCell} tabular-nums`}>{(post.readCount || 0).toLocaleString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {permissions.doWrite && (
        <div className="flex justify-end pt-4">
          <Link href={`${base}/create`} className={boardPrimaryButton}>
            <PenLine size={14} aria-hidden="true" />글쓰기
          </Link>
        </div>
      )}

      <div className="flex justify-center pt-8">
        <PageNavigation page={pagination.page} totalPages={pagination.totalPages} onPageChange={changePage} />
      </div>
    </div>
  );
};

export default PostsListClient;
