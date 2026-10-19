"use server";

import { mkdir, writeFile } from "fs/promises";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import path from "path";
import { getUserSessionAction } from "@/modules/user/actions/user.action";
import { validateForm } from "@utils/validation/formValidator";
import {
  ActionState,
  SearchSettingsData,
  SearchSettingsSchema,
  SeoSettingsData,
  SeoSettingsSchema,
  SiteSettingsData,
  SiteSettingsSchema,
} from "./_type";
import {
  getPublicPageSitemapEntriesQuery,
  getPublicPostSitemapEntriesQuery,
} from "./settings.query";
import {
  getSettingsByKeysQuery,
  SettingSeed,
  upsertSettingsQuery,
} from "@/core/utils/settings/settings.query";
import redisClient from "@utils/redis/redis";
import { v4 as uuidv4 } from "uuid";
import {
  assertDecodableImage,
  detectMimeTypeFromBuffer,
  isMimeCompatibleWithExtension,
} from "@/core/utils/file/fileValidation";

const SITE_SETTINGS_CACHE_KEY = "app:settings:site";

const SEO_SETTINGS_CACHE_KEY = "app:settings:seo";

const SEARCH_SETTINGS_CACHE_KEY = "app:settings:search";
const SITE_SETTINGS_CACHE_TTL = 60 * 60 * 24;
const SITE_IMAGE_MAX_SIZE = 5 * 1024 * 1024;
const SITE_IMAGE_ALLOWED_EXTS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".avif",
  ".webp",
  ".ico",
]);
const SITE_IMAGE_ALLOWED_MIMES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/avif",
  "image/webp",
  "image/vnd.microsoft.icon",
  "image/x-icon",
]);

const SITE_SETTING_META = {
  appName: {
    key: "site.appName",
    env: "APP_NAME",
    label: "APP_NAME",
    fallback: "plextype",
    isPublic: true,
  },
  projectName: {
    key: "site.projectName",
    env: "PROJECT_NAME",
    label: "PROJECT_NAME",
    fallback: "plextype",
    isPublic: false,
  },
  projectTitle: {
    key: "site.projectTitle",
    env: "PROJECT_TITLE",
    label: "PROJECT_TITLE",
    fallback: "plextype",
    isPublic: true,
  },
  siteUrl: {
    key: "site.url",
    env: "NEXT_PUBLIC_DEFAULT_URL",
    label: "사이트 URL",
    fallback: "http://localhost:3000",
    isPublic: true,
  },
  apiBaseUrl: {
    key: "site.apiBaseUrl",
    env: "NEXT_PUBLIC_API_BASE_URL",
    label: "API Base URL",
    fallback: "",
    isPublic: true,
  },
  logoPath: {
    key: "site.logoPath",
    env: "SITE_LOGO_PATH",
    label: "로고 이미지",
    fallback: "",
    isPublic: true,
  },
  faviconPath: {
    key: "site.faviconPath",
    env: "SITE_FAVICON_PATH",
    label: "파비콘",
    fallback: "",
    isPublic: true,
  },
  defaultOgImage: {
    key: "site.defaultOgImage",
    env: "SITE_DEFAULT_OG_IMAGE",
    label: "기본 OG 이미지",
    fallback: "",
    isPublic: true,
  },
  adminLayout: {
    key: "site.adminLayout",
    env: "ADMIN_LAYOUT",
    label: "관리자 레이아웃",
    fallback: "default",
    isPublic: false,
  },
  userLayout: {
    key: "site.userLayout",
    env: "USER_LAYOUT",
    label: "사용자 레이아웃",
    fallback: "default",
    isPublic: false,
  },
} as const;

const SITE_SETTING_KEYS = Object.values(SITE_SETTING_META).map(
  (item) => item.key,
);

