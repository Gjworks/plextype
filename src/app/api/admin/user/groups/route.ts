import { NextResponse, NextRequest } from "next/server";

import { verify } from "@plextype/utils/auth/jwtAuth";
import { jsonResponse } from "@plextype/utils/helper/jsonResponse";
import prisma, { PermissionSubject } from "@plextype/utils/db/prisma";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const accessToken = request.cookies.get("accessToken")?.value;
    console.log(accessToken);
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

    try {
      const groupList = await prisma.userGroup.findMany({});
      console.log(groupList);
      return NextResponse.json(
        {
          success: true,
          data: groupList,
        },
        { status: 200 },
      );
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

export async function POST(request: NextRequest): Promise<Response> {
  try {
    return NextResponse.json({ success: true, message: "POST OK" });
  } catch (error) {
    console.error("Server error:", error);
    return jsonResponse(500, "Internal server error. Please try again later.");
  }
}
