"use client";

import { useEffect, useState } from "react";
import DefaultList from "@/core/components/nav/DefaultList";

export interface AccountNavItem {
  title: string;
  name: string;
  route: string;
  condition?: {
    operation: string;
    name: string;
    variable: string | boolean;
  };
}

// 회원 사이트와 관리자 화면의 계정 메뉴가 같은 목록을 쓰도록 한 곳에서 만든다.
// 관리자 화면 안에서는 "관리자" 대신 사이트로 돌아가는 링크를 둔다.
export const getAccountUserNav = ({ inAdmin = false }: { inAdmin?: boolean } = {}): AccountNavItem[] => [
  { title: "내 정보", name: "user", route: "/user" },
  { title: "나의 스토어", name: "my-store", route: "/user/store" },
  {
    title: "서비스 관리",
    name: "service",
    route: "/service",
    condition: { operation: "equals", name: "canAccessService", variable: true },
  },
  { title: "개인 설정", name: "preferences", route: "/user/preferences" },
  inAdmin
    ? { title: "사이트로 이동", name: "home", route: "/" }
    : {
        title: "관리자",
        name: "admin",
        route: "/admin",
        condition: { operation: "equals", name: "isAdmin", variable: true },
      },
  { title: "로그아웃", name: "Signout", route: "/" },
];

export const useServiceAccess = (user: unknown) => {
  const [canAccessService, setCanAccessService] = useState(false);

  useEffect(() => {
    if (!user) {
      setCanAccessService(false);
      return;
    }

    let mounted = true;

    const loadServiceAccess = async () => {
      try {
        const response = await fetch("/api/partners/service-access", {
          credentials: "include",
          cache: "no-store",
        });
        const payload = await response.json();

        if (mounted) setCanAccessService(Boolean(payload?.data?.canAccessService));
      } catch {
        if (mounted) setCanAccessService(false);
      }
    };

    loadServiceAccess();

    return () => {
      mounted = false;
    };
  }, [user]);

  return canAccessService;
};

export const accountMenuPanelClass =
  "w-max min-w-48 max-w-72 overflow-hidden rounded-xl border border-zinc-100 bg-white p-2 shadow-xl shadow-gray-950/5 dark:border-dark-800 dark:bg-dark-900/95 dark:shadow-black/40";

// canAccessService는 드롭다운을 열 때마다 다시 조회하지 않도록 상위에서 useServiceAccess로 받아 넘긴다.
export const AccountMenuPanel = ({
  user,
  canAccessService,
  inAdmin = false,
  callback,
}: {
  user: any;
  canAccessService: boolean;
  inAdmin?: boolean;
  callback: (name: string) => void;
}) => {
  return (
    <div className={accountMenuPanelClass}>
      <div className="border-b border-zinc-100 px-4 py-3 dark:border-dark-800">
        <p className="text-sm font-bold text-zinc-900 dark:text-dark-100">{user?.nickName}님 환영합니다</p>
      </div>
      <DefaultList list={getAccountUserNav({ inAdmin })} loggedInfo={{ ...user, canAccessService }} callback={callback} />
    </div>
  );
};
