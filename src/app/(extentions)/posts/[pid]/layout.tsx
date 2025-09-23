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
                                           params,
                                         }: {
  children: React.ReactNode;
  params:  Promise<{ pid: string; id: string }>;
}) {
  const resolvedParams = await params; // params가 Promise라면 await
  const { pid, id } = resolvedParams;
  const postInfo = await getPostInfo(pid);

  let currentUser: CurrentUser | null = null;


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
    <PostProvider value={{postInfo, currentUser, permissions: permissionResult}}>
      <DefaultLayout>{children}</DefaultLayout>
    </PostProvider>
  );
}