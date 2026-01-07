"use server"

import { redirect } from "next/navigation";
import prisma from "@plextype/utils/db/prisma";
import type { Prisma } from "@prisma/client";
import { hashedPassword } from "@plextype/utils/auth/password";
import { getUserByAccountId, getUserByNickname } from "@/extentions/user/scripts/data/user";
import { ActionState } from "@/extentions/user/admin/scripts/actions/definitions";

export async function upsertUserAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  // 1. 데이터 추출
  // id가 존재하면 Update, 없으면 Create 모드로 동작
  const rawId = formData.get("id")?.toString();
  const accountId = formData.get("accountId")?.toString();
  const password = formData.get("password")?.toString();
  const nickname = formData.get("nickname")?.toString();

  // 기타 필드들 (필요에 따라 추가)
  // const isAdmin = formData.get("isAdmin") === "on";

  // 2. 공통 유효성 검사
  if (!accountId || !nickname) {
    return { success: false, message: "아이디와 닉네임은 필수 입력 항목입니다." };
  }

  // --- [분기] 생성(Create) 모드인 경우 ---
  if (!rawId) {
    if (!password) {
      return { success: false, message: "회원 생성 시 비밀번호는 필수입니다." };
    }

    // 중복 검사 (전체 DB 대상)
    const [existingAccount, existingNick] = await Promise.all([
      getUserByAccountId(accountId),
      getUserByNickname(nickname),
    ]);

    if (existingAccount) return { success: false, message: "이미 사용 중인 아이디입니다." };
    if (existingNick) return { success: false, message: "이미 사용 중인 닉네임입니다." };

    try {
      const hashedPwd = await hashedPassword(password);
      await prisma.user.create({
        data: {
          accountId,
          password: hashedPwd,
          email_address: accountId,
          nickName: nickname,
        },
      });
    } catch (error) {
      console.error("Create Error:", error);
      return { success: false, message: "회원 생성 중 오류가 발생했습니다." };
    }
  }

  // --- [분기] 수정(Update) 모드인 경우 ---
  else {
    const id = Number(rawId);

    // 숫자가 아닌 값이 들어왔을 경우 방어 코드 (선택사항)
    if (isNaN(id)) {
      return { success: false, message: "잘못된 회원 ID입니다." };
    }
    try {
      // 수정할 대상 조회
      const currentUser = await prisma.user.findUnique({ where: { id: id } }); // id 타입(String/Int)에 맞춰 변환 필요할 수 있음
      if (!currentUser) return { success: false, message: "수정할 회원 정보를 찾을 수 없습니다." };

      // 닉네임 중복 검사 (나 자신은 제외하고 검사해야 함)
      const nickCheck = await prisma.user.findFirst({
        where: {
          nickName: nickname,
          NOT: { id: id }, // 내 ID는 제외
        },
      });
      if (nickCheck) return { success: false, message: "다른 회원이 사용 중인 닉네임입니다." };

      // 업데이트할 데이터 객체 구성
      const updateData: any = {
        nickName: nickname,
        // accountId는 보통 변경하지 못하게 막거나, 변경 허용 시 중복체크 필요
      };

      // 비밀번호가 입력된 경우에만 업데이트 (입력 안하면 기존 비번 유지)
      if (password && password.trim() !== "") {
        updateData.password = await hashedPassword(password);
      }

      await prisma.user.update({
        where: { id: id },
        data: updateData,
      });

    } catch (error) {
      console.error("Update Error:", error);
      return { success: false, message: "회원 수정 중 오류가 발생했습니다." };
    }
  }

  // 성공 시 목록 페이지로 이동
  redirect("/dashboard/user/list");
}