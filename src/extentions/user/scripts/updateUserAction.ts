"use server";

import { cookies } from "next/headers";
import { decodeJwt } from "jose";
import prisma from "@plextype/utils/db/prisma";

export async function updateUserAction(formData: FormData) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  if (!accessToken) throw new Error("로그인이 필요합니다.");

  const decoded = decodeJwt(accessToken) as { id: number } | null;
  if (!decoded) throw new Error("잘못된 토큰입니다.");

  const userId = decoded.id;
  const nickName = formData.get("nickName") as string;
  if (!nickName) throw new Error("닉네임을 입력해주세요.");

  await prisma.user.update({
    where: { id: userId },
    data: { nickName },
  });

  return { success: true };
}