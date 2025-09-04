import { NextResponse, NextRequest } from "next/server";
import { cookies, headers } from "next/headers";
import { PrismaClient } from "@prisma/client";
import { decodeJwt } from "jose";

import { verify } from "@plextype/utils/auth/jwtAuth";
import { getUserById } from "@/extentions/user/scripts/userModel";

const prisma = new PrismaClient();
type Params = Promise<{ pid: string }>;
export async function GET(
  request: NextRequest,
  segmentData: { params: Params },
): Promise<Response> {
  const accessToken = request.cookies.get("accessToken")?.value;
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const verifyToken = await verify(accessToken!);
  if (verifyToken) {
    const user = await getUserById(verifyToken.id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
  }

  const { pid } = await segmentData.params;

  if (!pid) {
    return NextResponse.json({ error: "Missing Post ID" }, { status: 400 });
  }
  const postInfo = await prisma.posts.findUnique({ where: { pid: pid } });

  if (!postInfo) {
    return NextResponse.json({
      success: false,
      errorCode: "MODULE_NOT_FOUND",
      message: "게시판 정보가 없습니다.",
    });
  }

  // if (accessToken && accessToken !== "undefined") {
  //   const decodeToken: { id: number; accountId: string; isAdmin: boolean } =
  //     await decodeJwt(accessToken);
  //   userInfo = await prisma.user.findUnique({
  //     where: { accountId: decodeToken.accountId },
  //     include: {
  //       userGroups: {
  //         // User와 UserGroupUser의 관계
  //         include: {
  //           group: {
  //             select: {
  //               id: true,
  //               groupName: true,
  //               groupTitle: true,
  //               groupDesc: true,
  //               createdAt: true,
  //               updatedAt: true,
  //             },
  //           }, // UserGroupUser와 UserGroup의 관계
  //         },
  //       },
  //     },
  //   });
  // }

  // const permissionInfo = await validateUserPermissions(pid, 'list', userInfo)

  // const permissionsInfo = await validateUserPermissions(pid, "list", userInfo);
  //
  // console.log(permissionsInfo);
  //
  // if (!permissionsInfo.success) {
  //   response = permissionsInfo;
  //   return NextResponse.json(response);
  // }
  //
  // response = ;

  return NextResponse.json({
    success: true,
    errorCode: "",
    message: "",
    data: postInfo,
  });
}
