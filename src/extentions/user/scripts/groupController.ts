'use server'
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const updateUserGroup = async (userId:number, groupId:number[]) => {

  if(!userId) {
    return {
      success: false,
      code: "error",
      message : '사용자 정보가 없습니다.',
      data: {}
    }
  }
  
  try {
    await prisma.userGroupUser.deleteMany({
      where: { userId: userId },
    });
    for (const groups of groupId) {
      await prisma.userGroupUser.create({
        data: {
          userId: userId,
          groupId: Number(groups),
        },
      });
    }
  } catch (error) {
    console.error(error);
  }
}

export const deleteUserGroup = async (userId:number) => {
  if(!userId) {
    return {
      success: false,
      code: "error",
      message : '사용자 정보가 없습니다.',
      data: {}
    }
  }

  try {
    await prisma.userGroupUser.deleteMany({
      where: { userId: userId },
    });
  } catch (error) {
    console.error(error);
  }
}