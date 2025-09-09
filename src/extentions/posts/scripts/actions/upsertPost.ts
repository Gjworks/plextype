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

  const decoded = decodeJwt(accessToken) as { id: number; isAdmin: boolean } | null;
  if (!decoded) throw new Error("잘못된 토큰");

  const userId = decoded.id;
  const isAdmin = decoded.isAdmin;

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const id = formData.get("id");
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

  if (id) {
    const existingDoc = await prisma.document.findUnique({
      where: { id: Number(id) },
      select: { userId: true },
    });
    if (!existingDoc) throw new Error("존재하지 않는 글입니다.");

    // 수정 권한 체크: 작성자 본인 or isAdmin
    if (existingDoc.userId !== userId && !isAdmin) {
      throw new Error("본인이 작성한 글만 수정할 수 있습니다.");
    }

    // 📌 기존 글 업데이트
    await prisma.document.update({
      where: { id: Number(id) },
      data: {
        title,
        content,
        updatedAt: new Date(),
      },
    });
  } else {
    // 📌 새 글 생성
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
  }
};
