"use server";

import { revalidatePath } from "next/cache";
import * as query from "./notification.query";

/** 🌟 [SAVE] */
export const saveNotification = async (data: any) => {
  const result = await query.insertNotification(data);
  return result;
};

/** 🌟 [GET] */
export const getUnreadCount = async (userId: number) => {
  return await query.findUnreadCount(userId);
};

export const getUnreadList = async (userId: number) => {
  return await query.findUnreadList(userId);
};

export const setReadStatus = async (uuid: string, userId: number) => {
  await query.updateReadStatus(uuid);
  const newCount = await query.findUnreadCount(userId);
  return { success: true, newCount };
};

export const setAllRead = async (userId: number) => {
  await query.updateAllToRead(userId);
  return { success: true, newCount: 0 };
};

/** 🌟 [REMOVE] */
export const removeNotification = async (uuid: string, userId: number) => {
  await query.deleteByUuid(uuid);
  const latestUnread = await query.findUnreadList(userId);
  const newCount = await query.findUnreadCount(userId);
  return { success: true, latestUnread, newCount };
};