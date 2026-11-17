import type React from "react";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import BoardAdjacentPosts from "./boardAdjacentPosts";
import BoardReadActions from "./boardReadActions";
import { boardLabelCell, boardRowLine, boardTopLine } from "./boardStyles";
import { toKstDayjs } from "@/core/utils/date/kst";

// 기본 스킨의 본문 화면. 권한 확인과 본문 변환은 read.tsx가 끝낸 뒤 결과만 넘겨준다.
interface BoardReadProps {
  document: any;
  postInfo: any;
  content: React.ReactNode;
  currentUser?: any;
}

const BoardRead = ({ document, postInfo, content, currentUser }: BoardReadProps) => {
  const extraFields: any[] = postInfo?.extraFields || [];
  const extraData = document.extraFieldData || {};
  const visibleExtraFields = extraFields.filter((field) => {
    const value = extraData[field.name];
    return value !== undefined && value !== null && value !== "";
  });
  const meta: [string, string][] = [
    ["글쓴이", document.user?.nickName || "작성자"],
    ["날짜", toKstDayjs(document.createdAt)?.format("YYYY.MM.DD HH:mm") || ""],
    ["조회", (document.readCount || 0).toLocaleString()],
    ["댓글", (document.commentCount || 0).toLocaleString()],
  ];

  return (
    <article className="mx-auto w-full max-w-screen-lg px-3 pt-8 sm:pt-10">
      <p className="pb-4 text-xl font-bold tracking-[-0.01em] text-gray-950 dark:text-dark-50 sm:text-2xl">
        <Link href={`/posts/${encodeURIComponent(postInfo.mid)}`} className="hover:underline">{postInfo.moduleName}</Link>
      </p>

      <header className={boardTopLine}>
        <h1 className={`flex items-start gap-1.5 bg-gray-50 px-4 py-3.5 text-base font-semibold leading-7 text-gray-950 dark:bg-dark-900 dark:text-dark-50 sm:text-lg ${boardRowLine}`}>
          {document.category?.title && <span className="shrink-0 font-normal text-gray-500 dark:text-dark-400">[{document.category.title}]</span>}
          {document.isSecrets && <LockKeyhole size={15} aria-label="비밀글" className="mt-1.5 shrink-0 text-gray-400 dark:text-dark-500" />}
          <span className="min-w-0 break-words">{document.title || "제목 없음"}</span>
        </h1>
        <dl className={`flex flex-wrap items-center gap-x-5 gap-y-1 px-4 py-2.5 text-[13px] ${boardRowLine}`}>
          {meta.map(([label, value]) => (
            <div key={label} className="flex items-center gap-1.5">
              <dt className="text-gray-500 dark:text-dark-400">{label}</dt>
              <dd className="font-medium tabular-nums text-gray-900 dark:text-dark-100">{value}</dd>
            </div>
          ))}
        </dl>
        {visibleExtraFields.length > 0 && (
          <dl>
            {visibleExtraFields.map((field) => (
              <div key={field.name} className={`flex ${boardRowLine}`}>
                <dt className={`flex w-28 shrink-0 items-center px-4 py-2.5 ${boardLabelCell}`}>{field.label}</dt>
                <dd className="min-w-0 flex-1 break-words px-4 py-2.5 text-sm text-gray-900 dark:text-dark-100">
                  {field.type === "date" ? toKstDayjs(extraData[field.name])?.format("YYYY-MM-DD") : String(extraData[field.name])}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </header>

      <div className={`postContent min-h-[240px] px-4 py-8 text-[15px] leading-8 text-gray-800 dark:text-dark-200 ${boardRowLine}`}>
        {content}
      </div>

      <BoardReadActions mid={postInfo.mid} slug={document.slug} canEdit={currentUser?.id === document.userId} />
      <BoardAdjacentPosts mid={postInfo.mid} slug={document.slug} />
    </article>
  );
};

export default BoardRead;
