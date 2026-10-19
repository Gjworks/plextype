"use server";

import { getUserSessionAction } from "@/modules/user/actions/user.action";
import { revalidatePath } from "next/cache";
import { removeDocumentAction } from "./document.action";
import type { ActionResponse as ActionState } from "@/core/types/actions";
import { getAdminSession } from "@/core/utils/auth/adminSession";
import { toPreview } from "@/core/utils/content/preview";
import { notifyDeletedOwnerAction } from "@/modules/notification/actions/admin-content.action";
import {
  findRecentDocumentsAdminQuery,
  findDocumentDeleteTargetAdminQuery,
} from "./admin-content.query";
import type {
  AdminDocumentListItem,
  AdminDocumentListData,
} from "./admin-content.type";

export const getRecentDocumentsAdminAction = async (
  page = 1,
  pageSize = 20,
): Promise<ActionState<AdminDocumentListData>> => {
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
      Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 20;
    const { items, totalCount } = await findRecentDocumentsAdminQuery(
      safePage,
      safePageSize,
    );
    const formattedItems = items.map((item) => ({
      ...item,
      title: item.title || "제목 없음",
      preview: toPreview(item.content),
    }));

    return {
      success: true,
      type: "success",
      message: "최근 게시글 조회 성공",
      data: {
        items: formattedItems,
        navigation: {
          totalCount,
          totalPages: Math.ceil(totalCount / safePageSize),
          page: safePage,
          listCount: formattedItems.length,
        },
      },
    };
  } catch (error) {
    console.error("getRecentDocumentsAdminAction Error:", error);
    return {
      success: false,
      type: "error",
      message: "최근 게시글을 불러오지 못했습니다.",
    };
  }
};

export const removeDocumentAdminAction = async (
  documentId: number,
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
    const target = await findDocumentDeleteTargetAdminQuery(documentId);
    if (!target) {
      return {
        success: false,
        type: "error",
        message: "삭제할 게시글을 찾을 수 없습니다.",
      };
    }

    const result = await removeDocumentAction(documentId, target.module.mid);
    if (!result.success)
      return {
        success: false,
        type: "error",
        message: result.message || "게시글 삭제에 실패했습니다.",
      };

    await notifyDeletedOwnerAction({
      userId: target.userId,
      actorId: admin.id,
      title: "게시글이 관리자에 의해 삭제되었습니다.",
      content: `${target.title || "제목 없음"} 게시글이 운영 정책에 따라 삭제되었습니다.`,
      linkUrl: `/posts/${target.module.mid}`,
      contentType: "document",
    });

    revalidatePath("/admin/content/documents");
    revalidatePath("/admin/content");

    return {
      success: true,
      type: "success",
      message: "게시글을 삭제했습니다.",
    };
  } catch (error) {
    console.error("removeDocumentAdminAction Error:", error);
    return {
      success: false,
      type: "error",
      message: "게시글 삭제 중 오류가 발생했습니다.",
    };
  }
};