const SEO_SETTING_META = {
  defaultTitle: {
    key: "seo.defaultTitle",
    label: "기본 메타 제목",
    fallback: "Plextype",
    isPublic: true,
  },
  titleTemplate: {
    key: "seo.titleTemplate",
    label: "타이틀 규칙",
    fallback: "%s | Plextype",
    isPublic: true,
  },
  metaDescription: {
    key: "seo.metaDescription",
    label: "기본 메타 설명",
    fallback: "Plextype으로 만든 사이트입니다.",
    isPublic: true,
  },
  keywords: {
    key: "seo.keywords",
    label: "기본 키워드",
    fallback: "",
    isPublic: true,
  },
  robotsIndex: {
    key: "seo.robotsIndex",
    label: "색인 정책",
    fallback: "index",
    isPublic: true,
  },
  robotsFollow: {
    key: "seo.robotsFollow",
    label: "링크 추적 정책",
    fallback: "follow",
    isPublic: true,
  },
  twitterCard: {
    key: "seo.twitterCard",
    label: "Twitter 카드",
    fallback: "summary_large_image",
    isPublic: true,
  },
  sitemapEnabled: {
    key: "seo.sitemapEnabled",
    label: "사이트맵 사용",
    fallback: "true",
    isPublic: true,
  },
  includePagesInSitemap: {
    key: "seo.includePagesInSitemap",
    label: "페이지 사이트맵 포함",
    fallback: "true",
    isPublic: true,
  },
  includePostsInSitemap: {
    key: "seo.includePostsInSitemap",
    label: "게시글 사이트맵 포함",
    fallback: "true",
    isPublic: true,
  },
} as const;

const SEO_SETTING_KEYS = Object.values(SEO_SETTING_META).map(
  (item) => item.key,
);

const SEARCH_SETTING_META = {
  integratedSearchEnabled: {
    key: "search.integratedSearchEnabled",
    label: "통합검색 사용",
    fallback: "true",
    isPublic: true,
  },
  documentSearchEnabled: {
    key: "search.documentSearchEnabled",
    label: "문서 검색",
    fallback: "true",
    isPublic: true,
  },
  commentSearchEnabled: {
    key: "search.commentSearchEnabled",
    label: "댓글 검색",
    fallback: "true",
    isPublic: true,
  },
  attachmentSearchEnabled: {
    key: "search.attachmentSearchEnabled",
    label: "첨부파일 검색",
    fallback: "true",
    isPublic: true,
  },
  userSearchEnabled: {
    key: "search.userSearchEnabled",
    label: "회원 검색",
    fallback: "false",
    isPublic: false,
  },
  extensionSearchEnabled: {
    key: "search.extensionSearchEnabled",
    label: "확장 모듈 검색",
    fallback: "true",
    isPublic: false,
  },
  includeUserEmail: {
    key: "search.includeUserEmail",
    label: "회원 이메일 노출",
    fallback: "false",
    isPublic: false,
  },
  defaultResultLimit: {
    key: "search.defaultResultLimit",
    label: "그룹별 결과 수",
    fallback: "6",
    isPublic: true,
  },
  minSearchLength: {
    key: "search.minSearchLength",
    label: "최소 검색어 길이",
    fallback: "2",
    isPublic: true,
  },
} as const;

const SEARCH_SETTING_KEYS = Object.values(SEARCH_SETTING_META).map(
  (item) => item.key,
);

const getEnvFallback = (name: keyof typeof SITE_SETTING_META) => {
  const meta = SITE_SETTING_META[name];
  return process.env[meta.env] || meta.fallback;
};

const mapRecordsToSiteSettings = (
  records: Awaited<ReturnType<typeof getSettingsByKeysQuery>>,
): SiteSettingsData => {
  const values = new Map(
    records.map((record) => [record.key, record.value || ""]),
  );

  return {
    appName:
      values.get(SITE_SETTING_META.appName.key) || getEnvFallback("appName"),
    projectName:
      values.get(SITE_SETTING_META.projectName.key) ||
      getEnvFallback("projectName"),
    projectTitle:
      values.get(SITE_SETTING_META.projectTitle.key) ||
      getEnvFallback("projectTitle"),
    siteUrl:
      values.get(SITE_SETTING_META.siteUrl.key) || getEnvFallback("siteUrl"),
    apiBaseUrl:
      values.get(SITE_SETTING_META.apiBaseUrl.key) ||
      getEnvFallback("apiBaseUrl"),
    logoPath:
      values.get(SITE_SETTING_META.logoPath.key) || getEnvFallback("logoPath"),
    faviconPath:
      values.get(SITE_SETTING_META.faviconPath.key) ||
      getEnvFallback("faviconPath"),
    defaultOgImage:
      values.get(SITE_SETTING_META.defaultOgImage.key) ||
      getEnvFallback("defaultOgImage"),
    adminLayout:
      values.get(SITE_SETTING_META.adminLayout.key) ||
      getEnvFallback("adminLayout"),
    userLayout:
      values.get(SITE_SETTING_META.userLayout.key) ||
      getEnvFallback("userLayout"),
  };
};

const readSiteSettingsCache = async (): Promise<SiteSettingsData | null> => {
  try {
    const cached = await redisClient.get(SITE_SETTINGS_CACHE_KEY);
    if (!cached) return null;

    return SiteSettingsSchema.parse(JSON.parse(cached));
  } catch (error) {
    console.warn("readSiteSettingsCache Warning:", error);
    return null;
  }
};

