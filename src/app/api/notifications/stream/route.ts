// src/app/api/notifications/stream/route.ts
import { notificationEvents } from "@/core/utils/trigger/notificationEvents";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const currentUserId = searchParams.get("userId");

  const encoder = new TextEncoder();

  // 🌟 핵심 1: 더 이상 컨트롤러를 직접 호출하지 않도록 null로 관리
  let activeController: ReadableStreamDefaultController | null = null;

  const stream = new ReadableStream({
    start(controller) {
      activeController = controller;

      // 1. 초기 연결 메시지
      try {
        activeController.enqueue(encoder.encode(": connected\n\n"));
      } catch (e) {
        activeController = null;
      }

      // 2. 알림 리스너 정의
      const onNotification = (data: any) => {
        if (!activeController) return;

        // 🌟 핵심: 데이터의 수신자(data.userId)와 현재 연결된 유저(currentUserId)가 같을 때만 전송!
        // 숫자인지 문자열인지에 따라 == 또는 String() 처리가 필요할 수 있습니다.
        if (String(data.userId) !== String(currentUserId)) {
          return; // 내 알림 아니면 무시!
        }

        try {
          const payload = `data: ${JSON.stringify(data)}\n\n`;
          activeController.enqueue(encoder.encode(payload));
        } catch (err) {
          cleanup();
        }
      };

      // 3. 청소 함수
      const cleanup = () => {
        if (!activeController) return;
        notificationEvents.off("new-notification", onNotification);
        activeController = null; // 🌟 참조를 끊어서 더 이상 접근 못 하게 함
      };

      // 이벤트 등록
      notificationEvents.on("new-notification", onNotification);

      // 4. (중요) 3초마다 보내던 테스트 타이머는 삭제했습니다!
      // 하트비트가 꼭 필요하다면 30초 정도로 아주 길게 설정하세요.
    },
    cancel() {
      activeController = null;
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}