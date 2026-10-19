"use server";

import { getUserSessionAction } from "@/modules/user/actions/user.action";
import { revalidatePath } from "next/cache";
import { deleteAttachmentAction } from "./attachment.action";
import type { ActionResponse as ActionState } from "@/core/types/actions";
import { getAdminSession } from "@/core/utils/auth/adminSession";
import { toPreview } from "@/core/utils/content/preview";
import { notifyDeletedOwnerAction } from "@/modules/notification/actions/admin-content.action";
import {
  findRecentAttachmentsAdminQuery,
  findAttachmentDeleteTargetAdminQuery,
} from "./admin-content.query";
import type {
  AdminAttachmentListItem,
  AdminAttachmentListData,
} from "./admin-content.type";

export const getRecentAttachmentsAdminAction = async (
  page = 1,
  pageSize = 24,
): Promise<ActionState<AdminAttachmentListData>> => {
  const sessionInfo = await getUserSessionAction();

  if (!sessionInfo?.data?.isAdmin) {
    return {
      success: false,
      type: "error",
      message: "관리자 권한이 필요합니다.",
    };
  }

  try {
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safePageSize =
      Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 24;
    const { items, totalCount } = await findRecentAttachmentsAdminQuery(
      safePage,
      safePageSize,
    );

    return {
      success: true,
      type: "success",
      message: "최근 첨부파일 조회 성공",
      data: {
        items,
        navigation: {
          totalCount,
          totalPages: Math.ceil(totalCount / safePageSize),
          page: safePage,
          listCount: items.length,
        },
      },
    };
  } catch (error) {
    console.error("getRecentAttachmentsAdminAction Error:", error);
    return {
      success: false,
      type: "error",
      message: "최근 첨부파일을 불러오지 못했습니다.",
    };
  }
};

export const removeAttachmentAdminAction = async (
  attachmentId: number,
): Promise<ActionState<null>> => {
  const admin = await getAdminSession();

  if (!admin) {
    return {
      success: false,
      type: "error",
      message: "관리자 권한이 필요합니다.",
    };
  }

  try {
    const target = await findAttachmentDeleteTargetAdminQuery(attachmentId);
    if (!target) {
      return {
        success: false,
        type: "error",
        message: "삭제할 첨부파일을 찾을 수 없습니다.",
      };
    }

    const result = await deleteAttachmentAction(attachmentId);
    if (!result.success)
      return {
        success: false,
        type: "error",
        message: result.message || "첨부파일 삭제에 실패했습니다.",
      };

    await notifyDeletedOwnerAction({
      userId: target.userId,
      actorId: admin.id,
      title: "첨부파일이 관리자에 의해 삭제되었습니다.",
      content: `${target.originalName || target.fileName} 파일이 운영 정책에 따라 삭제되었습니다.`,
      contentType: "attachment",
    });

    revalidatePath("/admin/content/attachments");
    revalidatePath("/admin/content");

    return {
      success: true,
      type: "success",
      message: "첨부파일과 실제 파일을 삭제했습니다.",
    };
  } catch (error) {
    console.error("removeAttachmentAdminAction Error:", error);
    return {
      success: false,
      type: "error",
      message: "첨부파일 삭제 중 오류가 발생했습니다.",
    };
  }
};
