import { NextResponse } from "next/server";
import { getUnreadCount } from "@modules/notification/_actions/notification.action";
import { getAuthenticatedUser } from "@utils/auth/authHelper";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    const count = await getUnreadCount(user.id);
    return NextResponse.json({ count });
  } catch (error) {
    return NextResponse.json({ error: "알림 카운트 로드 실패" }, { status: 500 });
  }
}