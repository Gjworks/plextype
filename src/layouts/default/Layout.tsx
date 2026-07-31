import Link from "next/link";
import { ArrowRight, Bell, CircleUserRound, LayoutGrid, Menu, Search } from "lucide-react";
import React from "react";
import { getPublicSiteNavigationAction } from "@/modules/admin/actions/sitemap.action";
import type { SiteNavigationItem } from "@/modules/admin/actions/_type";

const fallbackNavItems: SiteNavigationItem[] = [
  {
    id: 0,
    groupId: null,
    groupKey: "header-main",
    groupTitle: "기본 상단 메뉴",
    groupArea: "header",
    parentId: null,
    name: "home",
    title: "Home",
    href: "/",
    target: null,
    icon: null,
    order: 0,
    depth: 0,
    location: "header",
    visibility: "public",
    isActive: true,
    children: [],
  },
  {
    id: 1,
    groupId: null,
    groupKey: "header-main",
    groupTitle: "기본 상단 메뉴",
    groupArea: "header",
    parentId: null,
    name: "notice",
    title: "Notice",
    href: "/posts/notice",
    target: null,
    icon: null,
    order: 10,
    depth: 0,
    location: "header",
    visibility: "public",
    isActive: true,
    children: [],
  },
  {
    id: 2,
    groupId: null,
    groupKey: "header-main",
    groupTitle: "기본 상단 메뉴",
    groupArea: "header",
    parentId: null,
    name: "features",
    title: "Features",
    href: "/features",
    target: null,
    icon: null,
    order: 20,
    depth: 0,
    location: "header",
    visibility: "public",
    isActive: true,
    children: [],
  },
  {
    id: 3,
    groupId: null,
    groupKey: "header-main",
    groupTitle: "기본 상단 메뉴",
    groupArea: "header",
    parentId: null,
    name: "contact",
    title: "Contact",
    href: "/contact",
    target: null,
    icon: null,
    order: 30,
    depth: 0,
    location: "header",
    visibility: "public",
    isActive: true,
    children: [],
  },
];

const fallbackFooterItems: SiteNavigationItem[] = [
  { ...fallbackNavItems[2], groupKey: "footer", groupTitle: "기본 푸터 메뉴", groupArea: "footer", location: "footer", title: "Features", href: "/features", name: "features-footer" },
  { ...fallbackNavItems[2], id: 4, groupKey: "footer", groupTitle: "기본 푸터 메뉴", groupArea: "footer", location: "footer", title: "Docs", href: "/features/getting-started", name: "docs-footer" },
  { ...fallbackNavItems[1], id: 5, groupKey: "footer", groupTitle: "기본 푸터 메뉴", groupArea: "footer", location: "footer", title: "Notice", href: "/posts/notice", name: "notice-footer" },
  { ...fallbackNavItems[3], id: 6, groupKey: "footer", groupTitle: "기본 푸터 메뉴", groupArea: "footer", location: "footer", title: "Contact", href: "/contact", name: "contact-footer" },
  { ...fallbackNavItems[0], id: 7, groupKey: "footer", groupTitle: "기본 푸터 메뉴", groupArea: "footer", location: "footer", title: "License", href: "/license", name: "license-footer" },
  { ...fallbackNavItems[0], id: 8, groupKey: "footer", groupTitle: "기본 푸터 메뉴", groupArea: "footer", location: "footer", title: "Terms", href: "/terms", name: "terms-footer" },
  { ...fallbackNavItems[0], id: 9, groupKey: "footer", groupTitle: "기본 푸터 메뉴", groupArea: "footer", location: "footer", title: "Privacy", href: "/privacy", name: "privacy-footer" },
];

