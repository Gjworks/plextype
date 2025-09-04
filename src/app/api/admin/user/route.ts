import { NextResponse, NextRequest } from "next/server";

import { PrismaClient } from "@prisma/client";
import { verify } from "@plextype/utils/auth/jwtAuth";
import { jsonResponse } from "@plextype/utils/helper/jsonResponse";

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
    if (!accessToken)
      return jsonResponse(
        403,
        "Unauthorized access. Please log in to continue",
      );

    const verifyToken = await verify(accessToken!);
    if (!verifyToken || verifyToken.isAdmin !== true) {
      return jsonResponse(
        403,
        "Access denied. You do not have administrator privileges.",
      );
    }
    // ✅ 정상 관리자 접근 시에도 반드시 Response 반환
    return jsonResponse(200, "Access granted. Admin verified.");
  } catch (error) {
    console.error("Server error:", error);
    return jsonResponse(500, "Internal server error. Please try again later.");
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const accessToken = request.cookies.get("accessToken")?.value;
    if (!accessToken)
      return jsonResponse(
        403,
        "Unauthorized access. Please log in to continue",
      );

    const verifyToken = await verify(accessToken!);
    if (!verifyToken || verifyToken.isAdmin !== true) {
      return jsonResponse(
        403,
        "Access denied. You do not have administrator privileges.",
      );
    }

    const formData = await request.formData();
    const accountId = formData.get("accountId")?.toString();
    const password = formData.get("password")?.toString();
    const nickName = formData.get("nickName")?.toString();

    if (!accountId)
      return jsonResponse(
        400,
        "User ID is missing or invalid. Please check and try again.",
      );
    if (!password)
      return jsonResponse(
        400,
        "Password is required. Please enter a valid password.",
      );
    if (!nickName)
      return jsonResponse(
        400,
        "Nickname is required. Please provide a valid nickname.",
      );

    const [getUserAccountId, getUserNickname] = await Promise.all([
      getUserByAccountId(accountId),
      getUserByNickname(nickName),
    ]);

    if (getUserAccountId)
      return jsonResponse(409, "This user ID is already taken.");
    if (getUserNickname)
      return jsonResponse(409, "This nickname is already in use.");

    let hashedPwd;
    try {
      hashedPwd = await hashedPassword(password);
    } catch (error) {
      console.error("Password hashing error:", error);
      return jsonResponse(
        500,
        "An error occurred while encrypting the password.",
      );
    }

    try {
      await prisma.user.create({
        data: {
          accountId,
          password: hashedPwd,
          email_address: accountId,
          nickName,
        },
      });
      return jsonResponse(201, "User registered successfully.", true);
    } catch (e) {
      console.error("register error:", e);
      return jsonResponse(
        500,
        "An error occurred during the registration process.",
      );
    }
  } catch (error) {
    console.error("Server error:", error);
    return jsonResponse(500, "Internal server error. Please try again later.");
  }
}
