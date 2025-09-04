import prisma from "@plextype/utils/db/prisma";
import type { Prisma } from "@prisma/client";

/**
 * ID로 사용자 조회 (기본 정보만)
 */
export async function findUserById(userId: number) {
  return prisma.user.findUnique({
    where: { id: userId },
  });
}

/**
 * UUID로 사용자 조회
 */
export async function findUserByUUID(uuid: string) {
  return prisma.user.findUnique({
    where: { uuid },
  });
}

/**
 * accountId 또는 email로 사용자 조회
 */
export async function findUserByAccount(accountIdOrEmail: string) {
  return prisma.user.findFirst({
    where: {
      OR: [
        { accountId: accountIdOrEmail },
        { email_address: accountIdOrEmail },
      ],
    },
  });
}

/**
 * 사용자 + 프로필 + 그룹 정보 포함 조회
 */
export async function findUserFullById(userId: number) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      userGroups: {
        include: {
          group: true,
        },
      },
    },
  });
}

/**
 * 사용자 목록 조회 (페이징, 검색)
 */
export async function findUsers(params: {
  skip?: number;
  take?: number;
  keyword?: string;
}) {
  const { skip = 0, take = 20, keyword } = params;

  return prisma.user.findMany({
    skip,
    take,
    where: keyword
      ? {
          OR: [
            { accountId: { contains: keyword, mode: "insensitive" } },
            { email_address: { contains: keyword, mode: "insensitive" } },
            { nickName: { contains: keyword, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      profile: true,
    },
  });
}

/**
 * 사용자 생성
 */
export async function createUser(data: Prisma.UserCreateInput) {
  return prisma.user.create({ data });
}

/**
 * 사용자 정보 수정
 */
export async function updateUser(userId: number, data: Prisma.UserUpdateInput) {
  return prisma.user.update({
    where: { id: userId },
    data,
  });
}

/**
 * 사용자 삭제 (Soft delete가 아니라면 실제 삭제)
 */
export async function deleteUser(userId: number) {
  return prisma.user.delete({
    where: { id: userId },
  });
}

/**
 * 사용자 존재 여부 확인
 */
export async function isUserExists(where: Prisma.UserWhereInput) {
  const user = await prisma.user.findFirst({
    where,
    select: { id: true },
  });
  return !!user;
}
