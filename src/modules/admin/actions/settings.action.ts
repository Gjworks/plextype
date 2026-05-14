"use server";

import { getUserSessionAction } from "@/modules/user/actions/user.action";
import { validateForm } from "@utils/validation/formValidator";
import { ActionState, SiteSettingsData, SiteSettingsSchema } from "./_type";
import { getSettingsByKeysQuery, SettingSeed, upsertSettingsQuery } from "./settings.query";
import redisClient from "@utils/redis/redis";

const SITE_SETTINGS_CACHE_KEY = "app:settings:site";
const SITE_SETTINGS_CACHE_TTL = 60 * 60 * 24;

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
} as const;

const SITE_SETTING_KEYS = Object.values(SITE_SETTING_META).map((item) => item.key);

const getEnvFallback = (name: keyof typeof SITE_SETTING_META) => {
  const meta = SITE_SETTING_META[name];
  return process.env[meta.env] || meta.fallback;
};

const mapRecordsToSiteSettings = (records: Awaited<ReturnType<typeof getSettingsByKeysQuery>>): SiteSettingsData => {
  const values = new Map(records.map((record) => [record.key, record.value || ""]));

  return {
    appName: values.get(SITE_SETTING_META.appName.key) || getEnvFallback("appName"),
    projectName: values.get(SITE_SETTING_META.projectName.key) || getEnvFallback("projectName"),
    projectTitle: values.get(SITE_SETTING_META.projectTitle.key) || getEnvFallback("projectTitle"),
    siteUrl: values.get(SITE_SETTING_META.siteUrl.key) || getEnvFallback("siteUrl"),
    apiBaseUrl: values.get(SITE_SETTING_META.apiBaseUrl.key) || getEnvFallback("apiBaseUrl"),
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
  ];
};

export const getSiteSettingsAdminAction = async (): Promise<ActionState<SiteSettingsData>> => {
  const sessionInfo = await getUserSessionAction();

  if (!sessionInfo?.data?.isAdmin) {
    return { success: false, type: "error", message: "관리자 권한이 필요합니다." };
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
    return { success: false, type: "error", message: "사이트 기본정보를 불러오지 못했습니다." };
  }
};

export const getPublicSiteSettingsAction = async (): Promise<ActionState<SiteSettingsData>> => {
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

export const updateSiteSettingsAdminAction = async (formData: FormData): Promise<ActionState<SiteSettingsData>> => {
  const sessionInfo = await getUserSessionAction();

  if (!sessionInfo?.data?.isAdmin) {
    return { success: false, type: "error", message: "관리자 권한이 필요합니다." };
  }

  const formPayload = {
    appName: formData.get("appName"),
    projectName: formData.get("projectName"),
    projectTitle: formData.get("projectTitle"),
    siteUrl: formData.get("siteUrl"),
    apiBaseUrl: formData.get("apiBaseUrl"),
  };

  const validation = validateForm(SiteSettingsSchema, formPayload);
  if (!validation.isValid) return validation.errorResponse;

  try {
    await upsertSettingsQuery(toSettingSeeds(validation.data));
    await writeSiteSettingsCache(validation.data);

    return {
      success: true,
      type: "success",
      message: "사이트 기본정보가 저장되었습니다.",
      data: validation.data,
    };
  } catch (error) {
    console.error("updateSiteSettingsAdminAction Error:", error);
    return { success: false, type: "error", message: "사이트 기본정보 저장에 실패했습니다." };
  }
};
