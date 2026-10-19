"use client";

import Link from "next/link";
import { FileText, Flag, MessageSquareText, Paperclip } from "lucide-react";

type ContentSection = "overview" | "reports";

const sectionMeta = {
  overview: {
    eyebrow: "Content",
    title: "콘텐츠 관리",
    description:
      "게시글, 댓글, 첨부파일, 신고를 한 곳에서 운영하기 위한 관리 영역입니다.",
  },
  reports: {
    eyebrow: "Reports",
    title: "신고 관리",
    description: "사용자 신고를 접수, 검토, 처리 상태별로 관리합니다.",
  },
};

const contentCards = [
  {
    href: "/admin/content/documents",
    icon: <FileText size={17} />,
    title: "전체 게시글",
    desc: "게시판 구분 없이 게시글을 운영 기준으로 조회합니다.",
  },
  {
    href: "/admin/content/comments",
    icon: <MessageSquareText size={17} />,
    title: "댓글 관리",
    desc: "댓글과 답글을 통합 조회하고 관리합니다.",
  },
  {
    href: "/admin/content/attachments",
    icon: <Paperclip size={17} />,
    title: "첨부파일 관리",
    desc: "업로드 파일과 이미지 사용 현황을 확인합니다.",
  },
  {
    href: "/admin/content/reports",
    icon: <Flag size={17} />,
    title: "신고 관리",
    desc: "신고 접수와 처리 상태를 관리합니다.",
  },
];

const ContentAdmin = ({
  section = "overview",
}: {
  section?: ContentSection;
}) => {
  const meta = sectionMeta[section];

  return (
    <div className="max-w-screen-2xl mx-auto px-3 py-8 md:px-5 md:py-10 dark:text-dark-100">
      <div className="mb-8">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
          {meta.eyebrow}
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-dark-100">
          {meta.title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
          {meta.description}
        </p>
      </div>

      {section === "overview" ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {contentCards.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-md border border-gray-200 bg-white p-5 transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-dark-800 dark:bg-dark-900 dark:hover:border-dark-700 dark:hover:bg-dark-800"
            >
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-md bg-gray-950 text-white dark:bg-primary-400 dark:text-dark-950">
                {item.icon}
              </div>
              <div className="text-sm font-semibold text-gray-900 dark:text-dark-100">
                {item.title}
              </div>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                {item.desc}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-gray-300 bg-white p-8 dark:border-dark-700 dark:bg-dark-900">
          <div className="text-sm font-semibold text-gray-900 dark:text-dark-100">
            관리 리스트 준비 중
          </div>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            이 화면은 콘텐츠 운영용 라우트와 사이드 메뉴를 먼저 잡아둔
            상태입니다. 다음 단계에서 검색, 필터, 목록, 일괄 처리 액션을 붙이면
            됩니다.
          </p>
        </div>
      )}
    </div>
  );
};
export default ContentAdmin;
