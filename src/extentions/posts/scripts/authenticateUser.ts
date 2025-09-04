import { cookies } from "next/headers";
import { decodeJwt } from "jose";
import prisma from "@plextype/utils/db/prisma";

export const getAuthenticatedUser = async (request) => {
  let userInfo;
  let accessToken;
  // const grantInfo = (postInfo?.config as { grant: any })?.grant;
  const authHeader = request.headers.get("Authorization");

  if (authHeader && authHeader.startsWith("Bearer ")) {
    accessToken = authHeader.split(" ")[1]; // Bearer 토큰에서 실제 토큰만 추출
  } else {
    // Authorization 헤더가 없을 때 쿠키에서 가져오는 대안 처리 (선택 사항)
    const cookieStore = await cookies(); // 쿠키 객체 가져오기
    if (cookieStore) {
      const tokenCookie = cookieStore.get("accessToken"); // 쿠키 읽기
      accessToken = tokenCookie?.value; // 값 할당
    }
  }

  if (accessToken && accessToken !== "undefined") {
    const decodeToken: { id: number; accountId: string; isAdmin: boolean } =
      await decodeJwt(accessToken);
    userInfo = await prisma.user.findUnique({
      where: { accountId: decodeToken.accountId },
      include: {
        userGroups: {
          // User와 UserGroupUser의 관계
          include: {
            group: {
              select: {
                id: true,
                groupName: true,
                groupTitle: true,
                groupDesc: true,
                createdAt: true,
                updatedAt: true,
              },
            }, // UserGroupUser와 UserGroup의 관계
          },
        },
      },
    });
  }

  return userInfo;
};