const DefaultLayout = async ({
  children,
  siteUrl = "/",
  siteTitle = "Plextype",
}: {
  children: React.ReactNode;
  siteUrl?: string;
  siteTitle?: string;
}) => {
  const [headerNavigationResult, footerNavigationResult] = await Promise.all([
    getPublicSiteNavigationAction("header-main"),
    getPublicSiteNavigationAction("footer"),
  ]);
  const navItems = headerNavigationResult.data?.length ? headerNavigationResult.data : fallbackNavItems;
  const footerItems = footerNavigationResult.data?.length ? footerNavigationResult.data : fallbackFooterItems;

  return (
    <div className="min-h-screen bg-[#f5f6f3] text-gray-950 dark:bg-[#050505] dark:text-white">
      <header className="sticky top-0 z-50 border-b border-black/10 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-black/85">
        <div className="mx-auto flex h-[70px] max-w-screen-xl items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <Link href={siteUrl || "/"} className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-black text-white dark:bg-white dark:text-black">
                <LayoutGrid size={16} strokeWidth={2} />
              </span>
              <span>
                <span className="block text-[10px] font-medium uppercase tracking-[0.28em] text-gray-400 dark:text-dark-400">
                  Plextype
                </span>
                <span className="block text-sm font-semibold tracking-[-0.02em]">{siteTitle}</span>
              </span>
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => (
                <div key={item.id || item.href} className="group relative">
                  <Link
                    href={item.href}
                    target={item.target || undefined}
                    rel={item.target === "_blank" ? "noreferrer" : undefined}
                    className="block rounded-full px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-950 dark:text-dark-300 dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    {item.title}
                  </Link>
                  {item.children.length > 0 && (
                    <div className="invisible absolute left-0 top-full min-w-44 translate-y-2 rounded-xl border border-gray-100 bg-white/95 p-2 opacity-0 shadow-xl shadow-gray-200/60 backdrop-blur-xl transition-all group-hover:visible group-hover:translate-y-1 group-hover:opacity-100 dark:border-white/10 dark:bg-black/95">
                      {item.children.map((child) => (
                        <Link
                          key={child.id || child.href}
                          href={child.href}
                          target={child.target || undefined}
                          rel={child.target === "_blank" ? "noreferrer" : undefined}
                          className="block rounded-lg px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-950 dark:text-dark-300 dark:hover:bg-white/10 dark:hover:text-white"
                        >
                          {child.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="hidden h-10 w-10 place-items-center rounded-xl border border-black/10 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-950 md:grid dark:border-white/10 dark:text-dark-300 dark:hover:bg-white/10 dark:hover:text-white"
              aria-label="검색"
            >
              <Search size={17} />
            </button>
            <button
              type="button"
              className="hidden h-10 w-10 place-items-center rounded-xl border border-black/10 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-950 md:grid dark:border-white/10 dark:text-dark-300 dark:hover:bg-white/10 dark:hover:text-white"
              aria-label="알림"
            >
              <Bell size={17} />
            </button>
            <Link
              href="/auth/signin"
              className="hidden items-center gap-2 rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-950 md:flex dark:border-white/10 dark:text-dark-300 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <CircleUserRound size={16} />
              Sign in
            </Link>
            <Link
              href="/auth/register"
              className="hidden items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 md:flex dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              Get started
              <ArrowRight size={15} />
            </Link>
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-950 md:hidden dark:text-dark-300 dark:hover:bg-white/10 dark:hover:text-white"
              aria-label="메뉴"
            >
              <Menu size={19} />
            </button>
          </div>
        </div>
      </header>

      <main className="relative min-h-[calc(100vh-17rem)]">{children}</main>

      <footer className="border-t border-black/10 bg-white dark:border-white/10 dark:bg-black">
        <div className="mx-auto grid max-w-screen-xl gap-8 px-3 py-10 md:grid-cols-[1.2fr_2fr]">
          <div>
            <Link href={siteUrl || "/"} className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-black text-white dark:bg-white dark:text-black">
                <LayoutGrid size={14} />
              </span>
              <span className="text-sm font-semibold">{siteTitle}</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-gray-500 dark:text-dark-300">
              콘텐츠, 회원, 확장 기능을 프로젝트에 맞게 조립할 수 있는 기본 레이아웃입니다.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <div className="text-xs font-semibold text-gray-950 dark:text-white">Product</div>
              <div className="mt-3 grid gap-2 text-sm text-gray-500 dark:text-dark-300">
                {footerItems.slice(0, 3).map((item) => (
                  <Link key={item.id || item.href} href={item.href} target={item.target || undefined} rel={item.target === "_blank" ? "noreferrer" : undefined} className="hover:text-gray-950 dark:hover:text-white">
                    {item.title}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-950 dark:text-white">Community</div>
              <div className="mt-3 grid gap-2 text-sm text-gray-500 dark:text-dark-300">
                {footerItems.slice(3, 6).map((item) => (
                  <Link key={item.id || item.href} href={item.href} target={item.target || undefined} rel={item.target === "_blank" ? "noreferrer" : undefined} className="hover:text-gray-950 dark:hover:text-white">
                    {item.title}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-950 dark:text-white">Legal</div>
              <div className="mt-3 grid gap-2 text-sm text-gray-500 dark:text-dark-300">
                {footerItems.slice(6).map((item) => (
                  <Link key={item.id || item.href} href={item.href} target={item.target || undefined} rel={item.target === "_blank" ? "noreferrer" : undefined} className="hover:text-gray-950 dark:hover:text-white">
                    {item.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-black/10 dark:border-white/10">
          <div className="mx-auto flex max-w-screen-xl flex-col gap-2 px-3 py-5 text-xs text-gray-400 md:flex-row md:items-center md:justify-between">
            <span>© {new Date().getFullYear()} {siteTitle}. All rights reserved.</span>
            <span>Built with Plextype</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DefaultLayout;
