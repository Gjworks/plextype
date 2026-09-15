"use server";

import { getUserSessionAction } from "@/modules/user/actions/user.action";
import { readInstallerInventory } from "./inventory.query";
import type { InstallerState } from "./_type";

export async function getInstallerOverviewAdminAction(): Promise<InstallerState> {
  const session = await getUserSessionAction();
  if (!session.success || !session.data?.isAdmin) {
    return { success: false, message: "관리자 권한이 필요합니다." };
  }
  try {
    const inventory = await readInstallerInventory();
    return {
      success: true,
      message: "패키지 정보를 확인했습니다.",
      data: {
        ...inventory,
        environment: process.env.NODE_ENV === "development" ? "development" : "production",
        storeConnected: false,
      },
    };
  } catch {
    return { success: false, message: "설치된 패키지를 읽지 못했습니다. 서버의 확장 폴더 접근 권한을 확인해 주세요." };
  }
}
