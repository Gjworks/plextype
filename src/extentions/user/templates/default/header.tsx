"use client";

import ProfileWrapper from "@/extentions/user/templates/default/ProfileWrapper";
import UserNavWrapper from "@/extentions/user/templates/default/UserNavWrapper";

const HeaderUser = (props: any) => {

  const userNav = [
    { title: "대시보드", route: "/user" },
    { title: "계정 프로필 설정", route: "/user/userUpdate" },
    { title: "API 설정", route: "/user/apiSettings" },
    { title: "타임라인", route: "/user/timeline" },
    { title: "1:1문의", route: "/user/1n1contact" },
    { title: "회원탈퇴", route: "/user/userDelete" },
  ];

  return (
    <>
      {/* ✅ 클라 전용 ProfileWrapper */}
      {/*<ProfileWrapper currentUser={currentUser} />*/}

      {/* ✅ 클라 전용 Nav */}
      <UserNavWrapper list={userNav} />

    </>
  );
};

export default HeaderUser;
