import { z } from "zod";

export const NotificationSettingsSchema = z.object({
  commentNotificationsEnabled: z.boolean(),
  replyNotificationsEnabled: z.boolean(),
  adminContentNotificationsEnabled: z.boolean(),
  forceLogoutNotificationsEnabled: z.boolean(),
  pwaEnabled: z.boolean(),
  webPushEnabled: z.boolean(),
  fcmPushEnabled: z.boolean(),
  excludeSelfNotifications: z.boolean(),
  realtimeNotificationsEnabled: z.boolean(),
  toastNotificationsEnabled: z.boolean(),
  showNotificationThumbnails: z.boolean(),
  unreadPreviewLimit: z.coerce
    .number()
    .int()
    .min(1, "메뉴 미리보기는 1개 이상이어야 합니다.")
    .max(50, "메뉴 미리보기는 50개 이하로 입력해주세요."),
  historyPageSize: z.coerce
    .number()
    .int()
    .min(5, "히스토리 페이지는 5개 이상이어야 합니다.")
    .max(100, "히스토리 페이지는 100개 이하로 입력해주세요."),
  retentionDays: z.coerce
    .number()
    .int()
    .min(1, "보관 기간은 1일 이상이어야 합니다.")
    .max(3650, "보관 기간이 너무 깁니다."),
});

export type NotificationSettingsParams = z.infer<
  typeof NotificationSettingsSchema
>;

export type NotificationSettingsData = NotificationSettingsParams;
