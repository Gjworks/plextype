import { NextResponse, NextRequest } from "next/server";

import { PrismaClient } from "@prisma/client";
import { verify } from "@plextype/utils/auth/jwtAuth";

import {
  getUserByAccountId,
  getUserById,
  getUserByNickname,
} from "@/extentions/user/scripts/userModel";
import { hashedPassword } from "@plextype/utils/auth/password";

const prisma = new PrismaClient();

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
    const accountId = formData.get("accountId")?.toString();
    const password = formData.get("password")?.toString();
    const nickName = formData.get("nickName")?.toString();

    if (!accountId) {
      return NextResponse.json(
        {
          success: false,
          type: "error",
          message: "User ID is missing or invalid. Please check and try again.",
        },
        { status: 400 },
      );
    }

    if (!password) {
      return NextResponse.json(
        {
          success: false,
          type: "error",
          message: "Password is required. Please enter a valid password.",
        },
        { status: 400 },
      );
    }
    if (!nickName) {
      return NextResponse.json(
        {
          success: false,
          type: "error",
          message: "Nickname is required. Please provide a valid nickname.",
        },
        { status: 400 },
      );
    }

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
