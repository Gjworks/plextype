import { NextResponse } from "next/server";
import {getAuthenticatedUser} from "@utils/auth/authHelper";

// 만약 action에 getHistory가 있다면 추가
// import { getHistory } from "@modules/notification/_actions/notification.action";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const user = await getAuthenticatedUser();

    // 이 부분은 나중에 action.ts에 getHistory 추가하고 연결하시면 됩니다.
    // const data = await getHistory(userId, page);
    return NextResponse.json({ message: "전체 내역 API (구현 준비 중)" });
  } catch (error) {
    return NextResponse.json({ error: "데이터 로드 실패" }, { status: 500 });
  }
}