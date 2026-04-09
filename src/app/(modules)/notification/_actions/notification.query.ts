import prisma from "@utils/db/prisma";

/** 🌟 [INSERT] */
export const insertNotification = async (data: any) => {
  return prisma.notification.create({
    data: { ...data, isRead: false },
  });
};

/** 🌟 [FIND] */
export const findUnreadCount = async (userId: number) => {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
};

export const findUnreadList = async (userId: number, limit = 20) => {
  return prisma.notification.findMany({
    where: { userId, isRead: false },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
};

export const findHistoryPage = async (userId: number, skip: number, take: number) => {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });
};

/** 🌟 [UPDATE] */
export const updateReadStatus = async (uuid: string) => {
  return prisma.notification.update({
    where: { uuid },
    data: { isRead: true, readAt: new Date() },
  });
};

export const updateAllToRead = async (userId: number) => {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
};

/** 🌟 [DELETE] */
export const deleteByUuid = async (uuid: string) => {
  return prisma.notification.delete({
    where: { uuid },
  });
};