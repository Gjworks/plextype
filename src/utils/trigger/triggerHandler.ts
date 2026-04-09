// src/utils/trigger/triggerHandlers.ts
import { saveNotification } from "@modules/notification/_actions/notification.action";
import { notificationEvents } from "./notificationEvents";

export const sendNotification = async (data: any) => {
  // 🌟 이 로그가 터미널에 찍히는지 꼭 확인해주세요!
  console.log("🔔 [Handler] sendNotification 함수가 실행됨!!!", data);

  try {
    await saveNotification({ ...data });
    console.log("✅ [Handler] DB 저장 완료");

    // 🌟 이 신호가 가야 API Route가 반응합니다.
    notificationEvents.emit("new-notification", data);
    console.log("🚀 [Handler] API로 이벤트 송신 완료!");
  } catch (error) {
    console.error("❌ [Handler] 에러 발생:", error);
  }
};

export const createProfile = async (data: any) => {
  console.log(`${data.userName}님의 프로필을 생성합니다. ID: ${data.userId}`);
};