import { NextResponse } from "next/server";
import { setReadStatus } from "@modules/notification/_actions/notification.action";
import {getAuthenticatedUser} from "@utils/auth/authHelper";

export async function PATCH(
  request: Request,
  { params }: { params: { uuid: string } }
) {
  try {
    const { uuid } = params;
    const user = await getAuthenticatedUser();

    const result = await setReadStatus(uuid, user.id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "알림 읽음 처리 실패" }, { status: 500 });
  }
}