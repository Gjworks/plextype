"use client";

import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import { motion, AnimatePresence } from "framer-motion";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ko";
import { useRouter } from "next/navigation";
import Modal from "@components/modal/Modal";
import Button from "@components/button/Button";
import { usePostContext } from "@/modules/posts/tpl/default/PostProvider";
import { CommentWithChildren } from "@/modules/comment/actions/_type";

dayjs.extend(relativeTime);
dayjs.locale("ko");

interface UpsertCommentArgs {
  documentId: number;
  content: string;
  parentId?: number;
  commentId?: number;
  options?: { deleted?: boolean; remove?: boolean };
}

// 🌟 서버 액션의 리턴 타입과 일치시킵니다.
interface UpsertResponse {
  success: boolean;
  item?: CommentWithChildren;
  data?: CommentWithChildren;
  message?: string;
  actionType: 'CREATE' | 'UPDATE' | 'DELETE';
}

interface CommentsListProps {
  documentId: number;
  commentsData: {
    items: CommentWithChildren[];
    pagination: { totalPages: number; totalCount: number; currentPage: number; pageSize: number };
  };
  // Page.tsx에서 넘겨주는 함수의 모양과 똑같이 맞춤
  upsertComment: (args: {
    documentId: number;
    content: string;
    parentId?: number;
    commentId?: number;
    options?: { deleted?: boolean; remove?: boolean };
  }) => Promise<UpsertResponse>;

  getCommentsPage: (page: number) => Promise<any>;
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
  const { permissions } = usePostContext();

  // props로 넘어온 데이터가 변경되면 내부 상태도 동기화
  useEffect(() => {
    setComments(commentsData);
  }, [commentsData]);

  if (!permissions.doRead) {
    return "";
  }

