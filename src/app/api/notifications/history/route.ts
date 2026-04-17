import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/core/utils/auth/authHelper";
import { findHistoryPage } from "@modules/notification/_actions/notification.action"; // 액션에서 가져오기

export async function GET(request: Request) {
  try {
    // 1. 유저 인증 (로그인 안 되어 있으면 컷!)
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "인증되지 않은 유저입니다." }, { status: 401 });
    }

    // 2. 쿼리 스트링에서 페이지 번호와 개수 가져오기 (기본값: 1페이지, 20개)
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 5;
    const skip = (page - 1) * limit;

    // 3. DB에서 히스토리 데이터 조회
    const history = await findHistoryPage(user.id, skip, limit);
    console.log(history)
    // 4. 결과 반환
    return NextResponse.json(history);
  } catch (error) {
    console.error("❌ [API] 히스토리 로드 에러:", error);
    return NextResponse.json({ error: "알림 기록을 불러오는데 실패했습니다." }, { status: 500 });
  }
}