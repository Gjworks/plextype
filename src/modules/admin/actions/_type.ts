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

export const SiteNavigationSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  groupId: z.coerce.number().int().positive().optional(),
  groupKey: z.string().trim().min(1, "메뉴 그룹을 선택해주세요.").max(100, "메뉴 그룹 키는 100자 이하로 입력해주세요."),
  parentId: z.coerce.number().int().positive().nullable().optional(),
  name: z.string().trim().min(1, "메뉴 키를 입력해주세요.").max(100, "메뉴 키는 100자 이하로 입력해주세요."),
  title: z.string().trim().min(1, "메뉴 이름을 입력해주세요.").max(120, "메뉴 이름은 120자 이하로 입력해주세요."),
  href: z.string().trim().min(1, "링크 주소를 입력해주세요.").max(500, "링크 주소가 너무 깁니다."),
  target: z.string().trim().max(20, "타겟은 20자 이하로 입력해주세요.").optional().or(z.literal("")),
  icon: z.string().trim().max(60, "아이콘 이름은 60자 이하로 입력해주세요.").optional().or(z.literal("")),
  order: z.coerce.number().int().min(0, "정렬값은 0 이상이어야 합니다.").default(0),
  location: z.string().trim().min(1, "노출 위치를 선택해주세요.").max(45, "노출 위치는 45자 이하로 입력해주세요."),
  visibility: z.string().trim().min(1, "공개 범위를 선택해주세요.").max(45, "공개 범위는 45자 이하로 입력해주세요."),
  isActive: z.coerce.boolean().default(false),
});

export type SiteNavigationParams = z.infer<typeof SiteNavigationSchema>;

export const SiteNavigationGroupSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  key: z.string().trim().min(1, "그룹 키를 입력해주세요.").max(100, "그룹 키는 100자 이하로 입력해주세요."),
  title: z.string().trim().min(1, "그룹 이름을 입력해주세요.").max(120, "그룹 이름은 120자 이하로 입력해주세요."),
  description: z.string().trim().max(500, "설명은 500자 이하로 입력해주세요.").optional().or(z.literal("")),
  area: z.string().trim().min(1, "영역을 선택해주세요.").max(45, "영역은 45자 이하로 입력해주세요."),
  order: z.coerce.number().int().min(0, "정렬값은 0 이상이어야 합니다.").default(0),
  isActive: z.coerce.boolean().default(false),
});

export type SiteNavigationGroupParams = z.infer<typeof SiteNavigationGroupSchema>;

export interface SiteNavigationGroupItem {
  id: number;
  key: string;
  title: string;
  description: string | null;
  area: string;
  order: number;
  isActive: boolean;
}

export interface SiteNavigationItem {
  id: number;
  groupId: number | null;
  groupKey: string;
  groupTitle: string;
  groupArea: string;
  parentId: number | null;
  name: string;
  title: string;
  href: string;
  target: string | null;
  icon: string | null;
  order: number;
  depth: number;
  location: string;
  visibility: string;
  isActive: boolean;
  children: SiteNavigationItem[];
}

export interface SiteNavigationAdminData {
  groups: SiteNavigationGroupItem[];
  items: SiteNavigationItem[];
}
