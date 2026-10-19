import { z } from "zod";
import { ActionResponse } from "@/core/types/actions";
export type { ActionResponse };

export type ActionState<T = any> = ActionResponse<T>;

export const SiteSettingsSchema = z.object({
  appName: z
    .string()
    .trim()
    .min(1, "APP_NAME을 입력해주세요.")
    .max(80, "APP_NAME은 80자 이하로 입력해주세요."),
  projectName: z
    .string()
    .trim()
    .min(1, "PROJECT_NAME을 입력해주세요.")
    .max(80, "PROJECT_NAME은 80자 이하로 입력해주세요."),
  projectTitle: z
    .string()
    .trim()
    .min(1, "PROJECT_TITLE을 입력해주세요.")
    .max(120, "PROJECT_TITLE은 120자 이하로 입력해주세요."),
  siteUrl: z.string().trim().url("사이트 URL 형식이 올바르지 않습니다."),
  apiBaseUrl: z
    .string()
    .trim()
    .url("API Base URL 형식이 올바르지 않습니다.")
    .optional()
    .or(z.literal("")),
  logoPath: z
    .string()
    .trim()
    .max(500, "로고 이미지 경로가 너무 깁니다.")
    .optional()
    .or(z.literal("")),
  faviconPath: z
    .string()
    .trim()
    .max(500, "파비콘 경로가 너무 깁니다.")
    .optional()
    .or(z.literal("")),
  defaultOgImage: z
    .string()
    .trim()
    .max(500, "기본 OG 이미지 경로가 너무 깁니다.")
    .optional()
    .or(z.literal("")),
  adminLayout: z
    .string()
    .trim()
    .min(1, "관리자 레이아웃을 선택해주세요.")
    .max(80, "관리자 레이아웃 키가 너무 깁니다."),
  userLayout: z
    .string()
    .trim()
    .min(1, "사용자 레이아웃을 선택해주세요.")
    .max(80, "사용자 레이아웃 키가 너무 깁니다."),
});

export type SiteSettingsParams = z.infer<typeof SiteSettingsSchema>;

export type SiteSettingsData = SiteSettingsParams;

export const SeoSettingsSchema = z.object({
  defaultTitle: z
    .string()
    .trim()
    .min(1, "기본 메타 제목을 입력해주세요.")
    .max(120, "기본 메타 제목은 120자 이하로 입력해주세요."),
  titleTemplate: z
    .string()
    .trim()
    .min(1, "타이틀 규칙을 입력해주세요.")
    .max(120, "타이틀 규칙은 120자 이하로 입력해주세요."),
  metaDescription: z
    .string()
    .trim()
    .min(1, "기본 메타 설명을 입력해주세요.")
    .max(300, "기본 메타 설명은 300자 이하로 입력해주세요."),
  keywords: z
    .string()
    .trim()
    .max(300, "키워드는 300자 이하로 입력해주세요.")
    .optional()
    .or(z.literal("")),
  robotsIndex: z.enum(["index", "noindex"], {
    error: "색인 정책을 선택해주세요.",
  }),
  robotsFollow: z.enum(["follow", "nofollow"], {
    error: "링크 추적 정책을 선택해주세요.",
  }),
  twitterCard: z.enum(["summary", "summary_large_image"], {
    error: "Twitter 카드 타입을 선택해주세요.",
  }),
  sitemapEnabled: z.boolean(),
  includePagesInSitemap: z.boolean(),
  includePostsInSitemap: z.boolean(),
});

export type SeoSettingsParams = z.infer<typeof SeoSettingsSchema>;

export type SeoSettingsData = SeoSettingsParams;

export const SearchSettingsSchema = z.object({
  integratedSearchEnabled: z.boolean(),
  documentSearchEnabled: z.boolean(),
  commentSearchEnabled: z.boolean(),
  attachmentSearchEnabled: z.boolean(),
  userSearchEnabled: z.boolean(),
  extensionSearchEnabled: z.boolean(),
  includeUserEmail: z.boolean(),
  defaultResultLimit: z.coerce
    .number()
    .int()
    .min(3, "기본 결과 수는 3개 이상이어야 합니다.")
    .max(20, "기본 결과 수는 20개 이하로 입력해주세요."),
  minSearchLength: z.coerce
    .number()
    .int()
    .min(1, "최소 검색어 길이는 1자 이상이어야 합니다.")
    .max(10, "최소 검색어 길이가 너무 깁니다."),
});

export type SearchSettingsParams = z.infer<typeof SearchSettingsSchema>;

export type SearchSettingsData = SearchSettingsParams;

export const SiteNavigationSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  groupId: z.coerce.number().int().positive().optional(),
  groupKey: z
    .string()
    .trim()
    .min(1, "메뉴 그룹을 선택해주세요.")
    .max(100, "메뉴 그룹 키는 100자 이하로 입력해주세요."),
  parentId: z.coerce.number().int().positive().nullable().optional(),
  name: z
    .string()
    .trim()
    .min(1, "메뉴 키를 입력해주세요.")
    .max(100, "메뉴 키는 100자 이하로 입력해주세요."),
  title: z
    .string()
    .trim()
    .min(1, "메뉴 이름을 입력해주세요.")
    .max(120, "메뉴 이름은 120자 이하로 입력해주세요."),
  href: z
    .string()
    .trim()
    .min(1, "링크 주소를 입력해주세요.")
    .max(500, "링크 주소가 너무 깁니다."),
  target: z
    .string()
    .trim()
    .max(20, "타겟은 20자 이하로 입력해주세요.")
    .optional()
    .or(z.literal("")),
  icon: z
    .string()
    .trim()
    .max(60, "아이콘 이름은 60자 이하로 입력해주세요.")
    .optional()
    .or(z.literal("")),
  order: z.coerce
    .number()
    .int()
    .min(0, "정렬값은 0 이상이어야 합니다.")
    .default(0),
  location: z
    .string()
    .trim()
    .min(1, "노출 위치를 선택해주세요.")
    .max(45, "노출 위치는 45자 이하로 입력해주세요."),
  visibility: z
    .string()
    .trim()
    .min(1, "공개 범위를 선택해주세요.")
    .max(45, "공개 범위는 45자 이하로 입력해주세요."),
  isActive: z.coerce.boolean().default(false),
});

export type SiteNavigationParams = z.infer<typeof SiteNavigationSchema>;

export const SiteNavigationGroupSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  key: z
    .string()
    .trim()
    .min(1, "그룹 키를 입력해주세요.")
    .max(100, "그룹 키는 100자 이하로 입력해주세요."),
  title: z
    .string()
    .trim()
    .min(1, "그룹 이름을 입력해주세요.")
    .max(120, "그룹 이름은 120자 이하로 입력해주세요."),
  description: z
    .string()
    .trim()
    .max(500, "설명은 500자 이하로 입력해주세요.")
    .optional()
    .or(z.literal("")),
  area: z
    .string()
    .trim()
    .min(1, "영역을 선택해주세요.")
    .max(45, "영역은 45자 이하로 입력해주세요."),
  order: z.coerce
    .number()
    .int()
    .min(0, "정렬값은 0 이상이어야 합니다.")
    .default(0),
  isActive: z.coerce.boolean().default(false),
});

export type SiteNavigationGroupParams = z.infer<
  typeof SiteNavigationGroupSchema
>;

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
