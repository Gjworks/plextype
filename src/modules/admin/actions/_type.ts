import { z } from "zod";
import { ActionResponse } from "@/core/types/actions";

export type { ActionResponse };

export type ActionState<T = any> = ActionResponse<T>;

export const SiteSettingsSchema = z.object({
  appName: z.string().trim().min(1, "APP_NAME을 입력해주세요.").max(80, "APP_NAME은 80자 이하로 입력해주세요."),
  projectName: z.string().trim().min(1, "PROJECT_NAME을 입력해주세요.").max(80, "PROJECT_NAME은 80자 이하로 입력해주세요."),
  projectTitle: z.string().trim().min(1, "PROJECT_TITLE을 입력해주세요.").max(120, "PROJECT_TITLE은 120자 이하로 입력해주세요."),
  siteUrl: z.string().trim().url("사이트 URL 형식이 올바르지 않습니다."),
  apiBaseUrl: z.string().trim().url("API Base URL 형식이 올바르지 않습니다.").optional().or(z.literal("")),
});

export type SiteSettingsParams = z.infer<typeof SiteSettingsSchema>;

export type SiteSettingsData = SiteSettingsParams;
