"use server";

import { getUserSessionAction } from "@/modules/user/actions/user.action";
import { validateForm } from "@utils/validation/formValidator";
import type { ActionResponse as ActionState } from "@/core/types/actions";
import {
  NotificationSettingsSchema,
  type NotificationSettingsData,
} from "./settings.type";
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

const NOTIFICATION_SETTINGS_CACHE_KEY = "app:settings:notification";

const NOTIFICATION_SETTING_META = {
  commentNotificationsEnabled: {
    key: "notification.commentNotificationsEnabled",
    label: "댓글 알림",
    fallback: "true",
    isPublic: false,
  },
  replyNotificationsEnabled: {
    key: "notification.replyNotificationsEnabled",
    label: "답글 알림",
    fallback: "true",
    isPublic: false,
  },
  adminContentNotificationsEnabled: {
    key: "notification.adminContentNotificationsEnabled",
    label: "관리자 처리 알림",
    fallback: "true",
    isPublic: false,
  },
  forceLogoutNotificationsEnabled: {
    key: "notification.forceLogoutNotificationsEnabled",
    label: "강제 로그아웃 알림",
    fallback: "true",
    isPublic: false,
  },
  pwaEnabled: {
    key: "notification.pwaEnabled",
    label: "PWA 사용",
    fallback: "true",
    isPublic: true,
  },
  webPushEnabled: {
    key: "notification.webPushEnabled",
    label: "Web Push 사용",
    fallback: "true",
    isPublic: true,
  },
  fcmPushEnabled: {
    key: "notification.fcmPushEnabled",
    label: "FCM 모바일 푸시 사용",
    fallback: "true",
    isPublic: false,
  },
  excludeSelfNotifications: {
    key: "notification.excludeSelfNotifications",
    label: "본인 액션 제외",
    fallback: "true",
    isPublic: false,
  },
  realtimeNotificationsEnabled: {
    key: "notification.realtimeNotificationsEnabled",
    label: "실시간 알림",
    fallback: "true",
    isPublic: false,
  },
  toastNotificationsEnabled: {
    key: "notification.toastNotificationsEnabled",
    label: "토스트 표시",
    fallback: "true",
    isPublic: false,
  },
  showNotificationThumbnails: {
    key: "notification.showNotificationThumbnails",
    label: "썸네일 표시",
    fallback: "true",
    isPublic: false,
  },
  unreadPreviewLimit: {
    key: "notification.unreadPreviewLimit",
    label: "메뉴 미리보기 개수",
    fallback: "20",
    isPublic: false,
  },
  historyPageSize: {
    key: "notification.historyPageSize",
    label: "히스토리 페이지 개수",
    fallback: "20",
    isPublic: false,
  },
  retentionDays: {
    key: "notification.retentionDays",
    label: "보관 기간",
    fallback: "90",
    isPublic: false,
  },
} as const;

const NOTIFICATION_SETTING_KEYS = Object.values(NOTIFICATION_SETTING_META).map(
  (item) => item.key,
);

const readNotificationSettingsCache =
  async (): Promise<NotificationSettingsData | null> => {
    try {
      const cached = await redisClient.get(NOTIFICATION_SETTINGS_CACHE_KEY);
      if (!cached) return null;

      return NotificationSettingsSchema.parse(JSON.parse(cached));
    } catch (error) {
      console.warn("readNotificationSettingsCache Warning:", error);
      return null;
    }
  };

const writeNotificationSettingsCache = async (
  data: NotificationSettingsData,
) => {
  try {
    await redisClient.set(
      NOTIFICATION_SETTINGS_CACHE_KEY,
      JSON.stringify(data),
      "EX",
      SITE_SETTINGS_CACHE_TTL,
    );
  } catch (error) {
    console.warn("writeNotificationSettingsCache Warning:", error);
  }
};

