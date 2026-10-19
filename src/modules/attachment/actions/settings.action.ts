"use server";

import { getUserSessionAction } from "@/modules/user/actions/user.action";
import { validateForm } from "@utils/validation/formValidator";
import type { ActionResponse as ActionState } from "@/core/types/actions";
import { UploadSettingsSchema, type UploadSettingsData } from "./settings.type";
import {
  getSettingsByKeysQuery,
  upsertSettingsQuery,
  type SettingSeed,
} from "@/core/utils/settings/settings.query";
import redisClient from "@utils/redis/redis";
const SITE_SETTINGS_CACHE_TTL = 60 * 60 * 24;
const toBool = (value: string | null | undefined, fallback: boolean) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
};

const UPLOAD_SETTINGS_CACHE_KEY = "app:settings:upload";

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
    fallback:
      ".png, .jpg, .jpeg, .gif, .webp, .avif, .mp3, .ogg, .mp4, .webm, .mov, .zip",
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

const UPLOAD_SETTING_KEYS = Object.values(UPLOAD_SETTING_META).map(
  (item) => item.key,
);

const readUploadSettingsCache =
  async (): Promise<UploadSettingsData | null> => {
    try {
      const cached = await redisClient.get(UPLOAD_SETTINGS_CACHE_KEY);
      if (!cached) return null;

      return UploadSettingsSchema.parse(JSON.parse(cached));
    } catch (error) {
      console.warn("readUploadSettingsCache Warning:", error);
      return null;
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

const mapRecordsToUploadSettings = (
  records: Awaited<ReturnType<typeof getSettingsByKeysQuery>>,
): UploadSettingsData => {
  const values = new Map(
    records.map((record) => [record.key, record.value || ""]),
  );

  return {
    maxUploadSizeMb: Number(
      values.get(UPLOAD_SETTING_META.maxUploadSizeMb.key) ||
        UPLOAD_SETTING_META.maxUploadSizeMb.fallback,
    ),
    userStorageLimitMb: Number(
      values.get(UPLOAD_SETTING_META.userStorageLimitMb.key) ||
        UPLOAD_SETTING_META.userStorageLimitMb.fallback,
    ),
    maxImageWidth: Number(
      values.get(UPLOAD_SETTING_META.maxImageWidth.key) ||
        UPLOAD_SETTING_META.maxImageWidth.fallback,
    ),
    maxImageHeight: Number(
      values.get(UPLOAD_SETTING_META.maxImageHeight.key) ||
        UPLOAD_SETTING_META.maxImageHeight.fallback,
    ),
    imageQuality: Number(
      values.get(UPLOAD_SETTING_META.imageQuality.key) ||
        UPLOAD_SETTING_META.imageQuality.fallback,
    ),
    imageOutputFormat: (values.get(UPLOAD_SETTING_META.imageOutputFormat.key) ||
      UPLOAD_SETTING_META.imageOutputFormat
        .fallback) as UploadSettingsData["imageOutputFormat"],
    allowedExtensions:
      values.get(UPLOAD_SETTING_META.allowedExtensions.key) ||
      UPLOAD_SETTING_META.allowedExtensions.fallback,
    enableImageProcessing: toBool(
      values.get(UPLOAD_SETTING_META.enableImageProcessing.key),
      true,
    ),
    stripImageMetadata: toBool(
      values.get(UPLOAD_SETTING_META.stripImageMetadata.key),
      true,
    ),
    verifyMimeType: toBool(
      values.get(UPLOAD_SETTING_META.verifyMimeType.key),
      true,
    ),
    restrictProfileImage: toBool(
      values.get(UPLOAD_SETTING_META.restrictProfileImage.key),
      true,
    ),
    allowVideo: toBool(values.get(UPLOAD_SETTING_META.allowVideo.key), true),
    allowArchive: toBool(
      values.get(UPLOAD_SETTING_META.allowArchive.key),
      true,
    ),
  };
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

export const getUploadSettingsAdminAction = async (): Promise<
  ActionState<UploadSettingsData>
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
    return {
      success: false,
      type: "error",
      message: "업로드 설정을 불러오지 못했습니다.",
    };
  }
};

export const getUploadSettingsRuntimeAction =
  async (): Promise<UploadSettingsData> => {
    const cached = await readUploadSettingsCache();
    if (cached) return cached;

    const records = await getSettingsByKeysQuery(UPLOAD_SETTING_KEYS);
    const data = mapRecordsToUploadSettings(records);
    await writeUploadSettingsCache(data);

    return data;
  };

export const updateUploadSettingsAdminAction = async (
  formData: FormData,
): Promise<ActionState<UploadSettingsData>> => {
  const sessionInfo = await getUserSessionAction();

  if (!sessionInfo?.data?.isAdmin) {
    return {
      success: false,
      type: "error",
      message: "관리자 권한이 필요합니다.",
    };
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
    return {
      success: false,
      type: "error",
      message: "업로드 설정 저장에 실패했습니다.",
    };
  }
};
