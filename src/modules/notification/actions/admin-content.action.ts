"use server";

import { getAdminSession } from "@/core/utils/auth/adminSession";
import { dispatchNotificationAction } from "./notification.action";

export const notifyDeletedOwnerAction = async ({
  userId,
  actorId,
  title,
  content,
  linkUrl,
  contentType,
}: {
  userId: number | null;
  actorId: number;
  title: string;
  content: string;
  linkUrl?: string;
  contentType: "document" | "comment" | "attachment";
}) => {
  const admin = await getAdminSession();
  if (!admin || admin.id !== actorId || !userId || userId === actorId) return;

  await dispatchNotificationAction({
    userId,
    actorId,
    type: "warning",
    title,
    content,
    linkUrl,
    metadata: {
      appId: "gjworks",
      groupKey: "ADMIN_CONTENT",
      subType: contentType === "comment" ? "admin-comment" : contentType,
    },
  });
};
