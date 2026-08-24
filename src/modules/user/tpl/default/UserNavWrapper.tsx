"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";
import { Bell, Settings2, ShieldX, UserRound, WalletCards } from "lucide-react";

const navIconMap: Record<string, React.ReactNode> = {
  "/user": <WalletCards size={15} />,
  "/user/notifications": <Bell size={15} />,
  "/user/userUpdate": <UserRound size={15} />,
  "/user/preferences": <Settings2 size={15} />,
  "/user/userDelete": <ShieldX size={15} />,
};

export default function UserNavWrapper({ list }: { list: any[] }) {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-30 w-full border-b border-gray-200 bg-white/95 backdrop-blur-xl dark:border-dark-800 dark:bg-dark-950/95">
      <div className="mx-auto flex max-w-screen-lg flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <Link href="/user" className="group flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-950 text-sm font-medium text-white shadow-sm transition-transform group-hover:-translate-y-0.5 dark:bg-white dark:text-dark-950">
            U
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium tracking-[-0.02em] text-gray-950 dark:text-white">My Account</span>
            <span className="block truncate text-xs text-gray-400 dark:text-dark-500">계정과 개인 설정</span>
          </span>
        </Link>

        <nav
          className="flex max-w-full gap-1 overflow-x-auto rounded-full border border-gray-200 bg-gray-50 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:border-dark-800 dark:bg-dark-900/70 md:justify-end"
          aria-label="사용자 메뉴"
        >
          {list.map((item) => {
            const active = item.route === "/user" ? pathname === item.route : pathname?.startsWith(item.route);

            return (
              <Link
                key={item.route}
                href={item.route}
                className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-3.5 text-sm transition-all duration-200 ${
                  active
                    ? "bg-gray-950 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_18px_rgba(15,23,42,0.12)] dark:bg-white dark:text-dark-950"
                    : "text-gray-500 hover:bg-white hover:text-gray-950 hover:shadow-sm dark:text-dark-300 dark:hover:bg-dark-800 dark:hover:text-white"
                }`}
              >
                {navIconMap[item.route]}
                {item.title}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
