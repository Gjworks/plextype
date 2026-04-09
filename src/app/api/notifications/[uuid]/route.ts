import { NextResponse } from "next/server";
import { removeNotification } from "@modules/notification/_actions/notification.action";
import {getAuthenticatedUser} from "@utils/auth/authHelper";

export async function DELETE(
  request: Request,
  { params }: { params: { uuid: string } }
) {
  try {
    const { uuid } = params;
    const user = await getAuthenticatedUser();

    const result = await removeNotification(uuid, user.id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "알림 삭제 실패" }, { status: 500 });
  }
}