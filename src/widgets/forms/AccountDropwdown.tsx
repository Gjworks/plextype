"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Dropdown from "@plextype/components/dropdown/Dropdown";
import Avator from "@plextype/components/avator/Avator";
import DefaultList from "@plextype/components/nav/DefaultList";
import { useUser } from "@plextype/hooks/auth/useAuth";

interface Item {
  title: string;
  name: string;
  route: string;
  condition?: {
    operation: string;
    name: string;
    variable: string | boolean;
  };
}

const AccountDropdown = () => {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);

  const { data: user, isLoading } = useUser();

  const closeDropdown = (close: boolean) => setShowDropdown(close);

  const guestNav: Array<Item> = [
    { title: "로그인", name: "Signin", route: "/auth/signin" },
    { title: "회원가입", name: "Register", route: "/auth/register" },
    { title: "설정", name: "settings", route: "#right" },
  ];

  const userNav: Array<Item> = [
    { title: "내 정보", name: "user", route: "/user" },
    { title: "나의 서비스", name: "user", route: "/user" },
    { title: "알림", name: "notification", route: "#right" },
    { title: "설정", name: "settings", route: "#right" },
    {
      title: "관리자",
      name: "dashboard",
      route: "/dashboard",
      condition: { operation: "equals", name: "isAdmin", variable: true },
    },
    { title: "로그아웃", name: "Signout", route: "/" },
  ];

  if (isLoading) return null;

  const isLoggedIn = !!user;

  const handleSignOut = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.href = "/";
  };

  const callbackName = (name: string) => {
    if (name === "Signout") handleSignOut();
  };

  return (
    <>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="hover:bg-gray-100/20 py-2 px-3 rounded-md dark:hover:bg-dark-700/75"
      >
        <Avator username={user?.nickName} isLoggedIn={isLoggedIn} />
      </button>
      <Dropdown state={showDropdown} close={closeDropdown}>
        {user ? (
          <DefaultList list={userNav} loggedInfo={user} callback={callbackName} />
        ) : (
          <DefaultList list={guestNav} callback={callbackName} />
        )}
      </Dropdown>
    </>
  );
};

export default AccountDropdown;