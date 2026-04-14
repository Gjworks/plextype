// src/hooks/notification/useRealtimeNotification.ts
import { useEffect } from "react";
import { useToastStore } from "@/store/useToastStore";

// src/hooks/notification/useRealtimeNotification.ts

export function useRealtimeNotification(userId: string | number | undefined) {
  const addToast = useToastStore((state) => state.addToast);

  useEffect(() => {
    if (!userId) return; // 로그인 안 했으면 연결 안 함

    // 🌟 URL 뒤에 userId를 쿼리 스트링으로 붙입니다.
    const eventSource = new EventSource(`/api/notifications/stream?userId=${userId}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // 여기서도 한 번 더 체크하면 좋지만, 서버에서 걸러주는 게 정석!
        addToast(data.content, "info", {
          title: data.title,
          imageUrl: data.imageUrl,
          linkUrl: data.linkUrl,
        });

        window.dispatchEvent(new Event('refresh-unread'));
      } catch (err) {
        console.error("SSE 파싱 에러:", err);
      }
    };

    return () => eventSource.close();
  }, [userId, addToast]);
}