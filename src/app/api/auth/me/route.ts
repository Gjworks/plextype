import { NextResponse, NextRequest } from "next/server";

import { sign, verify, refreshVerify } from "@plextype/utils/auth/jwtAuth";

import { getUserById } from "@/extentions/user/scripts/userModel";
import { timeToSeconds } from "@plextype/utils/date/timeToSeconds";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const accessToken = request.cookies.get("accessToken")?.value;
    const refreshToken = request.cookies.get("refreshToken")?.value;

    if (accessToken) {
      const verifyToken = await verify(accessToken!);
      const refreshVerifyToken = await refreshVerify(refreshToken!);

      if (verifyToken) {
        const user = await getUserById(verifyToken.id);

        if (!user) {
          return NextResponse.json(
            { error: "User not found" },
            { status: 401 },
          );
        }

        return NextResponse.json({
          isLoggedIn: true,
          id: user.id,
          accountId: user.accountId,
          nickName: user.nickName,
          email_address: user.email_address,
          createdAt: user.createdAt,
          updateAt: user.updateAt,
        });
      }

      if (!verifyToken && refreshVerifyToken) {
        const tokenParams = {
          id: refreshVerifyToken.id,
          accountId: refreshVerifyToken.accountId,
          isAdmin: refreshVerifyToken.isAdmin,
        };

        const newAccessToken = await sign(tokenParams);
        const accessTokenExpire = timeToSeconds(
          process.env.ACCESSTOKEN_EXPIRES_IN || "1h",
        );
        console.log(newAccessToken);
        const response = NextResponse.json({
          isLoggedIn: true,
          id: refreshVerifyToken.id,
          message: "New access token issued",
        });

        response.cookies.set({
          name: "accessToken",
          value: newAccessToken,
          httpOnly: true,
          sameSite: "strict",
          maxAge: accessTokenExpire,
        });
        return response;
      }

      const response = NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
      response.cookies.set({
        name: "accessToken",
        value: "",
        maxAge: 0,
      });

      response.cookies.set({
        name: "refreshToken",
        value: "",
        maxAge: 0,
      });
      return response;
    } else {
      return NextResponse.json({ isLoggedIn: false }, { status: 200 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