const readSeoSettingsCache = async (): Promise<SeoSettingsData | null> => {
  try {
    const cached = await redisClient.get(SEO_SETTINGS_CACHE_KEY);
    if (!cached) return null;

    return SeoSettingsSchema.parse(JSON.parse(cached));
  } catch (error) {
    console.warn("readSeoSettingsCache Warning:", error);
    return null;
  }
};

const readSearchSettingsCache =
  async (): Promise<SearchSettingsData | null> => {
    try {
      const cached = await redisClient.get(SEARCH_SETTINGS_CACHE_KEY);
      if (!cached) return null;

      return SearchSettingsSchema.parse(JSON.parse(cached));
    } catch (error) {
      console.warn("readSearchSettingsCache Warning:", error);
      return null;
    }
  };

const writeSiteSettingsCache = async (data: SiteSettingsData) => {
  try {
    await redisClient.set(
      SITE_SETTINGS_CACHE_KEY,
      JSON.stringify(data),
      "EX",
      SITE_SETTINGS_CACHE_TTL,
    );
  } catch (error) {
    console.warn("writeSiteSettingsCache Warning:", error);
  }
};

const writeSeoSettingsCache = async (data: SeoSettingsData) => {
  try {
    await redisClient.set(
      SEO_SETTINGS_CACHE_KEY,
      JSON.stringify(data),
      "EX",
      SITE_SETTINGS_CACHE_TTL,
    );
  } catch (error) {
    console.warn("writeSeoSettingsCache Warning:", error);
  }
};

const writeSearchSettingsCache = async (data: SearchSettingsData) => {
  try {
    await redisClient.set(
      SEARCH_SETTINGS_CACHE_KEY,
      JSON.stringify(data),
      "EX",
      SITE_SETTINGS_CACHE_TTL,
    );
  } catch (error) {
    console.warn("writeSearchSettingsCache Warning:", error);
  }
};

const toBool = (value: string | null | undefined, fallback: boolean) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
};

const mapRecordsToSeoSettings = (
  records: Awaited<ReturnType<typeof getSettingsByKeysQuery>>,
): SeoSettingsData => {
  const values = new Map(
    records.map((record) => [record.key, record.value || ""]),
  );

  return {
    defaultTitle:
      values.get(SEO_SETTING_META.defaultTitle.key) ||
      SEO_SETTING_META.defaultTitle.fallback,
    titleTemplate:
      values.get(SEO_SETTING_META.titleTemplate.key) ||
      SEO_SETTING_META.titleTemplate.fallback,
    metaDescription:
      values.get(SEO_SETTING_META.metaDescription.key) ||
      SEO_SETTING_META.metaDescription.fallback,
    keywords:
      values.get(SEO_SETTING_META.keywords.key) ||
      SEO_SETTING_META.keywords.fallback,
    robotsIndex: (values.get(SEO_SETTING_META.robotsIndex.key) ||
      SEO_SETTING_META.robotsIndex.fallback) as SeoSettingsData["robotsIndex"],
    robotsFollow: (values.get(SEO_SETTING_META.robotsFollow.key) ||
      SEO_SETTING_META.robotsFollow
        .fallback) as SeoSettingsData["robotsFollow"],
    twitterCard: (values.get(SEO_SETTING_META.twitterCard.key) ||
      SEO_SETTING_META.twitterCard.fallback) as SeoSettingsData["twitterCard"],
    sitemapEnabled: toBool(
      values.get(SEO_SETTING_META.sitemapEnabled.key),
      true,
    ),
    includePagesInSitemap: toBool(
      values.get(SEO_SETTING_META.includePagesInSitemap.key),
      true,
    ),
    includePostsInSitemap: toBool(
      values.get(SEO_SETTING_META.includePostsInSitemap.key),
      true,
    ),
  };
};

