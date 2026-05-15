"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { verify } from "@utils/auth/jwtAuth";

import { ActionState } from "@/modules/posts/actions/_type";
import * as query from "./issuetracker.query";

async function getLoggedInfo() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  if (!accessToken) return null;
  const verified = await verify(accessToken);
  if (!verified?.id) return null;
  return { id: verified.id, isAdmin: Boolean(verified.isAdmin) };
}

function isIssueTrackerDocument(document: any) {
  return document?.module?.config?.skin === "issuetracker";
}

async function updateIssueStatusAction(id: number, status: "open" | "closed"): Promise<ActionState<{ id: number; status: string | null }>> {
  try {
    const loggedInfo = await getLoggedInfo();
    if (!loggedInfo) return { success: false, type: "error", message: "로그인이 필요합니다." };

    const document = await query.findIssueDocumentForStatus(id);
    if (!document) return { success: false, type: "error", message: "존재하지 않는 이슈입니다." };

    if (!isIssueTrackerDocument(document)) {
      return { success: false, type: "error", message: "이슈 트래커 게시글이 아닙니다." };
    }

    if (document.userId !== loggedInfo.id && !loggedInfo.isAdmin) {
      return { success: false, type: "error", message: "이슈 상태를 변경할 권한이 없습니다." };
    }

    const updated = await query.updateIssueStatus(id, status);
    revalidatePath(`/posts/${document.module.mid}`);
    revalidatePath(`/posts/${document.module.mid}/${document.slug}`);

    return {
      success: true,
      type: "success",
      message: status === "open" ? "이슈가 열렸습니다." : "이슈가 닫혔습니다.",
      data: updated,
    };
  } catch (error) {
    console.error("updateIssueStatusAction 에러:", error);
    return { success: false, type: "error", message: "이슈 상태 변경 중 오류가 발생했습니다." };
  }
}

export async function openIssueAction(id: number) {
  return updateIssueStatusAction(id, "open");
}

export async function closeIssueAction(id: number) {
  return updateIssueStatusAction(id, "closed");
}
