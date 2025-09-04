import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verify } from "@plextype/utils/auth/jwtAuth";
import { getUserById } from "@/extentions/user/scripts/userModel";

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
