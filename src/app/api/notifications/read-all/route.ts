import { NextResponse } from "next/server";
import { setAllRead } from "@modules/notification/_actions/notification.action";
import {getAuthenticatedUser} from "@/core/utils/auth/authHelper";

export async function POST() {
  try {
    const user = await getAuthenticatedUser();
    const result = await setAllRead(user.id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "전체 읽음 처리 실패" }, { status: 500 });
  }
}