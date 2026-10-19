"use server";

import { getUserSessionAction } from "@/modules/user/actions/user.action";
import { validateForm } from "@utils/validation/formValidator";
import type { ActionResponse as ActionState } from "@/core/types/actions";
import { AuthSettingsSchema, type AuthSettingsData } from "./settings.type";
import {
  getSettingsByKeysQuery,
  upsertSettingsQuery,
  type SettingSeed,
} from "@/core/utils/settings/settings.query";
import redisClient from "@utils/redis/redis";
import {
  AUTH_SETTING_KEYS,
  mapRecordsToAuthSettings,
  readAuthSettingsCache,
  toAuthSettingSeeds,
  writeAuthSettingsCache,
} from "./auth-settings";

export const getAuthSettingsAdminAction = async (): Promise<
  ActionState<AuthSettingsData>
> => {
  const sessionInfo = await getUserSessionAction();

  if (!sessionInfo?.data?.isAdmin) {
    return {
      success: false,
      type: "error",
      message: "관리자 권한이 필요합니다.",
    };
  }

  try {
    const cached = await readAuthSettingsCache();
    if (cached) {
      return {
        success: true,
        type: "success",
        message: "회원/인증 설정을 불러왔습니다.",
        data: cached,
      };
    }

    const records = await getSettingsByKeysQuery(AUTH_SETTING_KEYS);
    const data = mapRecordsToAuthSettings(records);
    await writeAuthSettingsCache(data);

    return {
      success: true,
      type: "success",
      message: "회원/인증 설정을 불러왔습니다.",
      data,
    };
  } catch (error) {
    console.error("getAuthSettingsAdminAction Error:", error);
    return {
      success: false,
      type: "error",
      message: "회원/인증 설정을 불러오지 못했습니다.",
    };
  }
};

export const updateAuthSettingsAdminAction = async (
  formData: FormData,
): Promise<ActionState<AuthSettingsData>> => {
  const sessionInfo = await getUserSessionAction();

  if (!sessionInfo?.data?.isAdmin) {
    return {
      success: false,
      type: "error",
      message: "관리자 권한이 필요합니다.",
    };
  }

  const formPayload = {
    registrationEnabled: formData.has("registrationEnabled"),
    accountDeletionEnabled: formData.has("accountDeletionEnabled"),
    defaultUserStatus: formData.get("defaultUserStatus"),
    minPasswordLength: formData.get("minPasswordLength"),
    requirePasswordNumber: formData.has("requirePasswordNumber"),
    requirePasswordLetter: formData.has("requirePasswordLetter"),
    requirePasswordSpecial: formData.has("requirePasswordSpecial"),
    loginFailLimit: formData.get("loginFailLimit"),
    loginFailWindowMinutes: formData.get("loginFailWindowMinutes"),
    loginLockMinutes: formData.get("loginLockMinutes"),
    accessTokenExpiresIn: formData.get("accessTokenExpiresIn"),
    refreshTokenExpiresIn: formData.get("refreshTokenExpiresIn"),
    allowConcurrentSessions: formData.has("allowConcurrentSessions"),
    adminSessionGuard: formData.has("adminSessionGuard"),
  };

  const validation = validateForm(AuthSettingsSchema, formPayload);
  if (!validation.isValid) return validation.errorResponse;

  try {
    await upsertSettingsQuery(toAuthSettingSeeds(validation.data));
    await writeAuthSettingsCache(validation.data);

    return {
      success: true,
      type: "success",
      message: "회원/인증 설정이 저장되었습니다.",
      data: validation.data,
    };
  } catch (error) {
    console.error("updateAuthSettingsAdminAction Error:", error);
    return {
      success: false,
      type: "error",
      message: "회원/인증 설정 저장에 실패했습니다.",
    };
  }
};
