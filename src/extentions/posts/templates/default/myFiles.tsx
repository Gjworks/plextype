"use client"; // 1. 클라이언트 컴포넌트 선언

import React, { useEffect, useState } from "react";
import { getMyFiles } from "@/extentions/posts/scripts/actions/getMyFiles";
// 파일 타입 정의 (필요시 수정)
import { Attachment } from "./write";
import PageNavigation from "@plextype/components/nav/PageNavigation"; // 혹은 적절한 타입 경로
import {deleteAttachment} from "@/extentions/posts/scripts/actions/deleteAttachment";

interface Props {
  onFileSelect?: (file: Attachment) => void; // 부모에게 선택된 파일을 알리기 위한 prop
}

interface PaginationMeta {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export default function MyFiles({ onFileSelect }: Props) {
  // 2. 데이터를 저장할 State
  const [files, setFiles] = useState<any[]>([]); // 타입은 실제 데이터에 맞게 수정
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>({
    totalCount: 0,
    totalPages: 1,
    currentPage: 1,
    pageSize: 10
  });

  // ✅ 2. 페이지 변경 시 데이터 호출 (useEffect 의존성에 page 추가)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); // 페이지 이동 시 로딩 표시
      try {
        const data = await getMyFiles(page); // ✅ 현재 페이지 전달
        console.log("불러온 파일들:", data);

        setFiles(data.items);
        setPagination(data.pagination); // ✅ 서버에서 받은 페이지네이션 정보 저장

      } catch (error) {
        console.error("파일 불러오기 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page]); // ✅ page가 바뀔 때마다 실행

  // ✅ 3. 페이지 변경 핸들러
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // ✅ 2. 삭제 핸들러 추가
  const handleDelete = async (e: React.MouseEvent, fileId: number) => {
    // 🚨 중요: 부모 div의 클릭 이벤트(파일 선택)가 발생하지 않도록 막음
    e.stopPropagation();

    if (!confirm("정말 이 파일을 삭제하시겠습니까?")) return;

    try {
      const result = await deleteAttachment(fileId);

      if (result.success) {
        // UI에서 즉시 제거 (새로고침 없이)
        setFiles((prev) => prev.filter((f) => f.id !== fileId));

        // 혹은 데이터를 다시 불러오고 싶다면:
        // await fetchData();
      } else {
        alert(result.error || "삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error(error);
      alert("오류가 발생했습니다.");
    }
  };


  if (loading) return <div className="p-4 text-center">로딩 중...</div>;

  return (
    <>
      <div className="grid grid-cols-3 gap-2 p-2">
        {files.map((file, index) => (
          <div
            key={file.id || index}
            className="group relative border rounded p-2 cursor-pointer hover:bg-gray-100"
            onClick={() => {
              // 파일 클릭 시 부모(Page)에게 전달
              if (onFileSelect) onFileSelect(file);
            }}
          >
            {/* ✅ 3. 삭제 버튼 추가 (우상단) */}
            <button
              onClick={(e) => handleDelete(e, file.id)}
              className="absolute top-1 right-1 z-10 bg-white rounded-full p-1 shadow-md hover:bg-red-100 border border-gray-200"
              title="삭제"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-red-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {/* 파일 미리보기 UI 예시 */}
            {file.mimeType?.startsWith('image/') ? (
              <img src={file.path} alt={file.name} className="w-full h-20 object-cover"/>
            ) : (
              <div className="h-20 flex items-center justify-center bg-gray-50 text-xs break-all">
                {file.name}
              </div>
            )}
          </div>
        ))}


        {files.length === 0 && (
          <div className="col-span-3 text-center text-gray-500 py-4">
            파일이 없습니다.
          </div>
        )}


      </div>
      {/* ✅ 페이지네이션 영역 (Grid 밖으로 뺌) */}
      <div className="pt-4 pb-4 mt-auto">
        <div className="flex justify-center w-full">
          <PageNavigation
            page={page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </>
  );
}