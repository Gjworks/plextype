"use client";

import { useState, useEffect } from "react";
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

const AccountDropwdown = () => {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);

  const { data: user, isLoading, isError } = useUser();

  const closeDropdown = (close) => {
    setShowDropdown(close);
  };

  const guestNav: Array<Item> = [
    {
      title: "로그인",
      name: "Signin",
      route: "/auth/signin",
    },
    {
      title: "회원가입",
      name: "Register",
      route: "/auth/register",
    },
    {
      title: "",
      name: "divider",
      route: "",
    },
    {
      title: "설정",
      name: "settings",
      route: "#right",
    },
  ];

  const userNav: Array<Item> = [
    {
      title: "내 정보",
      name: "user",
      route: "/user",
    },
    {
      title: "나의 서비스",
      name: "user",
      route: "/user",
    },
    {
      title: "알림",
      name: "notification",
      route: "#right",
    },
    {
      title: "",
      name: "divider",
      route: "",
    },
    {
      title: "설정",
      name: "settings",
      route: "#right",
    },
    {
      title: "관리자",
      name: "dashboard",
      route: "/dashboard",
      condition: {
        operation: "equals",
        name: "isAdmin",
        variable: true,
      },
    },
    {
      title: "",
      name: "divider",
      route: "",
    },
    {
      title: "로그아웃",
      name: "Signout",
      route: "/",
    },
  ];

  if (isLoading) return null; // 혹은 로딩 스피너

  const isLoggedIn = !!user;

  const handleSignOut = async () => {
    // const accessToken = localStorage.getItem('accessToken')
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    const result = await response.json();
    if (result) {
      // 로그아웃 성공 시
      window.location.href = "/";
    }
  };
  console.log(user);
  const callbackName = (name) => {
    name === "Signout" && handleSignOut();
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
        {isLoading ? null : user ? (
          <DefaultList
            list={userNav}
            loggedInfo={user}
            callback={callbackName}
          />
        ) : (
          <DefaultList list={guestNav} callback={callbackName} />
        )}
      </Dropdown>
    </>
  );
};

export default AccountDropwdown;