const mapRecordsToSearchSettings = (
  records: Awaited<ReturnType<typeof getSettingsByKeysQuery>>,
): SearchSettingsData => {
  const values = new Map(
    records.map((record) => [record.key, record.value || ""]),
  );

  return {
    integratedSearchEnabled: toBool(
      values.get(SEARCH_SETTING_META.integratedSearchEnabled.key),
      true,
    ),
    documentSearchEnabled: toBool(
      values.get(SEARCH_SETTING_META.documentSearchEnabled.key),
      true,
    ),
    commentSearchEnabled: toBool(
      values.get(SEARCH_SETTING_META.commentSearchEnabled.key),
      true,
    ),
    attachmentSearchEnabled: toBool(
      values.get(SEARCH_SETTING_META.attachmentSearchEnabled.key),
      true,
    ),
    userSearchEnabled: toBool(
      values.get(SEARCH_SETTING_META.userSearchEnabled.key),
      false,
    ),
    extensionSearchEnabled: toBool(
      values.get(SEARCH_SETTING_META.extensionSearchEnabled.key),
      true,
    ),
    includeUserEmail: toBool(
      values.get(SEARCH_SETTING_META.includeUserEmail.key),
      false,
    ),
    defaultResultLimit: Number(
      values.get(SEARCH_SETTING_META.defaultResultLimit.key) ||
        SEARCH_SETTING_META.defaultResultLimit.fallback,
    ),
    minSearchLength: Number(
      values.get(SEARCH_SETTING_META.minSearchLength.key) ||
        SEARCH_SETTING_META.minSearchLength.fallback,
    ),
  };
};

const toSettingSeeds = (data: SiteSettingsData): SettingSeed[] => {
  return [
    {
      key: SITE_SETTING_META.appName.key,
      value: data.appName,
      group: "site",
      label: SITE_SETTING_META.appName.label,
      description: "사이트 영문 시스템 이름입니다.",
      isPublic: SITE_SETTING_META.appName.isPublic,
    },
    {
      key: SITE_SETTING_META.projectName.key,
      value: data.projectName,
      group: "site",
      label: SITE_SETTING_META.projectName.label,
      description: "프로젝트 내부 식별 이름입니다.",
      isPublic: SITE_SETTING_META.projectName.isPublic,
    },
    {
      key: SITE_SETTING_META.projectTitle.key,
      value: data.projectTitle,
      group: "site",
      label: SITE_SETTING_META.projectTitle.label,
      description: "사용자 화면에 노출되는 사이트 표시명입니다.",
      isPublic: SITE_SETTING_META.projectTitle.isPublic,
    },
    {
      key: SITE_SETTING_META.siteUrl.key,
      value: data.siteUrl,
      group: "site",
      label: SITE_SETTING_META.siteUrl.label,
      description: "사이트 대표 URL입니다.",
      isPublic: SITE_SETTING_META.siteUrl.isPublic,
    },
    {
      key: SITE_SETTING_META.apiBaseUrl.key,
      value: data.apiBaseUrl || "",
      group: "site",
      label: SITE_SETTING_META.apiBaseUrl.label,
      description: "외부에서 사용할 API 기본 URL입니다.",
      isPublic: SITE_SETTING_META.apiBaseUrl.isPublic,
    },
    {
      key: SITE_SETTING_META.logoPath.key,
      value: data.logoPath || "",
      group: "site",
      label: SITE_SETTING_META.logoPath.label,
      description: "사이트 로고 이미지 경로입니다.",
      isPublic: SITE_SETTING_META.logoPath.isPublic,
    },
    {
      key: SITE_SETTING_META.faviconPath.key,
      value: data.faviconPath || "",
      group: "site",
      label: SITE_SETTING_META.faviconPath.label,
      description: "브라우저 탭과 북마크에 사용할 파비콘 경로입니다.",
      isPublic: SITE_SETTING_META.faviconPath.isPublic,
    },
    {
      key: SITE_SETTING_META.defaultOgImage.key,
      value: data.defaultOgImage || "",
      group: "site",
      label: SITE_SETTING_META.defaultOgImage.label,
      description: "공유 메타 태그에 사용할 기본 OG 이미지 경로입니다.",
      isPublic: SITE_SETTING_META.defaultOgImage.isPublic,
    },
    {
      key: SITE_SETTING_META.adminLayout.key,
      value: data.adminLayout || SITE_SETTING_META.adminLayout.fallback,
      group: "site",
      label: SITE_SETTING_META.adminLayout.label,
      description: "관리자 화면에서 사용할 레이아웃 스킨입니다.",
      isPublic: SITE_SETTING_META.adminLayout.isPublic,
    },
    {
      key: SITE_SETTING_META.userLayout.key,
      value: data.userLayout || SITE_SETTING_META.userLayout.fallback,
      group: "site",
      label: SITE_SETTING_META.userLayout.label,
      description: "사용자 마이페이지에서 사용할 레이아웃 스킨입니다.",
      isPublic: SITE_SETTING_META.userLayout.isPublic,
    },
  ];
};

