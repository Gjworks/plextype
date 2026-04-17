"use server";

import { revalidatePath } from "next/cache";
import * as query from "./notification.query";

/** 🌟 [SAVE] */
export const saveNotification = async (data: any) => {
  // data 안에 userId, type, title, content, metadata 등이 다 들어있어야 합니다.
  const result = await query.insertNotification({ ...data, isRead: false });
  return result;
};

/** 🌟 [GET] */
export const getUnreadCount = async (userId: number) => {
  return await query.findUnreadCount(userId);
};

export const getUnreadList = async (userId: number) => {
  return await query.findUnreadList(userId);
};

export const findHistoryPage = async (userId: number, skip: number, take: number) => {
  // 쿼리 레이어(notification.query.ts)에 있는 동명의 함수를 호출합니다.
  return await query.findHistoryPage(userId, skip, take);
};

/** 🌟 [UPDATE] */
export const setReadStatus = async (uuid: string, userId: number) => {
  // 💡 보안 팁: 단순히 UUID로만 업데이트하지 말고,
  // '내 알림이 맞는지(userId)' 확인하는 로직을 query 단에 넣는 게 좋습니다.
  await query.updateReadStatus(uuid, userId);

  const newCount = await query.findUnreadCount(userId);
  return { success: true, newCount };
};

// 💡 프론트엔드/API에서 setReadAll로 불렀다면 이름을 맞춰주는 게 좋겠죠?
export const setAllRead = async (userId: number) => {
  await query.updateAllToRead(userId);
  return { success: true, newCount: 0 };
};

/** 🌟 [REMOVE] */
export const removeNotification = async (uuid: string, userId: number) => {
  // 💡 보안 팁: 남이 내 알림을 지우지 못하도록 userId를 같이 넘깁니다.
  await query.deleteByUuid(uuid, userId);

  // 리스트와 카운트를 동시에 돌려주는 건 아주 좋은 설계입니다! (Optimistic UI 대응)
  const latestUnread = await query.findUnreadList(userId);
  const newCount = await query.findUnreadCount(userId);

  return { success: true, latestUnread, newCount };
};

export const deleteAllNotifications = async (userId: number) => {
  // 쿼리 레이어의 delete 함수 호출
  return await query.deleteAllByUserId(userId);
};