const mapRecordsToNotificationSettings = (
  records: Awaited<ReturnType<typeof getSettingsByKeysQuery>>,
): NotificationSettingsData => {
  const values = new Map(
    records.map((record) => [record.key, record.value || ""]),
  );

  return {
    commentNotificationsEnabled: toBool(
      values.get(NOTIFICATION_SETTING_META.commentNotificationsEnabled.key),
      true,
    ),
    replyNotificationsEnabled: toBool(
      values.get(NOTIFICATION_SETTING_META.replyNotificationsEnabled.key),
      true,
    ),
    adminContentNotificationsEnabled: toBool(
      values.get(
        NOTIFICATION_SETTING_META.adminContentNotificationsEnabled.key,
      ),
      true,
    ),
    forceLogoutNotificationsEnabled: toBool(
      values.get(NOTIFICATION_SETTING_META.forceLogoutNotificationsEnabled.key),
      true,
    ),
    pwaEnabled: toBool(
      values.get(NOTIFICATION_SETTING_META.pwaEnabled.key),
      true,
    ),
    webPushEnabled: toBool(
      values.get(NOTIFICATION_SETTING_META.webPushEnabled.key),
      true,
    ),
    fcmPushEnabled: toBool(
      values.get(NOTIFICATION_SETTING_META.fcmPushEnabled.key),
      true,
    ),
    excludeSelfNotifications: toBool(
      values.get(NOTIFICATION_SETTING_META.excludeSelfNotifications.key),
      true,
    ),
    realtimeNotificationsEnabled: toBool(
      values.get(NOTIFICATION_SETTING_META.realtimeNotificationsEnabled.key),
      true,
    ),
    toastNotificationsEnabled: toBool(
      values.get(NOTIFICATION_SETTING_META.toastNotificationsEnabled.key),
      true,
    ),
    showNotificationThumbnails: toBool(
      values.get(NOTIFICATION_SETTING_META.showNotificationThumbnails.key),
      true,
    ),
    unreadPreviewLimit: Number(
      values.get(NOTIFICATION_SETTING_META.unreadPreviewLimit.key) ||
        NOTIFICATION_SETTING_META.unreadPreviewLimit.fallback,
    ),
    historyPageSize: Number(
      values.get(NOTIFICATION_SETTING_META.historyPageSize.key) ||
        NOTIFICATION_SETTING_META.historyPageSize.fallback,
    ),
    retentionDays: Number(
      values.get(NOTIFICATION_SETTING_META.retentionDays.key) ||
        NOTIFICATION_SETTING_META.retentionDays.fallback,
    ),
  };
};

