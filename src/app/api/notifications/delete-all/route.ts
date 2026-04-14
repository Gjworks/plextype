import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@utils/auth/authHelper";
import { deleteAllNotifications } from "@modules/notification/_actions/notification.action";

export async function POST() {
  try {
    // 1. 현재 로그인한 유저 확인
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });

    // 2. 해당 유저의 모든 알림 삭제 액션 호출
    await deleteAllNotifications(user.id);

    return NextResponse.json({ success: true, message: "모든 알림이 삭제되었습니다." });
  } catch (error) {
    console.error("❌ [API] 전체 삭제 에러:", error);
    return NextResponse.json({ error: "전체 삭제 실패" }, { status: 500 });
  }
}