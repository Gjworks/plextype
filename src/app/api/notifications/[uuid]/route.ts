import { NextResponse } from "next/server";
import { removeNotification } from "@modules/notification/_actions/notification.action";
import {getAuthenticatedUser} from "@/core/utils/auth/authHelper";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    // 1. 🌟 Next.js 16 규격에 맞춰 params를 await 합니다.
    const { uuid } = await params;

    // 2. 유저 인증 확인
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "인증 실패" }, { status: 401 });
    }

    // 3. 알림 삭제 액션 호출 (이미 보안 처리가 되어 있을 거예요)
    const result = await removeNotification(uuid, user.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ [API] 삭제 처리 에러:", error);
    return NextResponse.json({ error: "삭제 실패" }, { status: 500 });
  }
}