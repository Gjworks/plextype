"use server";

import { cookies } from "next/headers";
import { decodeJwt } from "jose";
import prisma from "@plextype/utils/db/prisma";

export const upsertPost = async (
  pid: string,
  formData: FormData,
): Promise<void> => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  if (!accessToken) throw new Error("로그인 필요");

  const decoded = decodeJwt(accessToken) as { id: number } | null;
  if (!decoded) throw new Error("잘못된 토큰");

  const userId = decoded.id;

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  if (!title || !content) throw new Error("제목과 내용을 입력해주세요.");

  // 📌 pid로 게시판(Posts) 정보 조회
  const post = await prisma.posts.findUnique({
    where: { pid },
  });
  if (!post) throw new Error("존재하지 않는 게시판입니다.");

  // 📌 사용자 정보 조회 (닉네임 가져오기 위함)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { nickName: true },
  });

  // 📌 Document 생성
  await prisma.document.create({
    data: {
      resourceType: "post",
      resourceId: post.id, // ← Posts.id 연결
      categoryId: null, // 필요 시 formData에 categoryId 추가해서 설정
      title,
      content,
      userId,
      authorName: user?.nickName ?? "익명",
      published: true,
      isNotice: false,
      isSecrets: false,
      readCount: 0,
      commentCount: 0,
      voteCount: 0,
    },
  });
};
