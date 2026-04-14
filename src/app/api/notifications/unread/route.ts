import { NextResponse } from "next/server";
import { getUnreadList } from "@modules/notification/_actions/notification.action";
import {getAuthenticatedUser} from "@utils/auth/authHelper";

export async function GET() {
  try {
    // 1. 여기서 에러가 나면 바로 catch로 넘어갑니다.
    const user = await getAuthenticatedUser();

    // 2. 유저 정보가 정말로 없는지 한 번 더 안전하게 체크
    if (!user || !user.id) {
      console.log("[Notification API]: No user found in session");
      return NextResponse.json({ error: "인증 정보 없음" }, { status: 401 });
    }

    const notifications = await getUnreadList(user.id);
    return NextResponse.json(notifications || []); // null 대비
  } catch (error: any) {
    // 3. UNAUTHORIZED 에러인 경우 500이 아닌 401을 내려주는 게 관례입니다.
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    console.error("[Notification API Error]:", error);
    return NextResponse.json({ error: "서버 내부 에러" }, { status: 500 });
  }
}