"use client";

import { useState, useEffect, use } from "react";
import { useRouter, usePathname } from "next/navigation";
import DefaultLayout from "src/layouts/fullLayout/Layout";
import ProfileComponent from "@plextype/components/account/Profile";
import DefaultNav from "@plextype/components/nav/DefaultNav";

import { useUser } from "@plextype/hooks/auth/useAuth";

const PageLayout = ({ children }) => {
  const route = useRouter();
  const pathname = usePathname();
  const [isLogged, setIsLogged] = useState<boolean | null>();
  const [userNav, setUserNav] = useState<object>([
    {
      title: "대시보드",
      route: "/user",
    },
    {
      title: "계정 프로필 설정",
      route: "/user/userUpdate",
    },
    {
      title: "API 설정",
      route: "/user/apiSettings",
    },
    {
      title: "타임라인",
      route: "/user/timeline",
    },
    {
      title: "1:1문의",
      route: "/user/1n1contact",
    },
    {
      title: "회원탈퇴",
      route: "/user/userDelete",
    },
  ]);
  const [loggedInfo, setLoggedInfo] = useState<UserInfo | undefined>(undefined);
  const [params, setParams] = useState<any[]>([]);
  const { data: user, isLoading } = useUser();

  useEffect(() => {
    const params = pathname?.split("/");
    setParams(params);
  }, [pathname]);

  useEffect(() => {
    if (user) {
      setLoggedInfo(user);
      setIsLogged(true);
    }
  }, [user, user?.data]);

  return (
    <DefaultLayout>
      <div className="">
        <div className="bg-white dark:bg-dark-950 rounded-t-2xl">
          <div className="py-16">
            <ProfileComponent
              profileName={loggedInfo && loggedInfo && loggedInfo.nickName}
              profileEmail={
                loggedInfo && loggedInfo && loggedInfo.email_address
              }
            />
          </div>
          <div className="flex justify-center sticky top-0 lg:top-0 w-full bg-white/90 dark:bg-dark-950/40 backdrop-blur-lg z-90 border-b border-gray-100 dark:border-dark-700">
            <DefaultNav list={userNav} params={params[0]} />
          </div>
          <div>{children}</div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default PageLayout;