const toSeoSettingSeeds = (data: SeoSettingsData): SettingSeed[] => {
  return [
    {
      key: SEO_SETTING_META.defaultTitle.key,
      value: data.defaultTitle,
      group: "seo",
      label: SEO_SETTING_META.defaultTitle.label,
      description: "사이트 기본 메타 제목입니다.",
      isPublic: SEO_SETTING_META.defaultTitle.isPublic,
    },
    {
      key: SEO_SETTING_META.titleTemplate.key,
      value: data.titleTemplate,
      group: "seo",
      label: SEO_SETTING_META.titleTemplate.label,
      description: "%s 자리에 페이지 제목을 넣어 최종 title을 만듭니다.",
      isPublic: SEO_SETTING_META.titleTemplate.isPublic,
    },
    {
      key: SEO_SETTING_META.metaDescription.key,
      value: data.metaDescription,
      group: "seo",
      label: SEO_SETTING_META.metaDescription.label,
      description: "문서별 설명이 없을 때 사용할 기본 메타 설명입니다.",
      isPublic: SEO_SETTING_META.metaDescription.isPublic,
    },
    {
      key: SEO_SETTING_META.keywords.key,
      value: data.keywords || "",
      group: "seo",
      label: SEO_SETTING_META.keywords.label,
      description: "쉼표로 구분한 기본 키워드입니다.",
      isPublic: SEO_SETTING_META.keywords.isPublic,
    },
    {
      key: SEO_SETTING_META.robotsIndex.key,
      value: data.robotsIndex,
      group: "seo",
      label: SEO_SETTING_META.robotsIndex.label,
      description: "검색엔진 색인 허용 여부입니다.",
      isPublic: SEO_SETTING_META.robotsIndex.isPublic,
    },
    {
      key: SEO_SETTING_META.robotsFollow.key,
      value: data.robotsFollow,
      group: "seo",
      label: SEO_SETTING_META.robotsFollow.label,
      description: "검색엔진 링크 추적 허용 여부입니다.",
      isPublic: SEO_SETTING_META.robotsFollow.isPublic,
    },
    {
      key: SEO_SETTING_META.twitterCard.key,
      value: data.twitterCard,
      group: "seo",
      label: SEO_SETTING_META.twitterCard.label,
      description: "소셜 공유 시 사용할 Twitter 카드 타입입니다.",
      isPublic: SEO_SETTING_META.twitterCard.isPublic,
    },
    {
      key: SEO_SETTING_META.sitemapEnabled.key,
      value: String(data.sitemapEnabled),
      group: "seo",
      label: SEO_SETTING_META.sitemapEnabled.label,
      description: "동적 사이트맵 생성 여부입니다.",
      isPublic: SEO_SETTING_META.sitemapEnabled.isPublic,
    },
    {
      key: SEO_SETTING_META.includePagesInSitemap.key,
      value: String(data.includePagesInSitemap),
      group: "seo",
      label: SEO_SETTING_META.includePagesInSitemap.label,
      description: "공개 페이지 메뉴를 사이트맵에 포함할지 정합니다.",
      isPublic: SEO_SETTING_META.includePagesInSitemap.isPublic,
    },
    {
      key: SEO_SETTING_META.includePostsInSitemap.key,
      value: String(data.includePostsInSitemap),
      group: "seo",
      label: SEO_SETTING_META.includePostsInSitemap.label,
      description: "공개 게시글을 사이트맵에 포함할지 정합니다.",
      isPublic: SEO_SETTING_META.includePostsInSitemap.isPublic,
    },
  ];
};

const toSearchSettingSeeds = (data: SearchSettingsData): SettingSeed[] => {
  return (
    Object.keys(SEARCH_SETTING_META) as Array<keyof typeof SEARCH_SETTING_META>
  ).map((name) => {
    const meta = SEARCH_SETTING_META[name];
    return {
      key: meta.key,
      value: String(data[name]),
      group: "search",
      label: meta.label,
      description: "통합검색 동작 정책입니다.",
      isPublic: meta.isPublic,
    };
  });
};

const isFileLike = (value: FormDataEntryValue | null): value is File => {
  return (
    typeof value === "object" &&
    value !== null &&
    "arrayBuffer" in value &&
    "size" in value &&
    "name" in value
  );
};

