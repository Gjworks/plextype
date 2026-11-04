"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Dropdown from "@/core/components/dropdown/Dropdown";
import Avator from "@/core/components/avator/Avator";
import DefaultList from "@/core/components/nav/DefaultList";
// 🌟 이제 엔진 대신 '파이프(Context)'를 연결합니다.
import { useUserContext } from "@/core/providers/UserProvider";
import { clearPwaAppBadge } from "@/core/utils/pwa/appBadge";
import { AccountMenuPanel, accountMenuPanelClass, useServiceAccess, type AccountNavItem } from "./AccountMenu";

const AccountDropdown = () => {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  // 🌟 useUser() 대신 컨텍스트 사용
  const { user, isLoading } = useUserContext();
  const canAccessService = useServiceAccess(user);

  const closeDropdown = (close: boolean) => setShowDropdown(close);

  const guestNav: AccountNavItem[] = [
    { title: "로그인", name: "Signin", route: "/auth/signin" },
    { title: "회원가입", name: "Register", route: "/auth/register" },
  ];

  // 🌟 [개선] 데이터가 캐시에 있다면 로딩 중이라도 화면을 끊지 않습니다.
  const isActuallyLoading = isLoading && !user;

  const handleSignOut = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    await clearPwaAppBadge();
    window.dispatchEvent(new Event("refresh-unread"));
    // 로그아웃 시엔 컨텍스트가 리셋되도록 페이지 전체를 새로고침하는 게 안전합니다.
    window.location.href = "/";
  };

  const callbackName = (name: string) => {
    if (name === "Signout") handleSignOut();
  };

  return (
    <>
      <div className="relative">
        {isActuallyLoading ? (
          // 🌟 로딩 스켈레톤 (기존 스타일 유지)
          <div className="w-8 h-8 animate-pulse rounded-full bg-gray-200 dark:bg-dark-800" />
        ) : (
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="hover:bg-gray-100/20 py-2 px-3 rounded-md transition-colors cursor-pointer"
          >
            {/* 아바타는 user 데이터 유무에 따라 알아서 동작 */}
            <Avator
              username={user?.nickName}
              isLoggedIn={!!user}
              tokenExpiryTime={user?.expiry || (Date.now() + 3600000)}
              profileImage={user?.profileImage || user?.profile?.profileImage}
            />
          </button>
        )}

        <Dropdown state={showDropdown} close={closeDropdown}>
          {user ? (
            <>
              <AccountMenuPanel user={user} canAccessService={canAccessService} callback={callbackName} />
            </>
          ) : (
            <>
              <div className={accountMenuPanelClass}>
                <DefaultList list={guestNav} callback={callbackName} />
              </div>
            </>

          )}
        </Dropdown>
      </div>
    </>
  );
};

export default AccountDropdown;
