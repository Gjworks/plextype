"use server";

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { getUserSessionAction } from "@/modules/user/actions/user.action";
import { validateForm } from "@utils/validation/formValidator";
import { ActionState, SiteSettingsData, SiteSettingsSchema, UploadSettingsData, UploadSettingsSchema } from "./_type";
import { getSettingsByKeysQuery, SettingSeed, upsertSettingsQuery } from "./settings.query";
import redisClient from "@utils/redis/redis";
import { v4 as uuidv4 } from "uuid";

const SITE_SETTINGS_CACHE_KEY = "app:settings:site";
const UPLOAD_SETTINGS_CACHE_KEY = "app:settings:upload";
const SITE_SETTINGS_CACHE_TTL = 60 * 60 * 24;
const SITE_IMAGE_MAX_SIZE = 5 * 1024 * 1024;
const SITE_IMAGE_ALLOWED_EXTS = new Set([".png", ".jpg", ".jpeg", ".gif", ".avif", ".webp", ".ico"]);
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
} as const;

const SITE_SETTING_KEYS = Object.values(SITE_SETTING_META).map((item) => item.key);

const UPLOAD_SETTING_META = {
  maxUploadSizeMb: {
    key: "upload.maxUploadSizeMb",
    label: "파일당 MB",
    fallback: "20",
    isPublic: false,
  },
  userStorageLimitMb: {
    key: "upload.userStorageLimitMb",
    label: "사용자별 MB",
    fallback: "1024",
    isPublic: false,
  },
  maxImageWidth: {
    key: "upload.maxImageWidth",
    label: "이미지 최대 너비",
    fallback: "2560",
    isPublic: false,
  },
  maxImageHeight: {
    key: "upload.maxImageHeight",
    label: "이미지 최대 높이",
    fallback: "2560",
    isPublic: false,
  },
  imageQuality: {
    key: "upload.imageQuality",
    label: "이미지 품질",
    fallback: "85",
    isPublic: false,
  },
  imageOutputFormat: {
    key: "upload.imageOutputFormat",
    label: "이미지 출력 포맷",
    fallback: "original",
    isPublic: false,
  },
  allowedExtensions: {
    key: "upload.allowedExtensions",
    label: "허용 확장자",
    fallback: ".png, .jpg, .jpeg, .gif, .webp, .avif, .mp3, .ogg, .mp4, .webm, .mov, .zip",
    isPublic: false,
  },
  enableImageProcessing: {
    key: "upload.enableImageProcessing",
    label: "이미지 처리 사용",
    fallback: "true",
    isPublic: false,
  },
  stripImageMetadata: {
    key: "upload.stripImageMetadata",
    label: "이미지 메타데이터 제거",
    fallback: "true",
    isPublic: false,
  },
  verifyMimeType: {
    key: "upload.verifyMimeType",
    label: "MIME 타입 검증",
    fallback: "true",
    isPublic: false,
  },
  restrictProfileImage: {
    key: "upload.restrictProfileImage",
    label: "프로필 이미지 제한",
    fallback: "true",
    isPublic: false,
  },
  allowVideo: {
    key: "upload.allowVideo",
    label: "동영상 허용",
    fallback: "true",
    isPublic: false,
  },
  allowArchive: {
    key: "upload.allowArchive",
    label: "압축파일 허용",
    fallback: "true",
    isPublic: false,
  },
} as const;

const UPLOAD_SETTING_KEYS = Object.values(UPLOAD_SETTING_META).map((item) => item.key);

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
    logoPath: values.get(SITE_SETTING_META.logoPath.key) || getEnvFallback("logoPath"),
    faviconPath: values.get(SITE_SETTING_META.faviconPath.key) || getEnvFallback("faviconPath"),
    defaultOgImage: values.get(SITE_SETTING_META.defaultOgImage.key) || getEnvFallback("defaultOgImage"),
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

