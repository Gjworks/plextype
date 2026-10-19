"use server";
import { getUserSessionAction } from "./user.action";
import {
  getSettingsByKeysQuery,
  upsertSettingsQuery,
} from "@/core/utils/settings/settings.query";
import redisClient from "@/core/utils/redis/redis";
import { revalidatePath } from "next/cache";
import type { ActionResponse } from "@/core/types/actions";

export const getUserLayoutAdminAction = async (): Promise<
  ActionResponse<{ userLayout: string }>
> => {
  const session = await getUserSessionAction();
  if (!session?.data?.isAdmin)
    return {
      success: false,
      type: "error",
      message: "관리자 권한이 필요합니다.",
    };
  try {
    const records = await getSettingsByKeysQuery(["site.userLayout"]);
    return {
      success: true,
      type: "success",
      message: "회원 스킨 설정을 불러왔습니다.",
      data: {
        userLayout: records[0]?.value || process.env.USER_LAYOUT || "default",
      },
    };
  } catch {
    return {
      success: false,
      type: "error",
      message: "회원 스킨 설정을 불러오지 못했습니다.",
    };
  }
};

export const updateUserLayoutAdminAction = async (
  value: string,
): Promise<ActionResponse<{ userLayout: string }>> => {
  const session = await getUserSessionAction();
  if (!session?.data?.isAdmin)
    return {
      success: false,
      type: "error",
      message: "관리자 권한이 필요합니다.",
    };
  if (typeof value !== "string" || !value.trim() || value.trim().length > 80)
    return {
      success: false,
      type: "error",
      message: "회원 스킨을 선택해주세요.",
    };
  const userLayout = value.trim();
  try {
    await upsertSettingsQuery([
      {
        key: "site.userLayout",
        value: userLayout,
        group: "site",
        label: "사용자 레이아웃",
        description: "사용자 마이페이지에서 사용할 레이아웃 스킨입니다.",
        isPublic: false,
      },
    ]);
    try {
      await redisClient.del("app:settings:site");
    } catch {
      /* Site settings fall back to the database. */
    }
    revalidatePath("/user", "layout");
    return {
      success: true,
      type: "success",
      message: "회원 스킨 설정이 저장되었습니다.",
      data: { userLayout },
    };
  } catch {
    return {
      success: false,
      type: "error",
      message: "회원 스킨 설정 저장에 실패했습니다.",
    };
  }
};
