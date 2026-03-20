import React from "react";
import { cookies } from "next/headers";
import { decodeJwt } from "jose";

// 💡 1. 구시대의 유물을 버리고, 우리의 새 매니저(Action)를 부릅니다!
import { getPostsInfo } from "@extentions/posts/_actions/posts.action";
import { checkPermissions } from "@extentions/posts/_actions/permission.action";

import PostProvider from "@extentions/posts/_tpl/default/PostProvider";
import PostNotFound from "@extentions/posts/_tpl/default/notFound";

interface CurrentUser {
  id: number;
  accountId: string;
  isAdmin: boolean;
  groups: number[];
  loggedIn: boolean;
}

// 💡 2. 지저분한 토큰 해독 로직은 레이아웃 컴포넌트 밖으로 빼버립니다! (나중엔 auth 유틸로 빼면 더 좋습니다)
async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) return null;

  try {
    const decoded = decodeJwt(accessToken) as any;
    if (decoded) return { ...decoded, loggedIn: true };
  } catch (err) {
    console.log("JWT decode 실패");
  }
  return null;
}

export default async function PageLayout({
                                           children,
                                           params,
                                         }: {
  children: React.ReactNode;
  params: Promise<{ pid: string; id: string }>;
}) {
  const { pid } = await params;

  // 🌟 3. Action 매니저에게 게시판 정보를 요청하고, 포장지를 뜯습니다!
  const res = await getPostsInfo(pid);
  const postInfo = res.success ? res.data : null;

  // 게시판이 없으면 404
  if (!postInfo) {
    return <PostNotFound />;
  }

  // 🌟 4. 깔끔하게 분리해둔 함수로 유저 정보를 가져옵니다.
  const currentUser = await getCurrentUser();

  // 🌟 5. [수정 완료!] 상자를 열어서 결과를 꺼내옵니다. (await 추가)
  const permissionResult = await checkPermissions(postInfo.permissions, currentUser);

  return (
    // 🌟 6. 이제 permissionResult는 Promise가 아니라 실제 boolean 객체입니다!
    <PostProvider value={{ postInfo, currentUser, permissions: permissionResult }}>
      {children}
    </PostProvider>
  );
}