const readUploadSettingsCache = async (): Promise<UploadSettingsData | null> => {
  try {
    const cached = await redisClient.get(UPLOAD_SETTINGS_CACHE_KEY);
    if (!cached) return null;

    return UploadSettingsSchema.parse(JSON.parse(cached));
  } catch (error) {
    console.warn("readUploadSettingsCache Warning:", error);
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

const writeUploadSettingsCache = async (data: UploadSettingsData) => {
  try {
    await redisClient.set(
      UPLOAD_SETTINGS_CACHE_KEY,
      JSON.stringify(data),
      "EX",
      SITE_SETTINGS_CACHE_TTL,
    );
  } catch (error) {
    console.warn("writeUploadSettingsCache Warning:", error);
  }
};

const toBool = (value: string | null | undefined, fallback: boolean) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
};

const mapRecordsToUploadSettings = (records: Awaited<ReturnType<typeof getSettingsByKeysQuery>>): UploadSettingsData => {
  const values = new Map(records.map((record) => [record.key, record.value || ""]));

  return {
    maxUploadSizeMb: Number(values.get(UPLOAD_SETTING_META.maxUploadSizeMb.key) || UPLOAD_SETTING_META.maxUploadSizeMb.fallback),
    userStorageLimitMb: Number(values.get(UPLOAD_SETTING_META.userStorageLimitMb.key) || UPLOAD_SETTING_META.userStorageLimitMb.fallback),
    maxImageWidth: Number(values.get(UPLOAD_SETTING_META.maxImageWidth.key) || UPLOAD_SETTING_META.maxImageWidth.fallback),
    maxImageHeight: Number(values.get(UPLOAD_SETTING_META.maxImageHeight.key) || UPLOAD_SETTING_META.maxImageHeight.fallback),
    imageQuality: Number(values.get(UPLOAD_SETTING_META.imageQuality.key) || UPLOAD_SETTING_META.imageQuality.fallback),
    imageOutputFormat: (values.get(UPLOAD_SETTING_META.imageOutputFormat.key) || UPLOAD_SETTING_META.imageOutputFormat.fallback) as UploadSettingsData["imageOutputFormat"],
    allowedExtensions: values.get(UPLOAD_SETTING_META.allowedExtensions.key) || UPLOAD_SETTING_META.allowedExtensions.fallback,
    enableImageProcessing: toBool(values.get(UPLOAD_SETTING_META.enableImageProcessing.key), true),
    stripImageMetadata: toBool(values.get(UPLOAD_SETTING_META.stripImageMetadata.key), true),
    verifyMimeType: toBool(values.get(UPLOAD_SETTING_META.verifyMimeType.key), true),
    restrictProfileImage: toBool(values.get(UPLOAD_SETTING_META.restrictProfileImage.key), true),
    allowVideo: toBool(values.get(UPLOAD_SETTING_META.allowVideo.key), true),
    allowArchive: toBool(values.get(UPLOAD_SETTING_META.allowArchive.key), true),
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
  ];
};

const toUploadSettingSeeds = (data: UploadSettingsData): SettingSeed[] => {
  return [
    {
      key: UPLOAD_SETTING_META.maxUploadSizeMb.key,
      value: String(data.maxUploadSizeMb),
      group: "upload",
      label: UPLOAD_SETTING_META.maxUploadSizeMb.label,
      description: "첨부파일 1개당 허용할 최대 용량입니다.",
      isPublic: UPLOAD_SETTING_META.maxUploadSizeMb.isPublic,
    },
    {
      key: UPLOAD_SETTING_META.userStorageLimitMb.key,
      value: String(data.userStorageLimitMb),
      group: "upload",
      label: UPLOAD_SETTING_META.userStorageLimitMb.label,
      description: "사용자별 전체 첨부파일 보관 용량입니다.",
      isPublic: UPLOAD_SETTING_META.userStorageLimitMb.isPublic,
    },
    {
      key: UPLOAD_SETTING_META.maxImageWidth.key,
      value: String(data.maxImageWidth),
      group: "upload",
      label: UPLOAD_SETTING_META.maxImageWidth.label,
      description: "이미지 업로드 시 기준으로 사용할 최대 너비입니다.",
      isPublic: UPLOAD_SETTING_META.maxImageWidth.isPublic,
    },
    {
      key: UPLOAD_SETTING_META.maxImageHeight.key,
      value: String(data.maxImageHeight),
      group: "upload",
      label: UPLOAD_SETTING_META.maxImageHeight.label,
      description: "이미지 업로드 시 기준으로 사용할 최대 높이입니다.",
      isPublic: UPLOAD_SETTING_META.maxImageHeight.isPublic,
    },
    {
      key: UPLOAD_SETTING_META.imageQuality.key,
      value: String(data.imageQuality),
      group: "upload",
      label: UPLOAD_SETTING_META.imageQuality.label,
      description: "이미지 압축 기능이 활성화될 때 사용할 품질 값입니다.",
      isPublic: UPLOAD_SETTING_META.imageQuality.isPublic,
    },
    {
      key: UPLOAD_SETTING_META.imageOutputFormat.key,
      value: data.imageOutputFormat,
      group: "upload",
      label: UPLOAD_SETTING_META.imageOutputFormat.label,
      description: "sharp 처리 후 저장할 이미지 포맷입니다.",
      isPublic: UPLOAD_SETTING_META.imageOutputFormat.isPublic,
    },
    {
      key: UPLOAD_SETTING_META.allowedExtensions.key,
      value: data.allowedExtensions,
      group: "upload",
      label: UPLOAD_SETTING_META.allowedExtensions.label,
      description: "업로드를 허용할 확장자 목록입니다.",
      isPublic: UPLOAD_SETTING_META.allowedExtensions.isPublic,
    },
    {
      key: UPLOAD_SETTING_META.enableImageProcessing.key,
      value: String(data.enableImageProcessing),
      group: "upload",
      label: UPLOAD_SETTING_META.enableImageProcessing.label,
      description: "이미지 리사이즈와 품질 처리를 적용합니다.",
      isPublic: UPLOAD_SETTING_META.enableImageProcessing.isPublic,
    },
    {
      key: UPLOAD_SETTING_META.stripImageMetadata.key,
      value: String(data.stripImageMetadata),
      group: "upload",
      label: UPLOAD_SETTING_META.stripImageMetadata.label,
      description: "이미지 저장 시 EXIF 등 메타데이터를 제거합니다.",
      isPublic: UPLOAD_SETTING_META.stripImageMetadata.isPublic,
    },
    {
      key: UPLOAD_SETTING_META.verifyMimeType.key,
      value: String(data.verifyMimeType),
      group: "upload",
      label: UPLOAD_SETTING_META.verifyMimeType.label,
      description: "파일 MIME 타입을 함께 검증합니다.",
      isPublic: UPLOAD_SETTING_META.verifyMimeType.isPublic,
    },
    {
      key: UPLOAD_SETTING_META.restrictProfileImage.key,
      value: String(data.restrictProfileImage),
      group: "upload",
      label: UPLOAD_SETTING_META.restrictProfileImage.label,
      description: "프로필 이미지 업로드 시 이미지 파일만 허용하는 정책입니다.",
      isPublic: UPLOAD_SETTING_META.restrictProfileImage.isPublic,
    },
    {
      key: UPLOAD_SETTING_META.allowVideo.key,
      value: String(data.allowVideo),
      group: "upload",
      label: UPLOAD_SETTING_META.allowVideo.label,
      description: "동영상 첨부파일 업로드 허용 여부입니다.",
      isPublic: UPLOAD_SETTING_META.allowVideo.isPublic,
    },
    {
      key: UPLOAD_SETTING_META.allowArchive.key,
      value: String(data.allowArchive),
      group: "upload",
      label: UPLOAD_SETTING_META.allowArchive.label,
      description: "압축파일 첨부파일 업로드 허용 여부입니다.",
      isPublic: UPLOAD_SETTING_META.allowArchive.isPublic,
    },
  ];
};

const isFileLike = (value: FormDataEntryValue | null): value is File => {
  return typeof value === "object" && value !== null && "arrayBuffer" in value && "size" in value && "name" in value;
};

const saveSiteImage = async (file: File, fieldLabel: string) => {
  if (!file.size) return null;
  if (file.size > SITE_IMAGE_MAX_SIZE) {
    throw new Error(`${fieldLabel}는 5MB 이하의 이미지만 업로드할 수 있습니다.`);
  }

  const ext = path.extname(file.name).toLowerCase();
  if (!SITE_IMAGE_ALLOWED_EXTS.has(ext)) {
    throw new Error(`${fieldLabel}의 파일 확장자가 허용되지 않습니다.`);
  }

  if (file.type && !SITE_IMAGE_ALLOWED_MIMES.has(file.type)) {
    throw new Error(`${fieldLabel}의 파일 형식이 허용되지 않습니다.`);
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
  const bytes = await file.arrayBuffer();
  await writeFile(path.join(uploadDir, fileName), Buffer.from(bytes));

  return `/storage/uploads/settings/${year}/${month}/${fileName}`;
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

export const getUploadSettingsAdminAction = async (): Promise<ActionState<UploadSettingsData>> => {
  const sessionInfo = await getUserSessionAction();

  if (!sessionInfo?.data?.isAdmin) {
    return { success: false, type: "error", message: "관리자 권한이 필요합니다." };
  }

  try {
    const cached = await readUploadSettingsCache();
    if (cached) {
      return {
        success: true,
        type: "success",
        message: "업로드 설정을 불러왔습니다.",
        data: cached,
      };
    }

    const records = await getSettingsByKeysQuery(UPLOAD_SETTING_KEYS);
    const data = mapRecordsToUploadSettings(records);
    await writeUploadSettingsCache(data);

    return {
      success: true,
      type: "success",
      message: "업로드 설정을 불러왔습니다.",
      data,
    };
  } catch (error) {
    console.error("getUploadSettingsAdminAction Error:", error);
    return { success: false, type: "error", message: "업로드 설정을 불러오지 못했습니다." };
  }
};

export const getUploadSettingsRuntimeAction = async (): Promise<UploadSettingsData> => {
  const cached = await readUploadSettingsCache();
  if (cached) return cached;

  const records = await getSettingsByKeysQuery(UPLOAD_SETTING_KEYS);
  const data = mapRecordsToUploadSettings(records);
  await writeUploadSettingsCache(data);

  return data;
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
    logoPath: formData.get("logoPath"),
    faviconPath: formData.get("faviconPath"),
    defaultOgImage: formData.get("defaultOgImage"),
  };

  const validation = validateForm(SiteSettingsSchema, formPayload);
  if (!validation.isValid) return validation.errorResponse;

  try {
    const nextSettings = { ...validation.data };
    const uploadFields = [
      { formName: "logoFile", dataKey: "logoPath", label: "로고 이미지" },
      { formName: "faviconFile", dataKey: "faviconPath", label: "파비콘" },
      { formName: "defaultOgImageFile", dataKey: "defaultOgImage", label: "기본 OG 이미지" },
    ] as const;

    for (const field of uploadFields) {
      const file = formData.get(field.formName);
      if (!isFileLike(file) || file.size === 0) continue;

      const savedPath = await saveSiteImage(file, field.label);
      if (savedPath) nextSettings[field.dataKey] = savedPath;
    }

    await upsertSettingsQuery(toSettingSeeds(nextSettings));
    await writeSiteSettingsCache(nextSettings);

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
      message: error instanceof Error ? error.message : "사이트 기본정보 저장에 실패했습니다.",
    };
  }
};

export const updateUploadSettingsAdminAction = async (formData: FormData): Promise<ActionState<UploadSettingsData>> => {
  const sessionInfo = await getUserSessionAction();

  if (!sessionInfo?.data?.isAdmin) {
    return { success: false, type: "error", message: "관리자 권한이 필요합니다." };
  }

  const formPayload = {
    maxUploadSizeMb: formData.get("maxUploadSizeMb"),
    userStorageLimitMb: formData.get("userStorageLimitMb"),
    maxImageWidth: formData.get("maxImageWidth"),
    maxImageHeight: formData.get("maxImageHeight"),
    imageQuality: formData.get("imageQuality"),
    imageOutputFormat: formData.get("imageOutputFormat"),
    allowedExtensions: formData.get("allowedExtensions"),
    enableImageProcessing: formData.has("enableImageProcessing"),
    stripImageMetadata: formData.has("stripImageMetadata"),
    verifyMimeType: formData.has("verifyMimeType"),
    restrictProfileImage: formData.has("restrictProfileImage"),
    allowVideo: formData.has("allowVideo"),
    allowArchive: formData.has("allowArchive"),
  };

  const validation = validateForm(UploadSettingsSchema, formPayload);
  if (!validation.isValid) return validation.errorResponse;

  try {
    await upsertSettingsQuery(toUploadSettingSeeds(validation.data));
    await writeUploadSettingsCache(validation.data);

    return {
      success: true,
      type: "success",
      message: "업로드 설정이 저장되었습니다.",
      data: validation.data,
    };
  } catch (error) {
    console.error("updateUploadSettingsAdminAction Error:", error);
    return { success: false, type: "error", message: "업로드 설정 저장에 실패했습니다." };
  }
};
