"use server";

import prisma from "@plextype/utils/db/prisma";
import { hashedPassword } from "@plextype/utils/auth/password";
import {revalidatePath} from "next/cache";

const updateUserAction = async (formData: FormData) => {
  const idRaw = formData.get("id");
  if (typeof idRaw !== "string") throw new Error("Invalid ID");

  const id = parseInt(idRaw, 10);
  const isAdmin = formData.get("isAdmin") === "true";
  const groupsRaw = formData.getAll("groups[]");
  const groups = groupsRaw.map((g) => parseInt(g as string, 10));

  // 추가로 넘어온 데이터들 꺼내기
  const accountId = formData.get("accountId") as string;
  const nickname = formData.get("nickname") as string;
  const memo = formData.get("memo") as string;
  const password = formData.get("password") as string;

  // 업데이트할 데이터 객체 생성
  const updateData: any = {
    isAdmin,
    accountId,
    nickName: nickname, // Prisma 필드명과 맞춰주세요 (nickName인지 nickname인지 확인!)
  };

  if (password && password.trim() !== "") {
    updateData.password = await hashedPassword(password);
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. 유저 정보 업데이트 (꺼낸 데이터들을 모두 포함)
      await tx.user.update({
        where: { id },
        data: updateData,
      });

      // 2. 기존 그룹 관계 삭제
      await tx.userGroupUser.deleteMany({
        where: { userId: id },
      });

      // 3. 새로운 그룹 관계 추가
      if (groups.length > 0) {
        await tx.userGroupUser.createMany({
          data: groups.map((groupId) => ({
            groupId,
            userId: id,
          })),
        });
      }
    });

    revalidatePath('/dashboard/user/list');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, message: "업데이트 중 오류 발생" };
  }
};

export { updateUserAction };