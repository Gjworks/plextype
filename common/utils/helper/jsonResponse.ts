import { NextResponse } from "next/server";

/**
 * 공통 JSON 응답 함수
 * @param status HTTP 상태 코드
 * @param message 응답 메시지
 * @param success 성공 여부 (기본값: false)
 */
export function jsonResponse(
  status: number,
  message: string,
  success: boolean = false,
) {
  return NextResponse.json(
    { success, type: success ? "success" : "error", message },
    { status },
  );
}
