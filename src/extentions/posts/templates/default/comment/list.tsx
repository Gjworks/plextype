"use client";

import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ko";
import { useRouter } from "next/navigation";
import Modal from "@plextype/components/modal/Modal";
import { CommentWithChildren } from "@/extentions/posts/scripts/actions/getComments";
import { usePostContext } from "@/extentions/posts/templates/default/PostProvider";

dayjs.extend(relativeTime);
dayjs.locale("ko");

interface UpsertCommentArgs {
  documentId: number;
  content: string;
  parentId?: number;
  commentId?: number;
  options?: { deleted?: boolean; remove?: boolean };
}

interface CommentsListProps {
  documentId: number;
  commentsData: {
    items: CommentWithChildren[];
    pagination: { totalPages: number; totalCount: number; currentPage: number; pageSize: number };
  };
  upsertComment: (args: UpsertCommentArgs) => Promise<{
    items: CommentWithChildren[];
    pagination: any;
    targetPage: number;
    newCommentId?: number;
  }>;
  getCommentsPage: (page: number) => Promise<{ items: CommentWithChildren[]; pagination: any }>;
}

interface ParentComment {
  id: number;
  nickName: string | null | undefined;
  content: string;
  createdAt: string;
}

export default function CommentsList({
                                       documentId,
                                       commentsData,
                                       upsertComment,
                                       getCommentsPage,
                                     }: CommentsListProps) {
  const router = useRouter();
  const { currentUser } = usePostContext();
  const [comments, setComments] = useState(commentsData);
  const [page, setPage] = useState(commentsData.pagination.currentPage);
  const [modalContent, setModalContent] = useState("");
  const [newContent, setNewContent] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [currentTarget, setCurrentTarget] = useState<CommentWithChildren | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalParent, setModalParent] = useState<ParentComment | null>(null);
  const [commentsState, setCommentsState] = useState(commentsData);


  /** ====== 댓글 트리 구조 유지 ====== */
  const mergeComments = (
    prevItems: CommentWithChildren[],
    newItems: CommentWithChildren[]
  ): CommentWithChildren[] => {
    const commentMap = new Map<number, CommentWithChildren>();

    const flatten = (items: CommentWithChildren[]) => {
      items.forEach(item => {
        commentMap.set(item.id, { ...item, children: [] });
        if (item.children?.length) flatten(item.children);
      });
    };
    flatten(prevItems);
    flatten(newItems);

    const roots: CommentWithChildren[] = [];
    commentMap.forEach(comment => {
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(comment);
        } else {
          roots.push(comment);
        }
      } else {
        roots.push(comment);
      }
    });

    return roots;
  };



  /** ====== 댓글 자동 스크롤 + 하이라이트 ====== */
  const highlightComment = (commentId: number) => {
    setTimeout(() => {
      const el = document.getElementById(`comment-${commentId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("bg-yellow-200");
        setTimeout(() => el.classList.remove("bg-yellow-200"), 2000);
      }
    }, 100); // 렌더링 후
  };

  /** ====== 댓글 등록 ====== */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    setLoading(true);
    try {
      const result = await upsertComment({documentId, content:newContent});

// 새 댓글 페이지가 현재 페이지와 다르면 로드 후 highlight
      if (result.newCommentId && result.targetPage !== page) {
        const pageResult = await getCommentsPage(result.targetPage);
        setComments({
          items: pageResult.items,
          pagination: pageResult.pagination,
        });
        setPage(result.targetPage);
        router.replace(`?page=${result.targetPage}`, { scroll: false });
        highlightComment(result.newCommentId);
      } else if (result.newCommentId) {
        // 현재 페이지에 merge 후 highlight
        setComments(prev => ({
          ...prev,
          items: mergeComments(prev.items, result.items),
          pagination: result.pagination,
        }));
        highlightComment(result.newCommentId);
      }

      if (result.newCommentId) highlightComment(result.newCommentId);

      setNewContent("");
    } finally {
      setLoading(false);
    }
  };

  /** ====== 답글/수정 ====== */
  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalContent.trim() || !currentTarget) return;

    setLoading(true);
    try {
      const result = await upsertComment({
        documentId,
        content: modalContent,
        parentId: isEditMode ? undefined : currentTarget?.id,
        commentId: isEditMode ? currentTarget?.id : undefined,
      });

      if (result.newCommentId && result.targetPage !== page) {
        const pageResult = await getCommentsPage(result.targetPage);
        setComments({
          items: pageResult.items,
          pagination: pageResult.pagination,
        });
        setPage(result.targetPage);
        router.replace(`?page=${result.targetPage}`, { scroll: false });
      } else {
        setComments(prev => ({
          ...prev,
          items: mergeComments(prev.items, result.items),
          pagination: result.pagination,
        }));
      }

      // 새 댓글이면 하이라이트
      if (!isEditMode && result.newCommentId) highlightComment(result.newCommentId);

      setModalContent("");
      setCurrentTarget(null);
      setShowModal(false);
      setIsEditMode(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (comment: CommentWithChildren) => {
    if (!confirm("댓글을 삭제하시겠습니까? 삭제된 데이터는 복구 할 수 없습니다.")) return;
    setLoading(true);

    try {
      if (comment.children && comment.children.length > 0) {
        // 자식이 있는 경우 → 소프트 삭제
        await upsertComment({
          documentId,
          content: "",
          commentId: comment.id,
          options: { deleted: true }
        });
      } else {
        // 자식이 없는 경우 → 실제 삭제
        await upsertComment({
          documentId,
          content: "",
          commentId: comment.id,
          options: { remove: true }
        });
      }

      // 댓글 목록 갱신
      const updated = await getCommentsPage(page);

      setComments(prev => ({
        ...prev,
        items: updated.items,
        pagination: updated.pagination,
      }));
    } catch (err) {
      console.error("댓글 삭제 실패", err);
    } finally {
      setLoading(false);
    }
  };

  const openReplyModal = (comment: CommentWithChildren) => {
    setCurrentTarget(comment);
    setModalContent("");
    setIsEditMode(false);
    setShowModal(true);

    const parent: ParentComment = {
      id: comment.id,
      nickName: comment.userName,
      content: comment.content,
      createdAt: comment.createdAt,
    };
    setModalParent(parent);
  };
  const openEditModal = (comment: CommentWithChildren) => {
    setCurrentTarget(comment);
    setModalContent(comment.content);
    setIsEditMode(true);
    setShowModal(true);
  };

  /** ====== 댓글 렌더링 ====== */
  const renderComments = (comments: CommentWithChildren[], depth = 0, parentUserName?: string) =>
    comments.map(c => (
      <div
        key={c.id + "-" + c.uuid}
        id={`comment-${c.id}`}
        className={` ${c.depth > 0 ? "ml-6 " : "mb-6"}`}
      >
        <div className={` ${c.isDeleted} flex gap-4 hover:bg-gray-50 p-3 rounded-lg ${c.depth > 0 ? "py-2 mb-2" : "mb-4"}`}>
          <div>
            <div className={`flex items-center rounded-full bg-gray-200 ${c.depth > 0 ? "w-6 h-6" : " w-8 h-8"}`}></div>
          </div>
          <div className={`flex-1`}>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">{c.userName || "익명"}</span>
              <span className="text-xs text-gray-400">{dayjs(c.createdAt).fromNow()}</span>
              <div className={`flex justify-end flex-1`}>
                {!c.isDeleted && (currentUser?.isAdmin || currentUser?.id === c.userId) && (
                  <div className="flex gap-4 items-center text-sm">

                    <button className="text-sm text-gray-400 hover:text-gray-900 focus:text-gray-950 outline-none"
                            onClick={() => openEditModal(c)}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                           stroke="currentColor" className="size-4">
                        <path strokeLinecap="round" strokeLinejoin="round"
                              d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"/>
                      </svg>

                    </button>
                    <button className="text-sm text-gray-400 hover:text-gray-900 focus:text-gray-950 outline-none"
                            onClick={() => handleDelete(c)}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                           stroke="currentColor" className="size-4">
                        <path strokeLinecap="round" strokeLinejoin="round"
                              d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/>
                      </svg>

                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-1 flex py-2">
              {c.depth > 1 && (
                <span className="text-gray-900 text-sm font-medium">@{parentUserName} :</span>
              )}
              <div className={`text-gray-400 text-sm`}>{c.content}</div>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className={`flex items-center gap-1`}>
                <button className={`text-sm text-gray-400 hover:text-gray-900 focus:text-gray-95`}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                       stroke="currentColor" className="size-4">
                    <path strokeLinecap="round" strokeLinejoin="round"
                          d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z"/>
                  </svg>

                </button>
                <span className={`text-gray-400 text-xs`}>0</span>
              </div>
              <div className={`flex gap-1 items-center`}><span
                className={`w-[3px] h-[3px] rounded-full bg-gray-400`}></span></div>
              <button className="flex gap-1 text-xs text-gray-400 hover:text-gray-900 focus:text-gray-950 outline-none"
                      onClick={() => openReplyModal(c)}>
                Reply

              </button>
            </div>
          </div>
        </div>
        {c.children && renderComments(c.children, c.depth, c.userName ?? undefined)}
      </div>
    ));

  /** ====== 더보기 ====== */
  const handleLoadMore = async () => {
    if (page >= comments.pagination.totalPages) return;
    const nextPage = page + 1;
    setLoading(true);
    try {
      const result = await getCommentsPage(nextPage);
      setComments(prev => ({
        ...prev,
        items: mergeComments(prev.items, result.items),
        pagination: result.pagination,
      }));
      setPage(nextPage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`max-w-screen-md mx-auto px-2 py-16`}>
      {/* 댓글 작성 */}
      <div className="mb-12">
        <form onSubmit={handleSubmit}>
          <textarea
            className="w-full p-3 border border-gray-200/75 text-sm focus:border-gray-900 rounded-xl outline-none"
            rows={3}
            placeholder="댓글을 작성하세요..."
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
          />
          <div className="flex justify-end gap-8">
            <button type="submit" className="mt-2 px-4 py-1 text-sm bg-primary-500 text-white rounded" disabled={loading}>
              {loading ? "등록중..." : "댓글 등록"}
            </button>
          </div>
        </form>
      </div>

      {/* 댓글 목록 */}
      {renderComments(comments.items)}

      {/* 더보기 */}
      {page < comments.pagination.totalPages && (
        <div className="flex justify-center mt-5">
          <button onClick={handleLoadMore} className="px-4 py-1 bg-gray-200 rounded" disabled={loading}>
            {loading ? "불러오는중..." : "더보기"}
          </button>
        </div>
      )}

      {/* 대댓글 / 수정 모달 */}
      <Modal state={showModal} close={() => setShowModal(false)} position="center">
        <div className="p-5">
          {/* 부모 댓글 */}
          {modalParent && (
            <div className="flex gap-4 mb-8">
              <div className="rounded-full w-8 h-8 bg-gray-100 flex items-center justify-center">

              </div>
              <div className="flex-1">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold">{modalParent.nickName}</span>
                  <span className="text-xs text-gray-400">
              {dayjs(modalParent.createdAt).fromNow()}
            </span>
                </div>
                <div className="mt-1 flex py-1">
                  <div className="text-gray-500 text-sm">{modalParent.content}</div>
                </div>
              </div>
            </div>
          )}

          {/* 입력 폼 */}
          <form onSubmit={handleModalSubmit}>
      <textarea
        value={modalContent}
        onChange={e => setModalContent(e.target.value)}
        placeholder={isEditMode ? "댓글 수정" : "대댓글 작성"}
        className="w-full p-3 border border-gray-200/75 focus:border-gray-900 rounded-xl outline-none"
      />
            <div className="flex justify-end mt-2 gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-sm px-3 py-1 bg-gray-200/75 hover:bg-gray-300/75 rounded outline-none"
                disabled={loading}
              >
                취소
              </button>
              <button
                type="submit"
                className="text-sm px-8 py-1 bg-primary-600 hover:bg-primary-500 text-white rounded outline-none"
                disabled={loading}
              >
                {loading ? "등록중..." : isEditMode ? "수정 완료" : "등록"}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}