"use client";

import { useEffect, useState } from "react";

import { getMySocialLinksAction, SOCIAL_LOGIN_LINKS_PATH } from "@/modules/user/social";
import UserNavWrapper from "@/modules/user/tpl/default/UserNavWrapper";

const userNav = [
  { title: "내 계정", route: "/user" },
  { title: "알림센터", route: "/user/notifications" },
  { title: "회원 정보", route: "/user/userUpdate" },
  { title: "개인 설정", route: "/user/preferences" },
  { title: "회원 탈퇴", route: "/user/userDelete" },
];
const socialLoginNav = { title: "소셜 로그인", route: SOCIAL_LOGIN_LINKS_PATH };

const HeaderUser = (props: any) => {
  // 소셜 로그인 메뉴는 켜진 제공자나 이미 연결한 계정이 있을 때만 보인다. 쓰지 않는 사이트에서는 메뉴가 늘지 않는다.
  const [hasSocialLogin, setHasSocialLogin] = useState(false);
  useEffect(() => {
    let active = true;
    getMySocialLinksAction()
      .then((links) => { if (active) setHasSocialLogin(Boolean(links?.length)); })
      .catch(() => { /* 읽지 못하면 메뉴를 보이지 않는다. */ });
    return () => { active = false; };
  }, []);

  // 회원 탈퇴 앞에 둔다.
  const list = hasSocialLogin ? [...userNav.slice(0, -1), socialLoginNav, ...userNav.slice(-1)] : userNav;

  return (
    <>
      <UserNavWrapper list={list} />
    </>
  );
};

export default HeaderUser;
