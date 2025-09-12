"use client";

import React, { useTransition } from "react";
import Link from "next/link";
import { deleteDocument } from "@/extentions/posts/scripts/actions/deleteDocument";
import { useRouter } from "next/navigation";

interface DocumentType {
  id: number;
  userId: number | null;
  title?: string | null;
}

interface DocumentDeleteProps {
  document: DocumentType;
  pid: string;
}

const DocumentDelete: React.FC<DocumentDeleteProps> = ({ document, pid }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  console.log(document)
  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      await deleteDocument(document.id, pid); // 서버 액션 호출
      startTransition(() => {
        router.push(`/posts/${pid}`); // 삭제 후 목록으로 이동
      });
    } catch (err: any) {
      alert(err.message || "삭제 실패");
    }
  };

  return (
    <div className={`max-w-screen-md mx-auto px-3`}>
      <div className={`text-2xl font-semibold mb-2`}>
        {document.title} 글을
      </div>
      <div className={`text-2xl font-semibold mb-4`}>정말 삭제 하시겠습니까?</div>
      <div className={`text-base mb-8 text-rose-400 `}>삭제된 데이터는 영구 삭제되며 복구 할 수 없습니다.</div>
      <div className={`flex gap-4`}>
        <button
          onClick={() => router.back()}
          className={`text-sm py-1 px-4 rounded-sm bg-cyan-100 text-cyan-600 hover:bg-cyan-200`}
        >뒤로가기
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="text-sm py-1 px-4 rounded-sm bg-red-100 text-red-600 hover:bg-rose-200"
        >
          {isPending ? "삭제 중..." : "삭제"}
        </button>
      </div>
    </div>
  );
};

export default DocumentDelete;