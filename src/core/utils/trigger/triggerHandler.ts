// src/utils/trigger/triggerHandler.ts

import { saveNotification } from "@/modules/notification/actions/notification.action";
import { notificationEvents } from "./notificationEvents";

export const sendNotification = async (data: any, context: any) => {
  // 1. 행위자(Actor): 현재 로그인해서 댓글 쓴 사람 (크롬 유저 1 혹은 사파리 유저 2)
  const actorId = context?.user?.id;

  // 2. 수신자(Target): trigger.json에서 "userId"로 매핑된 값 (게시글 주인)
  const targetId = data?.userId;

  console.log(`[Trigger] Actor(쓴사람): ${actorId}, Target(받을사람): ${targetId}`);

  // 방어 코드
  if (!targetId) {
    console.warn("⚠️ [Trigger Warning]: 매핑된 userId가 없습니다. trigger.json을 확인하세요.");
    return;
  }

  // 3. 본인 제외 로직
  // 크롬(1)이 크롬(1) 글에 쓰면 여기서 걸러짐!
  // 사파리(2)가 크롬(1) 글에 쓰면 (2 === 1 아니니까) 통과!
  if (String(actorId) === String(targetId)) {
    console.log("ℹ️ 본인 액션이므로 알림을 저장하지 않습니다.");
    return;
  }

  try {
    // 🌟 이미 data 안에 userId, title, content, metadata(appId 포함)가 다 들어있음!
    await saveNotification({ ...data });

    // 실시간 신호 쏴주기
    notificationEvents.emit("new-notification", data);

    console.log(`✅ [Success] ${targetId}님에게 알림 저장 성공! (App: ${data.metadata?.appId})`);
  } catch (error) {
    console.error("❌ 알림 저장 실패:", error);
  }
};