  /** ====== 댓글 트리 구조 유지 ====== */
  const mergeComments = (
    prevItems: CommentWithChildren[] = [],
    newItems: CommentWithChildren[] = []
  ): CommentWithChildren[] => {
    const commentMap = new Map<number, CommentWithChildren>();

    const flatten = (items: CommentWithChildren[]) => {
      if (!items || !Array.isArray(items)) return;
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
        el.classList.add("bg-yellow-100");
        setTimeout(() => el.classList.remove("bg-yellow-100"), 2000);
      }
    }, 100); // 렌더링 후
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    setLoading(true);
    try {
      const result = await upsertComment({ documentId, content: newContent });

      // 🌟 result.item 혹은 (result as any).data 둘 다 확인하도록 수정
      const newComment = result.item || (result as any).data;

      if (result.success && newComment) {
        setComments(prev => ({
          ...prev,
          items: [newComment, ...prev.items],
          pagination: {
            ...prev.pagination,
            totalCount: prev.pagination.totalCount + 1
          }
        }));

        highlightComment(newComment.id);

        // ✅ 여기서 확실하게 비워줍니다!
        setNewContent("");
        router.refresh();
      } else {
        // 실패 시 에러 메시지라도 띄워보면 디버깅이 쉽습니다.
        alert(result.message || "댓글 등록에 실패했습니다.");
      }
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

      // 🌟 여기도 마찬가지로 데이터 키값 확인
      const updatedItem = result.item || (result as any).data;

      if (result.success && updatedItem) {
        if (result.actionType === 'CREATE') {
          setComments(prev => ({
            ...prev,
            items: mergeComments(prev.items, [updatedItem]),
            pagination: { ...prev.pagination, totalCount: prev.pagination.totalCount + 1 }
          }));
          highlightComment(updatedItem.id);
        } else {
          setComments(prev => ({
            ...prev,
            items: prev.items.map(it => it.id === updatedItem.id ? updatedItem : it)
          }));
        }

        // ✅ [해결] 성공 시 무조건 모달 닫고 내용 비우기
        setShowModal(false);
        setModalContent("");
        router.refresh();
      } else {
        alert(result.message || "저장에 실패했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (comment: CommentWithChildren) => {
    if (!confirm("삭제하시겠습니까?")) return;
    setLoading(true);

    try {
      const res = await upsertComment({
        documentId,
        content: "",
        commentId: comment.id,
        options: {
          deleted: !!(comment.children && comment.children.length > 0),
          remove: !(comment.children && comment.children.length > 0)
        }
      });

      if (res.success) {
        // ✅ 삭제 후 현재 페이지 목록을 다시 가져옴
        const updatedRes = await getCommentsPage(page);

        // ✅ 중요: ActionState 포장지에서 data({ items, pagination })만 쏙 꺼내서 전달
        if (updatedRes.success && updatedRes.data) {
          setComments(updatedRes.data);
        }
      }
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
      // 🌟 Date 객체를 string으로 변환 (dayjs 활용)
      createdAt: dayjs(comment.createdAt).toISOString(),
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
  const renderComments = (comments: CommentWithChildren[], depth = 0, parentUserName?: string): React.ReactNode => {
    return comments.map((c, index) => {
      const isLast = index === comments.length - 1;

      return (
        <div
          key={`${c.id}-${c.uuid}`}
          id={`comment-${c.id}`}
          className="relative"
        >
          {/* 🧶 [기둥 선] 자식이 있을 때만 아바타 아래로 길게 내림 (중복 방지를 위해 부모만 담당) */}
          {c.children && c.children.length > 0 && (
            <div className="absolute left-[19px] top-10 bottom-0 w-[1px] bg-gray-100 dark:bg-gray-800 z-0" />
          )}

          <div className={`relative flex items-start ${depth > 0 ? "ml-10 mb-6" : "mb-8"}`}>

            {/* 🧵 [연결 꺽쇠] 대댓글일 때만 왼쪽 기둥에서 아바타로 연결 (ㄴ자만 담당) */}
            {depth > 0 && (
              <div
                className={`absolute left-[-21px] w-[21px] z-0 border-gray-100 dark:border-gray-800
                ${isLast
                  ? "top-[-32px] h-[52px] border-l-[1px] border-b-[1px] rounded-bl-xl"
                  : "top-[-32px] h-[52px] border-l-[1px] border-b-[1px] rounded-bl-xl"
                }
              `}
                /* 팁: 여기서 h-full이나 bottom-0을 쓰지 않고 고정 높이와 음수 top을 활용해
                   기존 기둥 선과 자연스럽게 '접점'만 생기도록 조절했습니다.
                */
              />
            )}

            {/* 1. 아바타 영역 */}
            <div className="relative shrink-0 z-10">
              <div className={`
              flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-white dark:border-dark-900
              ${depth > 0 ? "w-7 h-7" : "w-10 h-10"}
            `}>
              <span className={`font-bold text-gray-400 uppercase ${depth > 0 ? "text-[10px]" : "text-xs"}`}>
                {c.userName?.slice(0, 1) || "익"}
              </span>
              </div>
            </div>

            {/* 2. 본문 카드 영역 */}
            <div className="flex-1 min-w-0 ml-3">
              <div className="group relative transition-all duration-200">
                {/* 상단: 작성자 및 시간 */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-gray-900 dark:text-gray-100">{c.userName || "익명"}</span>
                    <span className="text-[10px] text-gray-400">{dayjs(c.createdAt).fromNow()}</span>
                  </div>

                  {!c.isDeleted && (currentUser?.isAdmin || currentUser?.id === c.userId) && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        onClick={() => openEditModal(c)}
                        className="!p-1 !text-gray-300 hover:!text-blue-500 !bg-transparent"
                        icon={<svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"/></svg>}
                      />
                      <Button
                        onClick={() => handleDelete(c)}
                        className="!p-1 !text-gray-300 hover:!text-red-400 !bg-transparent"
                        icon={<svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/></svg>}
                      />
                    </div>
                  )}
                </div>

                <div className="text-[14px] text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
                  {c.depth > 1 && parentUserName && (
                    <span className="text-blue-500 font-bold mr-1.5 opacity-80">@{parentUserName}</span>
                  )}
                  {c.isDeleted ? <span className="text-gray-300 italic text-xs">삭제된 댓글입니다.</span> : c.content}
                </div>

                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-1 group/like text-gray-300 hover:text-rose-400 transition-colors cursor-pointer">
                    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
                    <span className="text-[11px] font-bold">0</span>
                  </button>
                  <button
                    onClick={() => openReplyModal(c)}
                    className="text-[11px] font-bold text-gray-300 hover:text-blue-500 transition-colors uppercase tracking-tight cursor-pointer"
                  >
                    Reply
                  </button>
                </div>
              </div>
            </div>
          </div>

          {c.children && renderComments(c.children, depth + 1, c.userName ?? undefined)}
        </div>
      );
    });
  };

  /** ====== 더보기 ====== */
  const handleLoadMore = async () => {
    if (page >= comments.pagination.totalPages) return;
    const nextPage = page + 1;
    setLoading(true);
    try {
      const result = await getCommentsPage(nextPage);

      // 🌟 중요: result가 아니라 result.data.items를 전달해야 함
      if (result.success && result.data) {
        setComments(prev => ({
          ...prev,
          items: mergeComments(prev.items, result.data.items), // ✅ data.items 확인!
          pagination: result.data.pagination,
        }));
        setPage(nextPage);
      }
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className={`max-w-screen-md mx-auto px-2 py-16`}>
      {/* 댓글 작성 */}
      {permissions.doComment && (
        <div className="mb-12 group">
          <form onSubmit={handleSubmit} className="mb-12">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-200/50 transition-all duration-300 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10"
            >
              {/* 1. 상단 정보 바 (Status Bar) */}
              <div className="px-4 py-2 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">New Comment</span>
                </div>
                <div className="text-[10px] text-gray-400 font-medium italic">
                  {currentUser?.nickName}님으로 작성 중
                </div>
              </div>

              {/* 2. 메인 입력 영역 */}
              <textarea
                className="w-full p-5 text-sm bg-transparent outline-none resize-none min-h-[140px] text-gray-700 placeholder:text-gray-300 leading-relaxed transition-all"
                placeholder="따뜻한 댓글은 작성자에게 큰 힘이 됩니다..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
              />

              {/* 3. 하단 툴바 및 버튼 바 */}
              <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center transition-colors group-focus-within:bg-white">
                {/* 왼쪽: 도움말 또는 글자 수 */}
                <div className="flex flex-col">
        <span className="text-[10px] text-gray-400 font-medium">
          {newContent.length > 0 ? "정성껏 작성 중..." : "최소 2자 이상 입력"}
        </span>
                  <span className="text-[10px] text-gray-300 font-mono tracking-tighter">
          {newContent.length} / 1000 characters
        </span>
                </div>

                {/* 오른쪽: 등록 버튼 */}
                <Button
                  type="submit"
                  isLoading={loading}
                  disabled={!newContent.trim()}
                  className={`
          !py-2.5 !px-6 !rounded-xl !font-bold transition-all
          ${newContent.trim()
                    ? "!bg-blue-500 !text-white shadow-lg shadow-blue-500/20"
                    : "!bg-gray-100 !text-gray-400"
                  }
        `}
                  icon={!loading && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                    </svg>
                  )}
                >
                  댓글 등록
                </Button>
              </div>
            </motion.div>
          </form>
        </div>
      )}


      {/* 댓글 목록 */}
      {renderComments(comments.items)}

      {/* 더보기 */}
      {page < comments.pagination.totalPages && (
        <div className="relative flex items-center justify-center my-12 px-4">
          {/* 🧶 배경을 가로지르는 은은한 구분선 */}
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-100 dark:border-gray-800"></div>
          </div>

          {/* 🌟 Button 컴포넌트 활용 */}
          <Button
            onClick={handleLoadMore}
            isLoading={loading}
            className="
        !relative !bg-white dark:!bg-dark-900 !px-8 !py-2.5 !rounded-full
        !border-gray-200 !text-gray-400
        hover:!border-blue-400 hover:!text-blue-500
        shadow-sm transition-all duration-300
      "
            icon={
              !loading && (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              )
            }
          >
            {loading ? "불러오는 중" : "댓글 더보기"}
          </Button>
        </div>
      )}

      {/* 대댓글 / 수정 모달 */}
      <Modal state={showModal} close={() => setShowModal(false)} position="center">
        <div className="p-6">
          <div className="relative">
            {/* 1. 부모 댓글 (Context) */}
            {!isEditMode && modalParent && (
              <div className="relative flex gap-3 pb-2">
                {/* 🧶 수직 연결선 (부모 아바타 아래에서 시작) */}
                <div
                  className="absolute left-[15px] top-8 bottom-0 w-[2px] bg-gray-100"
                  style={{ height: 'calc(100% + 16px)' }} // 아래 입력창까지 강제로 연결
                />

                <div className="shrink-0 z-10">
                  <div className="w-12 h-12 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center shadow-sm">
            <span className="text-[16px] text-gray-400 font-bold uppercase">
              {modalParent.nickName?.slice(0, 1)}
            </span>
                  </div>
                </div>

                <div className="flex-1 bg-gray-50/50 rounded-2xl p-3 border border-gray-100 overflow-hidden">
                  {/* 1. 상단 메타 정보 (고정) */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] font-bold text-gray-700">@{modalParent.nickName}</span>
                    <span className="text-[10px] text-gray-400 font-medium">
      {dayjs(modalParent.createdAt).fromNow()}
    </span>
                  </div>

                  {/* 2. 내용 영역 (스크롤 적용) */}
                  <div className="relative">
                    <p className="text-[13px] text-gray-500 leading-relaxed max-h-[80px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                      {modalParent.content}
                    </p>

                    {/* 🌟 선택 사항: 내용이 아주 길 때 하단이 잘린 느낌을 주는 그라데이션 페이드 */}
                    <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-gray-50/80 to-transparent pointer-events-none" />
                  </div>
                </div>
              </div>
            )}

            {/* 2. 대댓글 입력 폼 */}
            <form
              onSubmit={handleModalSubmit}
              className={`relative ${!isEditMode ? "pl-11 pt-2" : ""}`}
            >
              {/* 🧶 L자형 연결 커브 (선이 끊어지지 않게 보정) */}
              {!isEditMode && modalParent && (
                <div
                  className="absolute left-[15px] top-[-10px] w-7 h-8 border-l-2 border-b-2 border-gray-100 rounded-bl-xl"
                  style={{ pointerEvents: 'none' }}
                />
              )}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-100 transition-all duration-300 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10"
              >
                {/* 입력창 상단: 유저 정보 */}
                <div className="px-4 py-2 border-b border-gray-50 bg-gray-50/30 flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            {isEditMode ? "Edit Comment" : "New Reply"}
          </span>
                </div>

                <textarea
                  value={modalContent}
                  onChange={(e) => setModalContent(e.target.value)}
                  placeholder={isEditMode ? "내용을 수정해주세요..." : "따뜻한 답변을 기다리고 있어요."}
                  className="w-full p-4 text-sm bg-transparent outline-none resize-none min-h-[140px] text-gray-700 placeholder:text-gray-300 leading-relaxed"
                  autoFocus
                />

                {/* 입력창 하단: 툴바 스타일 */}
                <div className="px-4 py-2 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center">
                  <div className="flex gap-2">
                    {/* 나중에 이모지나 파일첨부 버튼이 들어갈 자리 */}
                    <div className="w-2 h-2 rounded-full bg-gray-200" />
                    <div className="w-2 h-2 rounded-full bg-gray-200" />
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono tracking-tight">
            {modalContent.length} / 1000
          </span>
                </div>
              </motion.div>

              {/* 3. 하단 버튼 그룹 */}
              <div className="flex justify-end mt-4 gap-2">
                <Button
                  type="button"

                  onClick={() => setShowModal(false)}
                  disabled={loading}
                  className="!text-gray-400 font-semibold hover:!bg-gray-200 hover:!text-gray-600"
                >
                  취소
                </Button>

                <Button
                  type="submit"

                  isLoading={loading}
                  className={
                    isEditMode
                      ? "!bg-blue-100 !text-blue-600 hover:!bg-blue-600 hover:!text-white !px-7 !font-bold"
                      : "!bg-blue-600 !text-white hover:!bg-blue-700 !px-7 !font-bold shadow-lg shadow-blue-600/20"
                  }
                  icon={!loading && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                      <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925a1.5 1.5 0 001.035 1.035l4.925 1.414a.75.75 0 000 1.44l-4.925 1.414a1.5 1.5 0 00-1.035 1.035l-1.414 4.925a.75.75 0 00.95.826l14.823-7.412a.75.75 0 000-1.342L3.105 2.29z" />
                    </svg>
                  )}
                >
                  {isEditMode ? "수정" : "보내기"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </Modal>
    </div>
  );
}