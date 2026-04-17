import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/core/utils/auth/authHelper";
import { setReadStatus } from "@modules/notification/_actions/notification.action";

// 🌟 params의 타입을 Promise로 감싸주는 게 핵심입니다.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    // 1. Next.js 15 규격에 맞게 params를 await 합니다.
    const { uuid } = await params;

    // 2. 유저 인증
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "인증 실패" }, { status: 401 });
    }

    // 3. 읽음 처리 액션 실행
    const result = await setReadStatus(uuid, user.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ [API] 읽음 처리 에러:", error);
    return NextResponse.json({ error: "처리 실패" }, { status: 500 });
  }
}