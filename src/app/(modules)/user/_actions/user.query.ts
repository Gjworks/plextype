// src/app/(extentions)/users/_actions/user.query.ts
import { Prisma } from "@prisma/client";
import prisma from "@utils/db/prisma";
import { UserListParsedParams } from "./_type";

// ==========================================
// [READ] 단순 사용자 조회 (무조건 find 접두사 사용)
// ==========================================
export function findUserById(userId: number) {
  return prisma.user.findUnique({ where: { id: userId } });
}

export function findUserByUUID(uuid: string) {
  return prisma.user.findUnique({ where: { uuid } });
}

export function findUserByAccountOrEmail(accountIdOrEmail: string) {
  return prisma.user.findFirst({
    where: {
      OR: [{ accountId: accountIdOrEmail }, { email_address: accountIdOrEmail }],
    },
  });
}

export function findUserByAccountId(accountId: string) {
  return prisma.user.findUnique({ where: { accountId } });
}

export function findUserByNickname(nickName: string) {
  return prisma.user.findUnique({ where: { nickName } });
}

// ==========================================
// [READ] 관계 포함 복잡한 조회 (무조건 find 접두사 사용)
// ==========================================
export function findUserFullById(userId: number) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      userGroups: { include: { group: true } },
    },
  });
}

export function findUserSessionData(accountId: string) { // 💡 getUserSessionData -> find 로 변경
  return prisma.user.findUnique({
    where: { accountId },
    include: {
      userGroups: {
        include: {
          group: { include: { users: { include: { user: true } } } },
        },
      },
    },
  });
}

export function findUserByCondition(whereObj: Prisma.UserWhereUniqueInput) { // 💡 getUserDataByObj -> find 로 변경
  return prisma.user.findUnique({
    where: whereObj,
    include: {
      userGroups: { include: { group: true } },
    },
  });
}

export async function findUserList(params: UserListParsedParams) { // 💡 getUserList -> find 로 변경
  const { page, target, keyword, listCount } = params;
  const skipAmount = (page - 1) * listCount;
  const where: any = {};

  if (target && keyword) {
    where[target] = { contains: keyword };
  }

  const [totalItems, userList] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      skip: skipAmount,
      take: listCount,
      where,
      orderBy: { id: "desc" },
    }),
  ]);

  return {
    userList,
    navigation: {
      totalCount: totalItems,
      totalPages: Math.ceil(totalItems / listCount),
      page,
      listCount,
    },
  };
}

// ==========================================
// [WRITE & CHECK] 트랜잭션 및 유효성 검사 쿼리
// ==========================================
export function checkExistingUser(accountId: string, nickName: string) {
  return prisma.user.findFirst({
    where: { OR: [{ accountId }, { nickName }] },
  });
}

export async function findUser(accountId: string, email: string, nickName: string, excludeId?: number) {
  return prisma.user.findMany({
    where: {
      OR: [
        { accountId: accountId },
        { email_address: email },
        { nickName: nickName },
      ],
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
}

export async function upsertUser(
  isUpdate: boolean,
  targetId: number | null,
  data: Prisma.UserCreateInput | Prisma.UserUpdateInput,
  groups?: number[]
) {
  return prisma.$transaction(async (tx) => {
    let finalId = targetId;

    if (!isUpdate) {
      // [생성]
      const newUser = await tx.user.create({ data: data as Prisma.UserCreateInput });
      finalId = newUser.id;
    } else {
      // [수정] 💡 여기 있던 무조건 삭제 코드를 뺐습니다!
      await tx.user.update({
        where: { id: finalId! },
        data: data as Prisma.UserUpdateInput
      });
    }

    // 🌟 오직 groups가 넘어왔을 때(관리자 페이지일 때)만 기존 그룹을 지우고 새로 씁니다!
    if (groups !== undefined) {
      // 1. 기존 매핑 다 지우기
      await tx.userGroupUser.deleteMany({ where: { userId: finalId! } });

      // 2. 체크된 그룹이 1개라도 있으면 다시 생성
      if (groups.length > 0) {
        await tx.userGroupUser.createMany({
          data: groups.map((groupId) => ({ groupId, userId: finalId! })),
        });
      }
    }
  });
}

export async function deleteUser(userId: number) {
  return prisma.$transaction(async (tx) => {
    await tx.userGroupUser.deleteMany({ where: { userId } });
    await tx.user.delete({ where: { id: userId } });
  });
}

export async function updatePassword(userId: number, newPasswordHash: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { password: newPasswordHash },
  });
}