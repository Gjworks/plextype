"use server";

import prisma from "@plextype/utils/db/prisma";
import type { Prisma } from "@prisma/client";

const updateUserAction = async (formData: FormData) => {
  const idRaw = formData.get("id");
  if (typeof idRaw !== "string") {
    throw new Error("Invalid or missing user id");
  }
  const id = parseInt(idRaw, 10);
  if (isNaN(id)) {
    throw new Error("User id is not a valid number");
  }
  const isAdmin = formData.get("isAdmin") === "true";
  const groupsRaw = formData.getAll("groups[]"); // string[]
  const groups = groupsRaw.map((g) => parseInt(g as string, 10)); // number[]

  // 트랜잭션으로 처리 (안전성 ↑)
  await prisma.$transaction(async (tx) => {
    // 1. 유저 정보 업데이트
    await tx.user.update({
      where: { id },
      data: { isAdmin },
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

  return { success: true };
};

export { updateUserAction };
