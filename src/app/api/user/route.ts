import { NextResponse, NextRequest } from "next/server";

import { PrismaClient } from "@prisma/client";
import { z } from "zod"; // ✅ Zod 임포트
import { verify } from "@plextype/utils/auth/jwtAuth";

import {
  getUserByAccountId,
  getUserById,
  getUserByNickname,
} from "@/extentions/user/scripts/userModel";
import { hashedPassword } from "@plextype/utils/auth/password";

const prisma = new PrismaClient();

// ✅ 1. Zod 유효성 검사 스키마 정의
const RegisterSchema = z.object({
  accountId: z
    .string()
    .min(1, { message: "이메일을 입력해주세요." }) // .min도 객체 방식 권장
    .email({ message: "올바른 이메일 형식이 아닙니다." }), // 경고 해결 포인트

  password: z
    .string()
    .min(8, { message: "비밀번호는 최소 8자 이상 입력해주세요." })
    .regex(/[A-Za-z]/, { message: "비밀번호는 영문자를 포함해야 합니다." })
    .regex(/\d/, { message: "비밀번호는 숫자를 포함해야 합니다." })
    .regex(/[@$!%*#?&]/, { message: "비밀번호는 특수문자를 포함해야 합니다." }),

  nickName: z
    .string()
    .min(2, { message: "닉네임은 최소 2자 이상이어야 합니다." })
    .max(12, { message: "닉네임은 최대 12자까지 가능합니다." })
    .regex(/^[가-힣a-zA-Z0-9]+$/, {
      message: "닉네임에는 특수문자를 사용할 수 없습니다.",
    }),
});

export async function GET(request: NextRequest): Promise<Response> {
  try {
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

      return NextResponse.json({
        id: user.id,
        accountId: user.accountId,
        nickName: user.nickName,
        email_address: user.email_address,
        createdAt: user.createdAt,
        updateAt: user.updateAt,
      });
    } else {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const formData = await request.formData();

    // FormData를 객체로 변환
    const rawData = {
      accountId: formData.get("accountId")?.toString(),
      password: formData.get("password")?.toString(),
      nickName: formData.get("nickName")?.toString(),
    };

    // ✅ 2. Zod를 이용한 유효성 검사 실행
    const validation = RegisterSchema.safeParse(rawData);

    // 검사 실패 시 에러 응답
    if (!validation.success) {
      // .issues를 사용하면 TypeScript 에러가 사라집니다.
      const firstError = validation.error.issues[0]?.message || "검증 오류가 발생했습니다.";

      return NextResponse.json(
        { success: false, type: "error", message: firstError },
        { status: 400 }
      );
    }

    // 검사 성공 시 데이터 추출
    const { accountId, password, nickName } = validation.data;

    const [getUserAccountId, getUserNickname] = await Promise.all([
      getUserByAccountId(accountId),
      getUserByNickname(nickName),
    ]);

    if (getUserAccountId) {
      return NextResponse.json(
        {
          success: false,
          type: "error",
          message: "This user ID is already taken.",
        },
        { status: 409 },
      );
    }

    if (getUserNickname) {
      return NextResponse.json(
        {
          success: false,
          type: "error",
          message: "This nickname is already in use.",
        },
        { status: 409 },
      );
    }

    // ✅ 비밀번호 해싱 (오류 방지)
    let hashedPwd;
    try {
      hashedPwd = await hashedPassword(password);
    } catch (error) {
      console.error("Password hashing error:", error);
      return NextResponse.json(
        {
          success: false,
          type: "error",
          message: "An error occurred while encrypting the password.",
        },
        { status: 500 },
      );
    }

    try {
      await prisma.user.create({
        data: {
          accountId: accountId,
          password: hashedPwd,
          email_address: accountId,
          nickName: nickName,
        },
      });

      return NextResponse.json(
        {
          success: true,
          type: "success",
          message: "User registered successfully.",
        },
        { status: 201 }, // `201 Created` 반환
      );
    } catch (e) {
      console.log("register error" + e);
      NextResponse.json(
        {
          success: false,
          type: "error",
          message: "An error occurred during the registration process. ",
          data: {},
        },
        { status: 500 },
      );
    }
    return NextResponse.json(
      {
        success: true,
        type: "success",
        message: "User registered successfully.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        success: false,
        type: "error",
        message: "Internal server error. Please try again later.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
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

      const formData = await request.formData();
      const nickName = formData.get("nickName")?.toString();

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          nickName: nickName || user.nickName,
        },
      });

      return NextResponse.json({
        id: updatedUser.id,
        accountId: updatedUser.accountId,
        nickName: updatedUser.nickName,
        email_address: updatedUser.email_address,
        createdAt: updatedUser.createdAt,
        updateAt: updatedUser.updateAt,
      });
    } else {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest): Promise<Response> {
  try {
    return NextResponse.json({
      success: true,
      type: "success",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
