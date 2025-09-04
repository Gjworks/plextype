import { NextResponse, NextRequest } from "next/server";
import { cookies, headers } from "next/headers";

import { decodeJwt } from "jose";
import {
  sign,
  verify,
  refresh,
  refreshVerify,
} from "@plextype/utils/auth/jwtAuth";
import { PrismaClient } from "@prisma/client";

export async function POST(request: NextRequest): Promise<Response> {
  let newAccessToken: string;
  let verifyToken: any;
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;

  // const authorization = headers().get('authorization')
  const authorization = request.headers.get("Authorization");
  const accessToken = authorization && authorization.split(" ")[1];

  if (!accessToken && !refreshToken) {
    const response = {
      success: true,
      code: "token_error",
      type: "error",
      message: "token값이 존재 하지 않습니다.",
      data: {},
      accessToken: null,
    };
    return NextResponse.json(response);
  }

  try {
    verifyToken = await verify(accessToken!);
    if (verifyToken.ok === false) {
      // cookies().delete('refreshToken');
      // cookies().delete('accessToken');
      // const response =
      //   {
      //     success: false,
      //     code : 'user info not found',
      //     type : 'error',
      //     message: "회원정보를 찾을 수 없습니다.",
      //     data : {},
      //     accessToken: null,
      //   }
      //   return NextResponse.json(response);

      let refreshVerifyToken = await refreshVerify(refreshToken!);
      if (refreshVerifyToken) {
        const decodeToken = await decodeJwt(accessToken!);
        if (decodeToken && decodeToken.id) {
          const tokenParams = {
            id: decodeToken.id,
            accountId: decodeToken.accountId,
            isAdmin: decodeToken.isAdmin,
            groups: decodeToken.groupIds, // 그룹 ID 배열 추가
          };
          newAccessToken = await sign(tokenParams);
          cookieStore.delete("accessToken");
          cookieStore.set({
            name: "accessToken",
            value: newAccessToken,
            httpOnly: true,
            sameSite: "strict",
          });
          const response = {
            success: true,
            code: "new_accessToken",
            type: "success",
            message: "New accessToken",
            data: {},
            accessToken: newAccessToken,
          };
          return NextResponse.json(response);
        }
      } else {
        cookieStore.delete("refreshToken");
        cookieStore.delete("accessToken");
        const response = {
          success: false,
          code: "refreshToken_expires",
          type: "error",
          message: "token이 만료되었습니다. 로그인을 새로 해주세요.",
          data: {},
          accessToken: null,
        };
        return NextResponse.json(response);
      }
    }
    const response = {
      success: true,
      code: "success",
      message: "",
      data: {},
      accessToken: accessToken,
    };
    return NextResponse.json(response);
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        code: "server_error",
        type: "error",
        message: "서버 오류가 발생했습니다.",
        data: {},
        accessToken: null,
      },
      { status: 500 },
    );
  }
}