const toNotificationSettingSeeds = (
  data: NotificationSettingsData,
): SettingSeed[] => {
  return [
    {
      key: NOTIFICATION_SETTING_META.commentNotificationsEnabled.key,
      value: String(data.commentNotificationsEnabled),
      group: "notification",
      label: NOTIFICATION_SETTING_META.commentNotificationsEnabled.label,
      description: "게시글에 새 댓글이 달렸을 때 작성자에게 알림을 보냅니다.",
      isPublic: NOTIFICATION_SETTING_META.commentNotificationsEnabled.isPublic,
    },
    {
      key: NOTIFICATION_SETTING_META.replyNotificationsEnabled.key,
      value: String(data.replyNotificationsEnabled),
      group: "notification",
      label: NOTIFICATION_SETTING_META.replyNotificationsEnabled.label,
      description: "내 댓글에 답글이 달렸을 때 알림을 보냅니다.",
      isPublic: NOTIFICATION_SETTING_META.replyNotificationsEnabled.isPublic,
    },
    {
      key: NOTIFICATION_SETTING_META.adminContentNotificationsEnabled.key,
      value: String(data.adminContentNotificationsEnabled),
      group: "notification",
      label: NOTIFICATION_SETTING_META.adminContentNotificationsEnabled.label,
      description:
        "관리자가 게시글, 댓글, 첨부파일을 처리했을 때 작성자에게 알림을 보냅니다.",
      isPublic:
        NOTIFICATION_SETTING_META.adminContentNotificationsEnabled.isPublic,
    },
    {
      key: NOTIFICATION_SETTING_META.forceLogoutNotificationsEnabled.key,
      value: String(data.forceLogoutNotificationsEnabled),
      group: "notification",
      label: NOTIFICATION_SETTING_META.forceLogoutNotificationsEnabled.label,
      description: "관리자가 사용자를 강제 로그아웃했을 때 알림을 보냅니다.",
      isPublic:
        NOTIFICATION_SETTING_META.forceLogoutNotificationsEnabled.isPublic,
    },
    {
      key: NOTIFICATION_SETTING_META.pwaEnabled.key,
      value: String(data.pwaEnabled),
      group: "notification",
      label: NOTIFICATION_SETTING_META.pwaEnabled.label,
      description:
        "매니페스트, 서비스워커, 설치 버튼 같은 PWA 기능을 활성화합니다.",
      isPublic: NOTIFICATION_SETTING_META.pwaEnabled.isPublic,
    },
    {
      key: NOTIFICATION_SETTING_META.webPushEnabled.key,
      value: String(data.webPushEnabled),
      group: "notification",
      label: NOTIFICATION_SETTING_META.webPushEnabled.label,
      description:
        "브라우저 PushSubscription 등록과 Web Push 발송을 활성화합니다.",
      isPublic: NOTIFICATION_SETTING_META.webPushEnabled.isPublic,
    },
    {
      key: NOTIFICATION_SETTING_META.fcmPushEnabled.key,
      value: String(data.fcmPushEnabled),
      group: "notification",
      label: NOTIFICATION_SETTING_META.fcmPushEnabled.label,
      description:
        "모바일 앱 FCM 토큰 등록과 Firebase 푸시 발송을 활성화합니다.",
      isPublic: NOTIFICATION_SETTING_META.fcmPushEnabled.isPublic,
    },
    {
      key: NOTIFICATION_SETTING_META.excludeSelfNotifications.key,
      value: String(data.excludeSelfNotifications),
      group: "notification",
      label: NOTIFICATION_SETTING_META.excludeSelfNotifications.label,
      description: "내가 만든 액션으로 나에게 알림이 가지 않도록 합니다.",
      isPublic: NOTIFICATION_SETTING_META.excludeSelfNotifications.isPublic,
    },
    {
      key: NOTIFICATION_SETTING_META.realtimeNotificationsEnabled.key,
      value: String(data.realtimeNotificationsEnabled),
      group: "notification",
      label: NOTIFICATION_SETTING_META.realtimeNotificationsEnabled.label,
      description: "알림 저장 후 SSE로 즉시 전달합니다.",
      isPublic: NOTIFICATION_SETTING_META.realtimeNotificationsEnabled.isPublic,
    },
    {
      key: NOTIFICATION_SETTING_META.toastNotificationsEnabled.key,
      value: String(data.toastNotificationsEnabled),
      group: "notification",
      label: NOTIFICATION_SETTING_META.toastNotificationsEnabled.label,
      description: "실시간 알림을 토스트로 표시합니다.",
      isPublic: NOTIFICATION_SETTING_META.toastNotificationsEnabled.isPublic,
    },
    {
      key: NOTIFICATION_SETTING_META.showNotificationThumbnails.key,
      value: String(data.showNotificationThumbnails),
      group: "notification",
      label: NOTIFICATION_SETTING_META.showNotificationThumbnails.label,
      description: "알림 목록과 토스트에서 이미지 썸네일을 표시합니다.",
      isPublic: NOTIFICATION_SETTING_META.showNotificationThumbnails.isPublic,
    },
    {
      key: NOTIFICATION_SETTING_META.unreadPreviewLimit.key,
      value: String(data.unreadPreviewLimit),
      group: "notification",
      label: NOTIFICATION_SETTING_META.unreadPreviewLimit.label,
      description: "읽지 않은 알림 API가 한 번에 가져올 최대 개수입니다.",
      isPublic: NOTIFICATION_SETTING_META.unreadPreviewLimit.isPublic,
    },
    {
      key: NOTIFICATION_SETTING_META.historyPageSize.key,
      value: String(data.historyPageSize),
      group: "notification",
      label: NOTIFICATION_SETTING_META.historyPageSize.label,
      description: "알림 기록 화면의 기본 페이지 크기입니다.",
      isPublic: NOTIFICATION_SETTING_META.historyPageSize.isPublic,
    },
    {
      key: NOTIFICATION_SETTING_META.retentionDays.key,
      value: String(data.retentionDays),
      group: "notification",
      label: NOTIFICATION_SETTING_META.retentionDays.label,
      description: "알림 기록을 보관할 일수입니다.",
      isPublic: NOTIFICATION_SETTING_META.retentionDays.isPublic,
    },
  ];
};

