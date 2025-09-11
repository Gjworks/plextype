import React from "react";
import DefaultLayout from "src/layouts/fullLayout/Layout";
import {getPostInfo} from "@/extentions/posts/scripts/actions/getPostInfo";
import PostProvider from "@/extentions/posts/templates/default/PostProvider";
import PostNotFound from "@/extentions/posts/templates/default/notFound";
import {checkPermissions} from "@/extentions/posts/scripts/actions/hasPermission";

import {cookies} from "next/headers";
import {decodeJwt} from "jose";

interface CurrentUser {
  id: number;
  accountId: string;
  isAdmin: boolean;
  groups: number[]; // 사용자가 속한 그룹 ID 배열
  loggedIn: boolean; // 로그인 상태
}

export default async function PageLayout({
                                           children,
                                           params: rawParams,  // params는 Promise 형태일 수 있음
                                         }: {
  children: React.ReactNode;
  params: { pid: string } | Promise<{ pid: string }>;
}) {
  const params = await rawParams; // <-- await로 실제 값으로 변환
  const postInfo = await getPostInfo(params.pid);

  let currentUser: CurrentUser | null = null;

  const {pid} = params;

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (accessToken) {
    try {
      // JWT에서 우리가 넣은 custom claims로 단언
      const decoded = decodeJwt(accessToken) as {
        id: number;
        accountId: string;
        isAdmin: boolean;
        groups: number[];
      } | null;

      if (decoded) {
        currentUser = {...decoded, loggedIn: true};
      }
    } catch (err) {
      console.log("JWT decode 실패", err);
    }
  }

  if (!postInfo) {
    return <PostNotFound/>;
  }

  // list 권한 체크 (예: guest, member, admin 등)
  const permissionResult = checkPermissions(postInfo.permissions, currentUser);

  return (
    <PostProvider value={{postInfo, currentUser: null, permissions: permissionResult}}>
      <DefaultLayout>{children}</DefaultLayout>
    </PostProvider>
  );
}