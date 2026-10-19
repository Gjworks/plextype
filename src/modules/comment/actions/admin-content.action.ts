"use server";

import { getUserSessionAction } from "@/modules/user/actions/user.action";
import { revalidatePath } from "next/cache";
import { removeCommentAction } from "./comment.action";
import type { ActionResponse as ActionState } from "@/core/types/actions";
import { getAdminSession } from "@/core/utils/auth/adminSession";
import { toPreview } from "@/core/utils/content/preview";
import { notifyDeletedOwnerAction } from "@/modules/notification/actions/admin-content.action";
import {
  findRecentCommentsAdminQuery,
  findCommentDeleteTargetAdminQuery,
} from "./admin-content.query";
import type {
  AdminCommentListItem,
  AdminCommentListData,
} from "./admin-content.type";

export const getRecentCommentsAdminAction = async (
  page = 1,
  pageSize = 20,
): Promise<ActionState<AdminCommentListData>> => {
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
    const { items, totalCount } = await findRecentCommentsAdminQuery(
      safePage,
      safePageSize,
    );
    const formattedItems = items.map((item) => ({
      ...item,
      content:
        toPreview(item.content) ||
        (item.isDeleted ? "삭제된 댓글입니다." : "내용 없음"),
    }));

    return {
      success: true,
      type: "success",
      message: "최근 댓글 조회 성공",
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
    console.error("getRecentCommentsAdminAction Error:", error);
    return {
      success: false,
      type: "error",
      message: "최근 댓글을 불러오지 못했습니다.",
    };
  }
};

export const removeCommentAdminAction = async (
  commentId: number,
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
    const target = await findCommentDeleteTargetAdminQuery(commentId);
    if (!target) {
      return {
        success: false,
        type: "error",
        message: "삭제할 댓글을 찾을 수 없습니다.",
      };
    }

    const postPath = `/posts/${target.document.module.mid}/${target.document.slug}`;
    const result = await removeCommentAction(
      target.documentId,
      commentId,
      postPath,
    );
    if (!result.success)
      return {
        success: false,
        type: "error",
        message: result.message || "댓글 삭제에 실패했습니다.",
      };

    await notifyDeletedOwnerAction({
      userId: target.userId,
      actorId: admin.id,
      title: "댓글이 관리자에 의해 삭제되었습니다.",
      content: `${target.document.title || "게시글"}에 작성한 댓글이 운영 정책에 따라 삭제되었습니다. ${toPreview(target.content)}`,
      linkUrl: postPath,
      contentType: "comment",
    });

    revalidatePath("/admin/content/comments");
    revalidatePath("/admin/content");

    return { success: true, type: "success", message: "댓글을 삭제했습니다." };
  } catch (error) {
    console.error("removeCommentAdminAction Error:", error);
    return {
      success: false,
      type: "error",
      message: "댓글 삭제 중 오류가 발생했습니다.",
    };
  }
};