export const getNotificationSettingsAdminAction = async (): Promise<
  ActionState<NotificationSettingsData>
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
    const cached = await readNotificationSettingsCache();
    if (cached) {
      return {
        success: true,
        type: "success",
        message: "알림 설정을 불러왔습니다.",
        data: cached,
      };
    }

    const records = await getSettingsByKeysQuery(NOTIFICATION_SETTING_KEYS);
    const data = mapRecordsToNotificationSettings(records);
    await writeNotificationSettingsCache(data);

    return {
      success: true,
      type: "success",
      message: "알림 설정을 불러왔습니다.",
      data,
    };
  } catch (error) {
    console.error("getNotificationSettingsAdminAction Error:", error);
    return {
      success: false,
      type: "error",
      message: "알림 설정을 불러오지 못했습니다.",
    };
  }
};

export const getNotificationSettingsRuntimeAction =
  async (): Promise<NotificationSettingsData> => {
    const cached = await readNotificationSettingsCache();
    if (cached) return cached;

    try {
      const records = await getSettingsByKeysQuery(NOTIFICATION_SETTING_KEYS);
      const data = mapRecordsToNotificationSettings(records);
      await writeNotificationSettingsCache(data);

      return data;
    } catch (error) {
      console.error("getNotificationSettingsRuntimeAction Error:", error);
      return mapRecordsToNotificationSettings([]);
    }
  };

export const updateNotificationSettingsAdminAction = async (
  formData: FormData,
): Promise<ActionState<NotificationSettingsData>> => {
  const sessionInfo = await getUserSessionAction();

  if (!sessionInfo?.data?.isAdmin) {
    return {
      success: false,
      type: "error",
      message: "관리자 권한이 필요합니다.",
    };
  }

  const formPayload = {
    commentNotificationsEnabled: formData.has("commentNotificationsEnabled"),
    replyNotificationsEnabled: formData.has("replyNotificationsEnabled"),
    adminContentNotificationsEnabled: formData.has(
      "adminContentNotificationsEnabled",
    ),
    forceLogoutNotificationsEnabled: formData.has(
      "forceLogoutNotificationsEnabled",
    ),
    pwaEnabled: formData.has("pwaEnabled"),
    webPushEnabled: formData.has("webPushEnabled"),
    fcmPushEnabled: formData.has("fcmPushEnabled"),
    excludeSelfNotifications: formData.has("excludeSelfNotifications"),
    realtimeNotificationsEnabled: formData.has("realtimeNotificationsEnabled"),
    toastNotificationsEnabled: formData.has("toastNotificationsEnabled"),
    showNotificationThumbnails: formData.has("showNotificationThumbnails"),
    unreadPreviewLimit: formData.get("unreadPreviewLimit"),
    historyPageSize: formData.get("historyPageSize"),
    retentionDays: formData.get("retentionDays"),
  };

  const validation = validateForm(NotificationSettingsSchema, formPayload);
  if (!validation.isValid) return validation.errorResponse;

  try {
    await upsertSettingsQuery(toNotificationSettingSeeds(validation.data));
    await writeNotificationSettingsCache(validation.data);

    return {
      success: true,
      type: "success",
      message: "알림 설정이 저장되었습니다.",
      data: validation.data,
    };
  } catch (error) {
    console.error("updateNotificationSettingsAdminAction Error:", error);
    return {
      success: false,
      type: "error",
      message: "알림 설정 저장에 실패했습니다.",
    };
  }
};