const saveSiteImage = async (file: File, fieldLabel: string) => {
  if (!file.size) return null;
  if (file.size > SITE_IMAGE_MAX_SIZE) {
    throw new Error(
      `${fieldLabel}는 5MB 이하의 이미지만 업로드할 수 있습니다.`,
    );
  }

  const ext = path.extname(file.name).toLowerCase();
  if (!SITE_IMAGE_ALLOWED_EXTS.has(ext)) {
    throw new Error(`${fieldLabel}의 파일 확장자가 허용되지 않습니다.`);
  }

  if (file.type && !SITE_IMAGE_ALLOWED_MIMES.has(file.type)) {
    throw new Error(`${fieldLabel}의 파일 형식이 허용되지 않습니다.`);
  }

  const bytes = await file.arrayBuffer();
  const fileBuffer = Buffer.from(bytes);
  const detectedMimeType = detectMimeTypeFromBuffer(fileBuffer);

  if (
    !detectedMimeType ||
    !SITE_IMAGE_ALLOWED_MIMES.has(detectedMimeType) ||
    !isMimeCompatibleWithExtension(ext, detectedMimeType)
  ) {
    throw new Error(
      `${fieldLabel}의 실제 파일 형식이 확장자와 일치하지 않습니다.`,
    );
  }

  try {
    await assertDecodableImage(fileBuffer, detectedMimeType);
  } catch {
    throw new Error(`${fieldLabel} 이미지를 정상적으로 해석할 수 없습니다.`);
  }

  const fileUuid = uuidv4();
  const date = new Date();
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const fileName = `${fileUuid}${ext}`;
  const relativeDir = path.join("settings", year, month);
  const uploadDir = path.join(
    /* turbopackIgnore: true */ process.cwd(),
    "storage",
    "uploads",
    relativeDir,
  );

  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, fileName), fileBuffer);

  return `/storage/uploads/settings/${year}/${month}/${fileName}`;
};

export const getSiteSettingsAdminAction = async (): Promise<
  ActionState<SiteSettingsData>
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
    const cached = await readSiteSettingsCache();
    if (cached) {
      return {
        success: true,
        type: "success",
        message: "사이트 기본정보를 불러왔습니다.",
        data: cached,
      };
    }

    const records = await getSettingsByKeysQuery(SITE_SETTING_KEYS);
    const data = mapRecordsToSiteSettings(records);
    await writeSiteSettingsCache(data);

    return {
      success: true,
      type: "success",
      message: "사이트 기본정보를 불러왔습니다.",
      data,
    };
  } catch (error) {
    console.error("getSiteSettingsAdminAction Error:", error);
    return {
      success: false,
      type: "error",
      message: "사이트 기본정보를 불러오지 못했습니다.",
    };
  }
};

export const getPublicSiteSettingsAction = async (): Promise<
  ActionState<SiteSettingsData>
> => {
  try {
    const records = await getSettingsByKeysQuery(SITE_SETTING_KEYS);

    return {
      success: true,
      type: "success",
      message: "사이트 기본정보를 불러왔습니다.",
      data: mapRecordsToSiteSettings(records),
    };
  } catch (error) {
    console.error("getPublicSiteSettingsAction Error:", error);
    return {
      success: true,
      type: "success",
      message: "기본 사이트 설정을 사용합니다.",
      data: mapRecordsToSiteSettings([]),
    };
  }
};

export const getPublicSiteUrlAction = async (): Promise<
  ActionState<{ siteUrl: string }>
> => {
  try {
    const records = await getSettingsByKeysQuery([
      SITE_SETTING_META.siteUrl.key,
    ]);
    const siteUrl =
      records
        .find((record) => record.key === SITE_SETTING_META.siteUrl.key)
        ?.value?.trim() || "";

    return {
      success: true,
      type: "success",
      message: "사이트 대표 URL을 불러왔습니다.",
      data: { siteUrl },
    };
  } catch (error) {
    console.error("getPublicSiteUrlAction Error:", error);
    return {
      success: false,
      type: "error",
      message: "사이트 대표 URL을 불러오지 못했습니다.",
      data: { siteUrl: "" },
    };
  }
};

export const getSeoSettingsAdminAction = async (): Promise<
  ActionState<SeoSettingsData>
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
    const cached = await readSeoSettingsCache();
    if (cached) {
      return {
        success: true,
        type: "success",
        message: "SEO 설정을 불러왔습니다.",
        data: cached,
      };
    }

    const records = await getSettingsByKeysQuery(SEO_SETTING_KEYS);
    const data = mapRecordsToSeoSettings(records);
    await writeSeoSettingsCache(data);

    return {
      success: true,
      type: "success",
      message: "SEO 설정을 불러왔습니다.",
      data,
    };
  } catch (error) {
    console.error("getSeoSettingsAdminAction Error:", error);
    return {
      success: false,
      type: "error",
      message: "SEO 설정을 불러오지 못했습니다.",
    };
  }
};

