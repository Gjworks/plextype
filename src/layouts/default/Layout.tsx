import Link from "next/link";
import { ArrowRight, Leaf, Menu, X } from "lucide-react";
import type { ReactNode } from "react";

import { getPublicSiteNavigationAction } from "@/modules/admin/actions/sitemap.action";

const fallbackNavigation = [
  { id: 1, title: "Home", href: "/", target: null },
  { id: 2, title: "Features", href: "/features", target: null },
  { id: 3, title: "Labs", href: "/previews", target: null },
  { id: 4, title: "Supports", href: "/posts/notice", target: null },
  { id: 5, title: "Contact", href: "/contact", target: null },
];

type StudioLayoutProps = { children: ReactNode; siteUrl?: string; siteTitle?: string; useConfiguredNavigation?: boolean };

const StudioLayout = async ({ children, siteUrl = "/", siteTitle = "Plextype", useConfiguredNavigation = true }: StudioLayoutProps) => {
  const navigationResult = useConfiguredNavigation ? await getPublicSiteNavigationAction("header-main") : { data: [] };
  const sourceNavigation = navigationResult.data?.length ? navigationResult.data : fallbackNavigation;
  const navigation = Array.from(new Map(sourceNavigation.map((item) => [`${item.title}:${item.href}`, item] as const)).values());

  return (
    <div className="studio-shell min-h-screen bg-white text-[#10251d] dark:bg-[#07120e] dark:text-white">
      <div className="bg-[#0a3d2d] px-4 py-2.5 text-center text-xs font-medium text-white">
        더 단순한 운영, 더 선명한 콘텐츠 경험
        <Link href="/posts/notice" className="ml-2 inline-flex items-center gap-1 text-[#b8f3d5] hover:underline">새로운 소식 <ArrowRight size={12} /></Link>
      </div>

      <header className="sticky top-0 z-50 border-b border-[#0a3d2d]/10 bg-white/95 backdrop-blur-xl dark:border-white/10 dark:bg-[#07120e]/95">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link href={siteUrl || "/"} className="group flex items-center gap-2.5" aria-label={`${siteTitle} 홈`}>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#0a3d2d] text-white transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3"><Leaf size={18} /></span>
            <span className="text-lg font-semibold tracking-[-0.035em]">{siteTitle}</span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            {navigation.slice(0, 5).map((item) => (
              <Link key={item.id || item.href} href={item.href} target={item.target || undefined} rel={item.target === "_blank" ? "noreferrer" : undefined} className="relative py-2 text-sm font-medium text-[#52685f] transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-[#0a3d2d] after:transition-transform hover:text-[#0a3d2d] hover:after:scale-x-100 dark:text-[#b9c7c1] dark:hover:text-white">
                {item.title}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/auth/signin" className="hidden rounded-xl px-4 py-2.5 text-sm font-medium text-[#385046] transition-colors hover:bg-[#f0f7f3] sm:block dark:text-[#d4ded9] dark:hover:bg-white/10">로그인</Link>
            <Link href="/auth/register" className="hidden items-center gap-2 rounded-xl bg-[#0a3d2d] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#125841] hover:shadow-lg sm:flex">시작하기 <ArrowRight size={15} /></Link>
            <details className="group relative md:hidden">
              <summary className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-xl border border-[#0a3d2d]/15 [&::-webkit-details-marker]:hidden"><Menu className="group-open:hidden" size={19} /><X className="hidden group-open:block" size={19} /></summary>
              <nav className="absolute right-0 top-12 grid min-w-56 gap-1 rounded-2xl border border-[#0a3d2d]/10 bg-white p-2 shadow-2xl dark:border-white/10 dark:bg-[#10251d]">
                {navigation.slice(0, 5).map((item) => <Link key={item.id || item.href} href={item.href} className="rounded-xl px-4 py-3 text-sm hover:bg-[#eef7f2] dark:hover:bg-white/10">{item.title}</Link>)}
              </nav>
            </details>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="bg-[#062c20] text-white">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid gap-12 py-16 md:grid-cols-[1.2fr_0.8fr_0.8fr] lg:py-20">
            <div>
              <Link href="/" className="inline-flex items-center gap-2.5 text-lg font-semibold tracking-[-0.035em]"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-[#0a3d2d]"><Leaf size={17} /></span>{siteTitle}</Link>
              <p className="mt-5 max-w-sm text-sm leading-7 text-white/55">콘텐츠와 사람, 운영 도구를 연결해<br className="hidden sm:block" /> 더 나은 디지털 경험을 만듭니다.</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#83cdb0]">Explore</p>
              <nav className="mt-5 grid gap-3 text-sm text-white/65">
                {navigation.slice(0, 4).map((item) => <Link key={`footer-${item.id || item.href}`} href={item.href} className="w-fit transition-colors hover:text-white">{item.title}</Link>)}
              </nav>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#83cdb0]">Account</p>
              <div className="mt-5 grid gap-3 text-sm text-white/65"><Link href="/auth/signin" className="w-fit transition-colors hover:text-white">로그인</Link><Link href="/auth/register" className="w-fit transition-colors hover:text-white">회원가입</Link><Link href="/user" className="w-fit transition-colors hover:text-white">내 계정</Link></div>
            </div>
          </div>
          <div className="flex flex-col gap-3 border-t border-white/10 py-6 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} {siteTitle}. All rights reserved.</span>
            <span>Built for clear and simple operations.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default StudioLayout;
