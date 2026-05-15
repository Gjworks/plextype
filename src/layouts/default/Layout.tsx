import Link from "next/link";
import { ArrowRight, CircleUserRound, Menu, Search } from "lucide-react";
import React from "react";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/posts/notice", label: "Notice" },
  { href: "/docs", label: "Docs" },
  { href: "/contact", label: "Contact" },
];

const DefaultLayout = ({
  children,
  siteUrl = "/",
  siteTitle = "Plextype",
}: {
  children: React.ReactNode;
  siteUrl?: string;
  siteTitle?: string;
}) => {
  return (
    <div className="min-h-screen bg-white text-gray-950 dark:bg-dark-950 dark:text-white">
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/85 backdrop-blur-xl dark:border-dark-800 dark:bg-dark-950/85">
        <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between px-3">
          <div className="flex items-center gap-8">
            <Link href={siteUrl || "/"} className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-gray-950 text-xs font-bold text-white dark:bg-white dark:text-gray-950">
                {siteTitle.trim().charAt(0).toUpperCase() || "P"}
              </span>
              <span className="text-sm font-semibold tracking-normal">{siteTitle}</span>
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-950 dark:text-dark-300 dark:hover:bg-dark-900 dark:hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="hidden h-9 w-9 place-items-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-950 md:grid dark:hover:bg-dark-900 dark:hover:text-white"
              aria-label="검색"
            >
              <Search size={17} />
            </button>
            <Link
              href="/auth/signin"
              className="hidden items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-950 md:flex dark:border-dark-700 dark:text-dark-300 dark:hover:text-white"
            >
              <CircleUserRound size={16} />
              Sign in
            </Link>
            <Link
              href="/auth/register"
              className="hidden items-center gap-2 rounded-md bg-gray-950 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 md:flex dark:bg-white dark:text-gray-950"
            >
              Get started
              <ArrowRight size={15} />
            </Link>
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-950 md:hidden dark:text-dark-300 dark:hover:bg-dark-900 dark:hover:text-white"
              aria-label="메뉴"
            >
              <Menu size={19} />
            </button>
          </div>
        </div>
      </header>

      <main className="relative min-h-[calc(100vh-17rem)]">{children}</main>

      <footer className="border-t border-gray-100 bg-gray-50/80 dark:border-dark-800 dark:bg-dark-950">
        <div className="mx-auto grid max-w-screen-xl gap-8 px-3 py-10 md:grid-cols-[1.2fr_2fr]">
          <div>
            <Link href={siteUrl || "/"} className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-gray-950 text-xs font-bold text-white dark:bg-white dark:text-gray-950">
                {siteTitle.trim().charAt(0).toUpperCase() || "P"}
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
                <Link href="/features" className="hover:text-gray-950 dark:hover:text-white">Features</Link>
                <Link href="/docs" className="hover:text-gray-950 dark:hover:text-white">Docs</Link>
                <Link href="/license" className="hover:text-gray-950 dark:hover:text-white">License</Link>
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-950 dark:text-white">Community</div>
              <div className="mt-3 grid gap-2 text-sm text-gray-500 dark:text-dark-300">
                <Link href="/posts/notice" className="hover:text-gray-950 dark:hover:text-white">Notice</Link>
                <Link href="/supports" className="hover:text-gray-950 dark:hover:text-white">Support</Link>
                <Link href="/contact" className="hover:text-gray-950 dark:hover:text-white">Contact</Link>
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-950 dark:text-white">Legal</div>
              <div className="mt-3 grid gap-2 text-sm text-gray-500 dark:text-dark-300">
                <Link href="/terms" className="hover:text-gray-950 dark:hover:text-white">Terms</Link>
                <Link href="/privacy" className="hover:text-gray-950 dark:hover:text-white">Privacy</Link>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-dark-800">
          <div className="mx-auto flex max-w-screen-xl flex-col gap-2 px-3 py-5 text-xs text-gray-400 md:flex-row md:items-center md:justify-between">
            <span>© {new Date().getFullYear()} {siteTitle}. All rights reserved.</span>
            <span>Built with Gjworks</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DefaultLayout;
