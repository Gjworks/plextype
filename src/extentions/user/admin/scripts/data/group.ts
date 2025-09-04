import prisma from "@plextype/utils/db/prisma";
import type { Prisma } from "@prisma/client";

/**
 * 전체 그룹 목록 조회 (이름순 정렬)
 */
export async function getAllGroupRecords() {
  return prisma.userGroup.findMany({
    orderBy: { groupName: "asc" },
  });
}

/**
 * ID로 그룹 상세 조회
 */
export async function findGroupById(groupId: number) {
  return prisma.userGroup.findUnique({
    where: { id: groupId },
  });
}

/**
 * 그룹 생성
 */
export async function createGroup(data: Prisma.UserGroupCreateInput) {
  return prisma.userGroup.create({ data });
}

/**
 * 그룹 수정
 */
export async function updateGroup(
  groupId: number,
  data: Prisma.UserGroupUpdateInput,
) {
  return prisma.userGroup.update({
    where: { id: groupId },
    data,
  });
}

/**
 * 그룹 삭제
 */
export async function deleteGroup(groupId: number) {
  return prisma.userGroup.delete({
    where: { id: groupId },
  });
}

/**
 * 유저가 속한 그룹 목록 조회
 */
export async function findGroupsByUserId(userId: number) {
  return prisma.userGroupUser.findMany({
    where: { userId },
    include: {
      group: true,
    },
  });
}

/**
 * 그룹에 속한 유저 목록 조회
 */
export async function findUsersByGroupId(groupId: number) {
  return prisma.userGroupUser.findMany({
    where: { groupId },
    include: {
      user: {
        include: {
          profile: true,
        },
      },
    },
  });
}

/**
 * 특정 유저가 특정 그룹에 속해 있는지 확인
 */
export async function isUserInGroup(userId: number, groupId: number) {
  const relation = await prisma.userGroupUser.findFirst({
    where: {
      userId,
      groupId,
    },
    select: { id: true },
  });

  return !!relation;
}
