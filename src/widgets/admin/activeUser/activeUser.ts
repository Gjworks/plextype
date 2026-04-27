'use server';

import redisClient from "@core/utils/redis/redis";
import { saveNotification } from "@/modules/notification/actions/notification.action"; // 🌟 기존 액션 불러오기

export async function getActiveUserList() {
  try {
    const activeKeys = await redisClient.keys("active_user:*");
    if (activeKeys.length === 0) return [];

    // 1. Redis 키에서 ID와 IP를 미리 추출해둡니다.
    const redisData = activeKeys.map(key => {
      const parts = key.split(":");
      const id = parts[1];
      
      // 🌟 1. 콜론이 섞인 IP를 합칩니다.
      let rawIp = parts.slice(2).join(":"); 
      
      // 🌟 2. IPv4-mapped prefix(::ffff:)를 제거합니다.
      const cleanIp = rawIp.replace(/^::ffff:/, ""); 
      
      return { id, ip: cleanIp };
    });

    const userIds = redisData.map(d => d.id);
    const profileKeys = userIds.map(id => `user:profile:${id}`);
    const rawProfiles = await redisClient.mget(...profileKeys);

    // 2. 모든 정보를 합쳐서 리턴합니다.
    return redisData.map((data, index) => {
      const profile = rawProfiles[index] ? JSON.parse(rawProfiles[index] as string) : {};
      
      return {
        id: data.id,
        ip: data.ip, // 🌟 IP 주소 배달 완료
        nickName: profile.nickName || `User #${data.id}`,
        accountId: profile.accountId || '-', // 🌟 계정 ID 배달 완료
        status: "online" as const,
      };
    });
  } catch (error) {
    console.error("데이터 수집 에러:", error);
    return [];
  }
}

export async function forceLogout(userId: string) { // 🌟 IP는 이제 참고용으로만 쓰거나 빼도 됩니다.
  try {
    // 1. 🌟 해당 유저의 모든 접속 키 찾기 (와일드카드 활용)
    // 예: active_user:3:* -> 3번 유저가 모바일, PC 등 어디서 접속했든 다 찾아냅니다.
    const pattern = `active_user:${userId}:*`;
    const keys = await redisClient.keys(pattern);

    if (keys.length > 0) {
      // 몽땅 삭제 ㅡㅡ+
      await redisClient.del(...keys);
      console.log(`[추방 성공] 유저 ${userId}의 세션 ${keys.length}개 삭제 완료`);
    }

    // 3. 알림 생성 로직 (기존 saveNotification 그대로 사용)
    await saveNotification({
      userId: Number(userId),
      type: 'warning',
      title: '강제 로그아웃',
      content: '관리자에 의해 모든 세션에서 강제 로그아웃 되었습니다.',
    });

    return { success: true };
  } catch (error) {
    console.error("추방 실패:", error);
    return { success: false };
  }
}