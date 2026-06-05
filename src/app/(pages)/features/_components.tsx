"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type React from "react";
import { ArrowRight, Check, Copy, FileText } from "lucide-react";

import Bottom from "@/core/components/panel/Bottom";

export const docsNav = [
  { href: "/features/getting-started", title: "시작하기", desc: "setup, DB 초기화, 개발 서버 실행" },
  { href: "/features/architecture", title: "프로젝트 구조", desc: "코어와 개인 확장 영역" },
  { href: "/features/extensions", title: "Extensions", desc: "index.tsx, admin registry, trigger 등록" },
  { href: "/features/layouts", title: "Layouts & Page", desc: "기본 레이아웃과 홈 페이지 교체" },
  { href: "/features/project-api", title: "Project API", desc: "proxy, Prisma, 배포판 확장 규칙" },
  { href: "/features/posts", title: "Posts", desc: "게시판 스킨과 issuetracker 구조" },
  { href: "/features/previews", title: "Previews", desc: "기본 제공 화면 확인" },
  { href: "/features/operations", title: "운영 규칙", desc: "upstream 패치와 커스텀 충돌 방지" },
];

export const FeatureDocPanel = ({ children }: { children: React.ReactNode }) => {
  return <Bottom closeHref="/features">{children}</Bottom>;
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
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-5">
      <div className="mb-10 grid gap-5 border-b border-gray-200 pb-8 lg:grid-cols-[210px_1fr] dark:border-dark-800">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-gray-950 text-white dark:bg-white dark:text-gray-950">
            <FileText size={15} />
          </span>
          <div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Feature Manual</div>
            <div className="mt-1 text-xs text-gray-400">/features</div>
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-normal text-gray-800 dark:text-dark-100 sm:text-3xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-500 dark:text-dark-300">{description}</p>
        </div>
      </div>

      <main className="divide-y divide-gray-200 dark:divide-dark-800">{children}</main>
    </div>
  );
};

export const DocSection = ({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) => {
  return (
    <section id={id} className="scroll-mt-8 grid gap-5 py-9 lg:grid-cols-[210px_1fr]">
      <div>
        <h2 className="text-[13px] font-semibold tracking-normal text-gray-800 dark:text-dark-100">{title}</h2>
      </div>
      <div>
        <div className="grid max-w-3xl gap-5 text-base leading-7 tracking-tight text-gray-500 dark:text-dark-300">{children}</div>
      </div>
    </section>
  );
};

export const CodeBlock = ({ children }: { children: React.ReactNode }) => {
  const [copied, setCopied] = useState(false);
  const codeText = useMemo(() => {
    if (typeof children === "string") return children;
    if (typeof children === "number") return String(children);
    return "";
  }, [children]);

  const handleCopy = async () => {
    if (!codeText) return;

    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="group relative max-w-3xl">
      <button
        type="button"
        onClick={handleCopy}
        disabled={!codeText}
        className="absolute right-3 top-3 z-10 inline-flex h-8 items-center gap-1.5 rounded border border-white/10 bg-white/10 px-2.5 text-[11px] font-medium text-gray-200 opacity-100 backdrop-blur transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40 sm:opacity-0 sm:group-hover:opacity-100"
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
        {copied ? "Copied" : "Copy"}
      </button>
      <pre className="overflow-x-auto rounded-md border border-gray-900 bg-gray-950 p-5 pr-24 text-xs leading-6 text-gray-100 shadow-sm dark:border-dark-800">
        <code>{children}</code>
      </pre>
    </div>
  );
};

export const PathTable = ({
  items,
}: {
  items: Array<{ path: string; desc: string }>;
}) => {
  return (
    <div className="grid gap-0 divide-y divide-gray-100 border-y border-gray-200 dark:divide-dark-800 dark:border-dark-800">
      {items.map((item) => (
        <div
          key={item.path}
          className="grid min-w-0 gap-3 py-4 transition-colors hover:bg-gray-50 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)] md:px-3 dark:hover:bg-dark-900"
        >
          <code className="min-w-0 break-all text-[13px] font-semibold leading-6 text-gray-900 dark:text-white">
            {item.path}
          </code>
          <div className="min-w-0">{item.desc}</div>
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
    <div className="grid gap-0 divide-y divide-gray-100 border-y border-gray-200 dark:divide-dark-800 dark:border-dark-800">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="group grid gap-3 py-4 transition-colors hover:bg-gray-50 md:grid-cols-[220px_1fr_24px] md:items-center md:px-3 dark:hover:bg-dark-900"
        >
          <div>
            <div className="text-[13px] font-semibold text-gray-800 dark:text-dark-100">{item.label}</div>
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