export const getSearchSettingsAdminAction = async (): Promise<
  ActionState<SearchSettingsData>
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
    const cached = await readSearchSettingsCache();
    if (cached) {
      return {
        success: true,
        type: "success",
        message: "검색 설정을 불러왔습니다.",
        data: cached,
      };
    }

    const records = await getSettingsByKeysQuery(SEARCH_SETTING_KEYS);
    const data = mapRecordsToSearchSettings(records);
    await writeSearchSettingsCache(data);

    return {
      success: true,
      type: "success",
      message: "검색 설정을 불러왔습니다.",
      data,
    };
  } catch (error) {
    console.error("getSearchSettingsAdminAction Error:", error);
    return {
      success: false,
      type: "error",
      message: "검색 설정을 불러오지 못했습니다.",
    };
  }
};

export const getSeoSettingsRuntimeAction =
  async (): Promise<SeoSettingsData> => {
    const cached = await readSeoSettingsCache();
    if (cached) return cached;

    try {
      const records = await getSettingsByKeysQuery(SEO_SETTING_KEYS);
      const data = mapRecordsToSeoSettings(records);
      await writeSeoSettingsCache(data);

      return data;
    } catch (error) {
      console.error("getSeoSettingsRuntimeAction Error:", error);
      return mapRecordsToSeoSettings([]);
    }
  };

export const getSearchSettingsRuntimeAction =
  async (): Promise<SearchSettingsData> => {
    const cached = await readSearchSettingsCache();
    if (cached) return cached;

    try {
      const records = await getSettingsByKeysQuery(SEARCH_SETTING_KEYS);
      const data = mapRecordsToSearchSettings(records);
      await writeSearchSettingsCache(data);

      return data;
    } catch (error) {
      console.error("getSearchSettingsRuntimeAction Error:", error);
      return mapRecordsToSearchSettings([]);
    }
  };

export const getPublicSitemapEntriesAction = async () => {
  try {
    const [seoSettings, siteSettings] = await Promise.all([
      getSeoSettingsRuntimeAction(),
      getPublicSiteSettingsAction(),
    ]);

    if (!seoSettings.sitemapEnabled) {
      return {
        success: true,
        type: "success",
        message: "사이트맵이 비활성화되어 있습니다.",
        data: {
          siteUrl: siteSettings.data?.siteUrl || "http://localhost:3000",
          entries: [],
        },
      };
    }

    const [pageEntries, postEntries] = await Promise.all([
      seoSettings.includePagesInSitemap
        ? getPublicPageSitemapEntriesQuery()
        : Promise.resolve([]),
      seoSettings.includePostsInSitemap
        ? getPublicPostSitemapEntriesQuery()
        : Promise.resolve([]),
    ]);

    const entries = [...pageEntries, ...postEntries];
    const uniqueEntries = Array.from(
      new Map(entries.map((entry) => [entry.url, entry])).values(),
    );

    return {
      success: true,
      type: "success",
      message: "사이트맵 데이터를 불러왔습니다.",
      data: {
        siteUrl: siteSettings.data?.siteUrl || "http://localhost:3000",
        entries: uniqueEntries,
      },
    };
  } catch (error) {
    console.error("getPublicSitemapEntriesAction Error:", error);
    return {
      success: true,
      type: "success",
      message: "사이트맵 기본값을 사용합니다.",
      data: { siteUrl: "http://localhost:3000", entries: [] },
    };
  }
};

