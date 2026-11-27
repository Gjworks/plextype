import prisma from "@/core/utils/db/prisma";

export const findLinkByProviderUser = (provider: string, providerUserId: string) => (
  prisma.socialLoginAccount.findUnique({ where: { provider_providerUserId: { provider, providerUserId } } })
);

export const findLinksByUserId = (userId: number) => (
  prisma.socialLoginAccount.findMany({ where: { userId }, orderBy: { createdAt: "asc" } })
);

export const findLinkByUserProvider = (userId: number, provider: string) => (
  prisma.socialLoginAccount.findUnique({ where: { userId_provider: { userId, provider } } })
);

export const createLink = (data: { userId: number; provider: string; providerUserId: string; email: string | null; createdAccount: boolean }) => (
  prisma.socialLoginAccount.create({ data })
);

export const deleteLinkById = (id: number) => prisma.socialLoginAccount.delete({ where: { id } });

export const deleteLinksByUserId = (userId: number) => prisma.socialLoginAccount.deleteMany({ where: { userId } });

export const countLinksByProvider = async () => {
  const rows = await prisma.socialLoginAccount.groupBy({ by: ["provider"], _count: { _all: true } });
  return new Map(rows.map((row) => [row.provider, row._count._all]));
};

// 회원 테이블과는 관계를 맺지 않고 userId 값으로만 잇는다. 로그인에 필요한 컬럼만 읽는다.
export const findLoginUserById = (id: number) => (
  prisma.user.findUnique({ where: { id }, select: { id: true, accountId: true, nickName: true, isAdmin: true, status: true } })
);

export const findUserIdByEmail = async (email: string) => (
  (await prisma.user.findUnique({ where: { email_address: email }, select: { id: true } }))?.id ?? null
);
