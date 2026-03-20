// src/app/(extentions)/posts/_tpl/default/PostAttachmentList.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Attachment } from "./write"; // 기존 interface 재사용
import { getAttachmentsAction, unlinkAttachment } from "@extentions/posts/_actions/attachment.action";

interface Props {
  documentId?: number;
  tempId?: string | null;
  refreshKey?: number;
  onFileClick?: (file: Attachment) => void;
}

const PostAttachmentList = ({ documentId, tempId, refreshKey, onFileClick }: Props) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // 1. 현재 게시물에 연결된 파일 로드
  useEffect(() => {
    const loadFiles = async () => {
      // 서버 액션 호출 (URL, JSON 파싱 다 필요 없음!)
      const res = await getAttachmentsAction(documentId, tempId);

      if (res.success && res.data) {
        setAttachments(res.data);
      }
    };

    if (documentId || tempId) {
      loadFiles();
    }
  }, [documentId, tempId, refreshKey]);

  // 2. 연결 해제 처리 (물리 삭제 X)
  const handleUnlink = async (id: number) => {
    if (!confirm("이 게시물에서 제외하시겠습니까? (보관함에는 유지됩니다)")) return;

    const res = await unlinkAttachment(id);
    if (res.success) {
      setAttachments((prev) => prev.filter((a) => a.id !== id));
    } else {
      alert(res.message);
    }
  };

  if (attachments.length === 0) return null;

  return (
    <div className="mb-8 mt-4">
      <div className="flex items-center justify-between px-1 mb-4">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
          Attachments <span className="text-gray-500">{attachments.length}</span>
        </div>
      </div>

      {/* 더 촘촘한 그리드 설정: 기본 3열, 태블릿 4열, 데스크탑 6열 */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {attachments.map((file) => (
          <div
            key={file.id}
            className="group relative aspect-square bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden cursor-pointer"
            onClick={() => onFileClick?.(file)}
          >
            {/* 1. 배경 이미지/아이콘 영역 */}
            <div className="w-full h-full bg-gray-50 flex items-center justify-center">
              {file.mimeType.startsWith("image/") ? (
                <img
                  src={file.path}
                  alt={file.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex flex-col items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-300">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                  <span className="text-[8px] font-bold text-gray-400 mt-1 uppercase">{file.mimeType.split('/')[1]}</span>
                </div>
              )}
            </div>

            {/* 2. 이미지 내부 텍스트 오버레이 (하단 그라데이션) */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col justify-end p-2 transition-opacity duration-200">
          <span className="text-[10px] text-white font-medium truncate drop-shadow-sm" title={file.name}>
            {file.name}
          </span>
              <span className="text-[8px] text-white/80 font-light">
            {(file.size / 1024).toFixed(1)} KB
          </span>
            </div>

            {/* 3. 상단 삭제 버튼 (호버 시에만 나타남) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation(); // 카드 클릭 이벤트 전파 방지
                handleUnlink(file.id);
              }}
              className="absolute top-1 right-1 p-1 bg-black/20 hover:bg-red-500 backdrop-blur-sm rounded-md text-white opacity-0 group-hover:opacity-100 transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PostAttachmentList;