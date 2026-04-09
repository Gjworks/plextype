import { NextResponse } from "next/server";
import { getUnreadList } from "@modules/notification/_actions/notification.action";
import {getAuthenticatedUser} from "@utils/auth/authHelper";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    const notifications = await getUnreadList(user.id);
    return NextResponse.json(notifications);
  } catch (error) {
    return NextResponse.json({ error: "목록 로드 실패" }, { status: 500 });
  }
}