import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { hashedPassword, verifyPassword } from "@plextype/utils/auth/password";
import { decodeJwt } from "jose";
import {
  sign,
  verify,
  refresh,
  refreshVerify,
} from "@plextype/utils/auth/jwtAuth";
import { PrismaClient } from "@prisma/client";
import { timeToSeconds } from "@plextype/utils/date/timeToSeconds";

const prisma = new PrismaClient();

export async function POST(request: Request): Promise<Response> {
  const cookieStore = await cookies();
  const formData = await request.formData();

  const accountId = formData.get("accountId") as string;
  const password = formData.get("password") as string;

  if (!accountId) {
    const response = {
      success: true,
      type: "error",
      element: "accountId",
      message: "계정 아이디 (혹은 이메일)을 입력해주세요.",
      data: {},
    };
    console.log(response);
    return NextResponse.json(response);
  }
  if (!password) {
    const response = {
      success: true,
      type: "error",
      element: "password",
      message: "비밀번호를 입력해주세요.",
      data: {},
    };
    return NextResponse.json(response);
  }

  try {
    const userInfo = await prisma.user.findUnique({
      where: { accountId: accountId },
    });

    // console.log(userInfo);
    // const vpass = await verifyPassword(password, userInfo!.password);
    // console.log(vpass);

    if (userInfo! && (await verifyPassword(password, userInfo!.password))) {
      // DB에서 사용자 그룹 정보 가져오기
      const userGroups = await prisma.userGroupUser.findMany({
        where: { userId: userInfo!.id },
        select: { groupId: true },
      });
      const groupIds = userGroups.map((g) => g.groupId);

      // exclude password from json response
      const tokenParams = {
        id: userInfo!.id,
        accountId: userInfo!.accountId,
        isAdmin: userInfo!.isAdmin,
        groups: groupIds, // 그룹 ID 배열 추가
      };

      let [accessToken, refreshToken] = await Promise.all([
        sign(tokenParams),
        refresh(tokenParams),
      ]);
      console.log(accessToken);
      const response = {
        success: true,
        type: "success",
        data: {
          userInfo: userInfo,
        },
      };

      const accessTokenExpire = timeToSeconds(
        process.env.ACCESSTOKEN_EXPIRES_IN || "1h",
      ); // "1h" 기본값
      const refreshTokenExpire = timeToSeconds(
        process.env.REFRESHTOKEN_EXPIRES_IN || "4h",
      ); // "4h" 기본값

      cookieStore.set({
        name: "accessToken",
        value: accessToken,
        httpOnly: true,
        // secure: true,
        sameSite: "strict",
        maxAge: accessTokenExpire,
      });
      cookieStore.set({
        name: "refreshToken",
        value: refreshToken,
        httpOnly: true,
        // secure: true,
        sameSite: "strict",
        maxAge: refreshTokenExpire,
      });

      return NextResponse.json(response);
    } else {
      const response = {
        success: false,
        type: "error",
        message:
          "아이디 혹은 비밀번호가 맞지 않거나 존재 하지 않은 계정입니다.",
        data: {},
      };
      return NextResponse.json(response);
    }
  } catch (e) {
    console.error(e);
    const response = {
      success: false,
      type: "error",
      message: "아이디 혹은 비밀번호가 맞지 않거나 존재 하지 않은 계정입니다.",
      data: {},
    };
    return NextResponse.json(response);
  }
}
