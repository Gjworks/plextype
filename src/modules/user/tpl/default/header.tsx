"use client";

import UserNavWrapper from "@/modules/user/tpl/default/UserNavWrapper";

const HeaderUser = (props: any) => {

  const userNav = [
    { title: "내 계정", route: "/user" },
    { title: "알림센터", route: "/user/notifications" },
    { title: "회원 정보", route: "/user/userUpdate" },
    { title: "개인 설정", route: "/user/preferences" },
    { title: "회원 탈퇴", route: "/user/userDelete" },
  ];

  return (
    <>
      <UserNavWrapper list={userNav} />
    </>
  );
};

export default HeaderUser;
