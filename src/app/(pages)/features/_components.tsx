import Link from "next/link";
import type React from "react";
import { ArrowRight } from "lucide-react";

import Bottom from "@/core/components/panel/Bottom";

export const docsNav = [
  { href: "/features/getting-started", title: "시작하기", desc: "setup, DB 초기화, 개발 서버 실행" },
  { href: "/features/architecture", title: "프로젝트 구조", desc: "코어와 개인 확장 영역" },
  { href: "/features/extensions", title: "Extensions", desc: "index.tsx, trigger, capability 등록" },
  { href: "/features/layouts", title: "Layouts & Page", desc: "기본 레이아웃과 홈 페이지 교체" },
  { href: "/features/project-api", title: "Project API", desc: "proxy, Prisma, 배포판 확장 규칙" },
  { href: "/features/posts", title: "Posts", desc: "게시판 스킨과 issuetracker 구조" },
  { href: "/features/previews", title: "Previews", desc: "기본 제공 화면 확인" },
  { href: "/features/operations", title: "운영 규칙", desc: "업데이트와 커스텀 충돌 방지" },
];

export const FeatureDocPanel = ({ children }: { children: React.ReactNode }) => {
  return <Bottom>{children}</Bottom>;
};

export const DocsShell = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="mx-auto max-w-screen-2xl px-3 py-8">
      <div className="mb-6">
        <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Documentation</div>
        <h1 className="mt-2 text-2xl font-semibold tracking-normal text-gray-700 dark:text-dark-100">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">{description}</p>
      </div>

      <div className="mb-8 overflow-x-auto border-b border-gray-200 dark:border-dark-800">
        <nav className="flex min-w-max gap-6">
          {docsNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="border-b-2 border-transparent px-1 pb-3 text-sm font-medium text-gray-400 transition-colors hover:border-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              {item.title}
            </Link>
          ))}
        </nav>
      </div>

      <main className="grid gap-2">{children}</main>
    </div>
  );
};

export const DocSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  return (
    <section className="grid grid-cols-4 gap-8 border-t border-gray-200 py-10 first:border-t-0 dark:border-dark-800">
      <div className="col-span-4 lg:col-span-1">
        <h2 className="text-sm font-semibold tracking-normal text-gray-700 dark:text-dark-100">{title}</h2>
      </div>
      <div className="col-span-4 lg:col-span-3">
        <div className="grid gap-4 text-sm leading-7 text-gray-500 dark:text-dark-300">{children}</div>
      </div>
    </section>
  );
};

export const CodeBlock = ({ children }: { children: React.ReactNode }) => {
  return (
    <pre className="overflow-x-auto rounded-md border border-gray-200 bg-gray-950 p-4 text-xs leading-6 text-gray-100 dark:border-dark-800">
      <code>{children}</code>
    </pre>
  );
};

export const PathTable = ({
  items,
}: {
  items: Array<{ path: string; desc: string }>;
}) => {
  return (
    <div className="grid gap-0 divide-y divide-gray-100 rounded-md border border-gray-200 dark:divide-dark-800 dark:border-dark-800">
      {items.map((item) => (
        <div
          key={item.path}
          className="grid gap-3 p-5 transition-colors hover:bg-gray-50 md:grid-cols-[240px_1fr] dark:hover:bg-dark-900"
        >
          <code className="text-sm font-semibold text-gray-950 dark:text-white">{item.path}</code>
          <div>{item.desc}</div>
        </div>
      ))}
    </div>
  );
};

export const DocLinkList = ({
  items,
}: {
  items: Array<{ href: string; label: string; desc: string; meta?: string }>;
}) => {
  return (
    <div className="grid gap-0 divide-y divide-gray-100 rounded-md border border-gray-200 dark:divide-dark-800 dark:border-dark-800">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="group grid gap-3 p-5 transition-colors hover:bg-gray-50 md:grid-cols-[220px_1fr_24px] md:items-center dark:hover:bg-dark-900"
        >
          <div>
            <div className="text-sm font-semibold text-gray-700 dark:text-dark-100">{item.label}</div>
            {item.meta && <div className="mt-1 text-xs text-gray-400">{item.meta}</div>}
          </div>
          <div className="text-sm leading-6 text-gray-500 dark:text-dark-300">{item.desc}</div>
          <ArrowRight
            size={16}
            className="hidden text-gray-300 transition-transform group-hover:translate-x-1 md:block"
          />
        </Link>
      ))}
    </div>
  );
};