export const updateSiteSettingsAdminAction = async (
  formData: FormData,
): Promise<ActionState<SiteSettingsData>> => {
  const sessionInfo = await getUserSessionAction();

  if (!sessionInfo?.data?.isAdmin) {
    return {
      success: false,
      type: "error",
      message: "관리자 권한이 필요합니다.",
    };
  }

  const formPayload = {
    appName: formData.get("appName"),
    projectName: formData.get("projectName"),
    projectTitle: formData.get("projectTitle"),
    siteUrl: formData.get("siteUrl"),
    apiBaseUrl: formData.get("apiBaseUrl"),
    logoPath: formData.get("logoPath"),
    faviconPath: formData.get("faviconPath"),
    defaultOgImage: formData.get("defaultOgImage"),
    adminLayout: formData.get("adminLayout"),
    userLayout: formData.get("userLayout"),
  };

  const validation = validateForm(SiteSettingsSchema, formPayload);
  if (!validation.isValid) return validation.errorResponse;

  try {
    const nextSettings = { ...validation.data };
    const uploadFields = [
      { formName: "logoFile", dataKey: "logoPath", label: "로고 이미지" },
      { formName: "faviconFile", dataKey: "faviconPath", label: "파비콘" },
      {
        formName: "defaultOgImageFile",
        dataKey: "defaultOgImage",
        label: "기본 OG 이미지",
      },
    ] as const;

    for (const field of uploadFields) {
      const file = formData.get(field.formName);
      if (!isFileLike(file) || file.size === 0) continue;

      const savedPath = await saveSiteImage(file, field.label);
      if (savedPath) nextSettings[field.dataKey] = savedPath;
    }

    await upsertSettingsQuery(toSettingSeeds(nextSettings));
    await writeSiteSettingsCache(nextSettings);
    const cookieStore = await cookies();
    cookieStore.set("pending-admin-layout", nextSettings.adminLayout, {
      path: "/admin",
      maxAge: 60,
      sameSite: "lax",
    });
    revalidatePath("/admin", "layout");
    revalidatePath("/admin");
    revalidatePath("/admin/settings");
    revalidatePath("/user", "layout");
    revalidatePath("/user");
    revalidatePath("/user/userUpdate");
    revalidatePath("/user/preferences");
    revalidatePath("/user/userDelete");

    return {
      success: true,
      type: "success",
      message: "사이트 기본정보가 저장되었습니다.",
      data: nextSettings,
    };
  } catch (error) {
    console.error("updateSiteSettingsAdminAction Error:", error);
    return {
      success: false,
      type: "error",
      message:
        error instanceof Error
          ? error.message
          : "사이트 기본정보 저장에 실패했습니다.",
    };
  }
};

export const updateSeoSettingsAdminAction = async (
  formData: FormData,
): Promise<ActionState<SeoSettingsData>> => {
  const sessionInfo = await getUserSessionAction();

  if (!sessionInfo?.data?.isAdmin) {
    return {
      success: false,
      type: "error",
      message: "관리자 권한이 필요합니다.",
    };
  }

  const formPayload = {
    defaultTitle: formData.get("defaultTitle"),
    titleTemplate: formData.get("titleTemplate"),
    metaDescription: formData.get("metaDescription"),
    keywords: formData.get("keywords"),
    robotsIndex: formData.get("robotsIndex"),
    robotsFollow: formData.get("robotsFollow"),
    twitterCard: formData.get("twitterCard"),
    sitemapEnabled: formData.has("sitemapEnabled"),
    includePagesInSitemap: formData.has("includePagesInSitemap"),
    includePostsInSitemap: formData.has("includePostsInSitemap"),
  };

  const validation = validateForm(SeoSettingsSchema, formPayload);
  if (!validation.isValid) return validation.errorResponse;

  try {
    await upsertSettingsQuery(toSeoSettingSeeds(validation.data));
    await writeSeoSettingsCache(validation.data);

    return {
      success: true,
      type: "success",
      message: "SEO 설정이 저장되었습니다.",
      data: validation.data,
    };
  } catch (error) {
    console.error("updateSeoSettingsAdminAction Error:", error);
    return {
      success: false,
      type: "error",
      message: "SEO 설정 저장에 실패했습니다.",
    };
  }
};

export const updateSearchSettingsAdminAction = async (
  formData: FormData,
): Promise<ActionState<SearchSettingsData>> => {
  const sessionInfo = await getUserSessionAction();

  if (!sessionInfo?.data?.isAdmin) {
    return {
      success: false,
      type: "error",
      message: "관리자 권한이 필요합니다.",
    };
  }

  const formPayload = {
    integratedSearchEnabled: formData.has("integratedSearchEnabled"),
    documentSearchEnabled: formData.has("documentSearchEnabled"),
    commentSearchEnabled: formData.has("commentSearchEnabled"),
    attachmentSearchEnabled: formData.has("attachmentSearchEnabled"),
    userSearchEnabled: formData.has("userSearchEnabled"),
    extensionSearchEnabled: formData.has("extensionSearchEnabled"),
    includeUserEmail: formData.has("includeUserEmail"),
    defaultResultLimit: formData.get("defaultResultLimit"),
    minSearchLength: formData.get("minSearchLength"),
  };

  const validation = validateForm(SearchSettingsSchema, formPayload);
  if (!validation.isValid) return validation.errorResponse;

  try {
    await upsertSettingsQuery(toSearchSettingSeeds(validation.data));
    await writeSearchSettingsCache(validation.data);

    return {
      success: true,
      type: "success",
      message: "검색 설정이 저장되었습니다.",
      data: validation.data,
    };
  } catch (error) {
    console.error("updateSearchSettingsAdminAction Error:", error);
    return {
      success: false,
      type: "error",
      message: "검색 설정 저장에 실패했습니다.",
    };
  }
};
