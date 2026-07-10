"use client";

import {useEffect, useState, useRef, useMemo} from "react";
import Alert from "@/core/components/message/Alert"

interface Attachment {
  id: number;
  uuid: string;
  originalName: string;
  path: string;
  size: number;
  mimeType: string;
}

interface UploadFileManagerProps {
  onUploadSuccess: () => void;
  onFileClick: (file: any) => void;
  onFileDelete?: (file?: Attachment) => void;
  multiple?: boolean;
  maxFiles?: number;
  currentFileCount?: number;
  imageOnly?: boolean;
  accept?: string;
}

interface UploadFileStatus {
  file: File;
  progress: number;
  status: "uploading" | "done" | "error";
  uploadedAttachment?: Attachment;
}

export default function UploadFileManager({
                                            onUploadSuccess,
                                            onFileClick,
                                            onFileDelete,
                                            multiple = true,
                                            maxFiles,
                                            currentFileCount = 0,
                                            imageOnly = false,
                                            accept,
                                          }: UploadFileManagerProps) {
  const [files, setFiles] = useState<UploadFileStatus[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [errorData, setErrorData] = useState({ message: "", type: "" });
  const inputRef = useRef<HTMLInputElement | null>(null);



  // 파일 업로드 처리
  const handleFiles = async (selectedFiles: FileList) => {
    const imageExts = ["png", "jpg", "jpeg", "gif", "avif", "webp"];
    const imageMimeTypes = ["image/png", "image/jpeg", "image/gif", "image/avif", "image/webp"];
    const allowedExts = imageOnly ? imageExts : [...imageExts, "mp3", "mp4", "webm", "mov", "ogg", "zip"];
    const allowedMimeTypes = imageOnly ? imageMimeTypes : [
      "image/png", "image/jpeg", "image/gif", "image/avif", "image/webp",
      "audio/mpeg", "audio/ogg",
      "video/mp4", "video/webm", "video/quicktime",
      "application/zip"
    ];

    const validFiles = Array.from(selectedFiles).filter((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || "";
      const isValid = allowedExts.includes(ext) && allowedMimeTypes.includes(file.type);
      if (!isValid) setErrorData({ message: `허용되지 않는 형식: ${file.name}`, type: 'error' });
      return isValid;
    });

    if (validFiles.length === 0) return;

    const remaining = typeof maxFiles === "number" ? Math.max(maxFiles - currentFileCount, 0) : validFiles.length;
    const uploadableFiles = (multiple ? validFiles : validFiles.slice(0, 1)).slice(0, remaining);

    if (uploadableFiles.length === 0) {
      setErrorData({ message: `최대 ${maxFiles}개까지 업로드할 수 있습니다.`, type: "error" });
      return;
    }

    if (uploadableFiles.length < validFiles.length) {
      setErrorData({ message: multiple ? `최대 ${maxFiles}개까지만 업로드됩니다.` : "1개 파일만 업로드할 수 있습니다.", type: "error" });
    }

    const newFiles: UploadFileStatus[] = uploadableFiles.map((file) => ({
      file,
      progress: 0,
      status: "uploading",
    }));

    setFiles((prev) => (multiple ? [...prev, ...newFiles] : newFiles));

    for (const fileStatus of newFiles) {
      // 진행률 가짜 애니메이션 (필요시 그대로 유지)
      let progressValue = 0;
      const interval = setInterval(() => {
        progressValue = Math.min(progressValue + 10, 95);
        updateFileStatus(fileStatus.file, { progress: progressValue });
      }, 200);

      try {
        const formData = new FormData();
        formData.append("file-attachments", fileStatus.file);

        // 🌟 이제 resourceId, tempId 같은 거 안 보냅니다. 서버는 쿠키(세션)로 누군지 아니까요.
        const res = await fetch(`/api/attachments`, {
          method: "POST",
          body: formData,
        });

        clearInterval(interval);

        if (!res.ok) throw new Error("업로드 실패");

        const uploaded: Attachment = await res.json();

        updateFileStatus(fileStatus.file, {
          progress: 100,
          status: "done",
          uploadedAttachment: uploaded
        });

        // 에디터에 바로 꽂아주기
        onFileClick(uploaded);
        // 부모의 목록 갱신 트리거
        if (onUploadSuccess) onUploadSuccess();

      } catch (err: any) {
        clearInterval(interval);
        setErrorData({ message: err.message, type: 'error' });
        updateFileStatus(fileStatus.file, { status: "error", progress: 0 });
      }
    }
  };

  /** 헬퍼: 파일 상태 업데이트 */
  const updateFileStatus = (targetFile: File, update: Partial<UploadFileStatus>) => {
    setFiles(prev =>
      prev.map(f => (f.file === targetFile ? { ...f, ...update } : f))
    );
  };

  // 드래그앤드랍
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (!e.dataTransfer.files) return;
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();
  const handleDragEnter = () => setIsDragging(true);
  const handleDragLeave = () => setIsDragging(false);

  // 클릭 시 input file 열기
  const handleClick = () => {
    inputRef.current?.click();
  };

  function formatBytes(bytes: number) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    handleFiles(e.target.files);
    e.target.value = "";
  };

  // 파일 삭제
  const handleDelete = async (fileStatus: UploadFileStatus) => {
    if (fileStatus.uploadedAttachment) {
      const res = await fetch(
        `/api/attachments?fileId=${fileStatus.uploadedAttachment.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        alert("삭제 실패");
        return;
      }
    }

    setFiles((prev) => prev.filter((f) => f !== fileStatus));
    onFileDelete?.(fileStatus.uploadedAttachment);
  };

  return (
    <div className="min-w-0 max-w-full">
      <div
        className={`mb-8 min-w-0 cursor-pointer rounded-xl border border-dashed p-5 text-center transition-colors sm:p-8 ${
          isDragging
            ? "border-gray-500 bg-gray-100 dark:border-dark-500 dark:bg-dark-800"
            : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100 dark:border-dark-700 dark:bg-dark-900 dark:hover:border-dark-500 dark:hover:bg-dark-800"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <div className={`flex justify-center mb-2.5`}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2}
	               stroke="currentColor" className="size-10 text-gray-400 dark:text-dark-400">
            <path strokeLinecap="round" strokeLinejoin="round"
                  d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"/>
          </svg>
        </div>
        <p className="text-sm text-gray-500 dark:text-dark-300">파일을 여기에 끌어다 놓거나 클릭하여 선택하세요.</p>
      </div>
      {errorData.message &&
        <Alert message={errorData.message} type={errorData.type} />
      }

      {files.length > 0 && (
        <div className="space-y-2 mt-4">
          {files.map((f, idx) => (
            <div key={idx} className="flex min-w-0 items-center justify-between rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-dark-700 dark:bg-dark-900">
              <div className="mr-3 min-w-0 flex-1 sm:mr-4">
                <div className="mb-1 flex min-w-0 justify-between gap-2">
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-gray-700 dark:text-dark-200">{f.file.name}</span>
                  <span className="text-[10px] text-gray-400 dark:text-dark-400">{f.progress}%</span>
                </div>
                {/* 프로그레스 바 */}
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-dark-800">
                  <div
                    className={`h-full transition-all duration-300 ${f.status === 'error' ? 'bg-red-500' : 'bg-gray-700 dark:bg-dark-300'}`}
                    style={{ width: `${f.progress}%` }}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleDelete(f); }}
                className="text-gray-400 hover:text-red-500 dark:text-dark-400 dark:hover:text-red-400"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
      />

    </div>
  );
}
