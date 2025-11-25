"use client";

import {useEffect, useState, useRef, useMemo} from "react";
import { v4 as uuidv4 } from "uuid";
import Alert from "common/components/message/Alert"
interface Attachment {
  id: number;
  uuid:string;
  originalName: string;
  path: string;
  size: number;
  mimeType: string;
  name: string;
}

interface UploadFileManagerProps {
  resourceType: string;
  resourceId: number;
  documentId: number;
  tempId: string | null;
  onTempId: (id: string | null) => void;
  onFileClick?: (file: Attachment) => void; // ✅ 추가
  // onUpdate?: (files: Attachment[]) => void;
}

interface UploadFileStatus {
  file: File;
  progress: number;
  status: "uploading" | "done" | "error";
  uploadedAttachment?: Attachment;
}

export default function UploadFileManager({
                                            resourceType,
                                            resourceId,
                                            documentId,
                                            onTempId,
                                            onFileClick
                                            // onUpdate,
                                          }: UploadFileManagerProps) {
  const [files, setFiles] = useState<UploadFileStatus[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [errorData, setErrorData] = useState<{ message: string; type: string }>({
    message: "",
    type: "",
  });
  const inputRef = useRef<HTMLInputElement | null>(null);

  const isTemporary = documentId === 0;

  const tempId = useMemo(() => (isTemporary ? crypto.randomUUID() : null), [isTemporary]);
  // const finalResourceId = isTemporary ? 0 : resourceId;

  useEffect(() => {
    if (isTemporary && onTempId) {
      onTempId(tempId);
    } else if (onTempId) {
      onTempId(null);
    }
  }, [isTemporary, tempId, onTempId]);

  // 기존 파일 목록 불러오기
  useEffect(() => {
    const fetchFiles = async () => {
      if (!resourceType) return;

      // 새 글인 경우(tempId로), 기존 글인 경우(resourceId로)
      const queryParams = new URLSearchParams({
        resourceType,
        ...(resourceId ? { resourceId: String(resourceId) } : {}),
        ...(documentId > 0 ? { documentId: String(documentId) } : tempId ? { tempId } : {}),
      });

      if (![...queryParams.keys()].includes("documentId") && !tempId) return;

      const res = await fetch(`/api/attachments?${queryParams.toString()}`);
      if (!res.ok) return;
      const existingFiles: Attachment[] = await res.json();
      console.log(existingFiles)
      const initialFiles: UploadFileStatus[] = existingFiles.map((f) => ({
        file: new File([], f.originalName),
        progress: 100,
        status: "done",
        uploadedAttachment: f,
      }));

      console.log(initialFiles)

      setFiles(initialFiles);
      // onUpdate?.(existingFiles);
    };

    fetchFiles();
  }, [resourceType, resourceId, documentId, tempId]);

  // 파일 업로드 처리
  const handleFiles = async (selectedFiles: FileList) => {
    let currentTempId = tempId;
    if (!documentId && !tempId) {
      currentTempId = crypto.randomUUID();
      onTempId(currentTempId);
    }

    // ✅ 1️⃣ 업로드 전에 필터링 (여기가 핵심)
    const allowedExts = [
      "png", "jpg", "jpeg", "gif",
      "mp3", "mp4", "avif", "webm", "webp",
      "mov", "ogg", "zip"
    ];

    const allowedMimeTypes = [
      "image/png", "image/jpeg", "image/gif", "image/avif", "image/webp",
      "audio/mpeg", "audio/ogg",
      "video/mp4", "video/webm", "video/quicktime",
      "application/zip"
    ];

    const validFiles = Array.from(selectedFiles).filter((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || "";
      const isValid = allowedExts.includes(ext) && allowedMimeTypes.includes(file.type);

      if (!isValid) {
        console.warn(`🚫 업로드 불가 파일: ${file.name} (${file.type})`);
        setErrorData({message:'허용되지 않은 파일 형식입니다.', type:'error'})
      }

      return isValid;
    });

    const newFiles: UploadFileStatus[] = Array.from(selectedFiles).map((file) => ({
      file,
      progress: 0,
      status: "uploading",
      tempKey: crypto.randomUUID(), // 추가
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    // 순차적으로 업로드 처리
    for (const fileStatus of newFiles) {
      // 진행률 더미 애니메이션
      let progressValue = 0;
      const interval = setInterval(() => {
        progressValue = Math.min(progressValue + Math.random() * 5, 90);
        setFiles(prev =>
          prev.map(f =>
            f.file.name === fileStatus.file.name && f.file.size === fileStatus.file.size
              ? { ...f, progress: progressValue }
              : f
          )
        );
      }, 200);

      try {
        const formData = new FormData();
        formData.append("file-attachments", fileStatus.file);

        formData.append("file-attachments", fileStatus.file);
        formData.append("resourceType", resourceType);
        formData.append("resourceId", String(resourceId));
        formData.append("documentId", String(documentId));
        formData.append("tempId", currentTempId || "");

        // const urlParams = new URLSearchParams({
        //   resourceType,
        //   resourceId: String(resourceId),
        //   documentId: String(documentId),
        //   tempId: currentTempId || "",
        // });

        const res = await fetch(`/api/attachments`, {
          method: "POST",
          body: formData,
        });

        clearInterval(interval);

        if (!res.ok) {
          const errorOK = await res.json().catch(() => null);
          const message = errorOK?.error || "업로드 실패";
          setErrorData({message:'허용되지 않은 파일 형식입니다.', type:'error'})
          throw new Error(message);
        }
        const uploaded: Attachment = await res.json();

        // 100% 표시
        setFiles(prev =>
          prev.map(f =>
            f.file.name === fileStatus.file.name && f.file.size === fileStatus.file.size
              ? { ...f, progress: 100, status: "done", uploadedAttachment: uploaded }
              : f
          )
        );

        // onUpdate?.(
        //   [...files, uploaded].filter((f): f is Attachment => !!(f as any).id)
        // );
      } catch (err) {
        clearInterval(interval);
        setFiles(prev =>
          prev.map(f =>
            f.file.name === fileStatus.file.name && f.file.size === fileStatus.file.size
              ? { ...f, progress: 0, status: "error" }
              : f
          )
        );
      }
    }
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
    const confirmed = confirm("파일을 삭제하시겠습니까?");
    if (!confirmed) return;

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
  };

  return (
    <div>
      <div
        className={`border border-dashed rounded-xl p-8 text-center cursor-pointer mb-8 ${
          isDragging ? "border-dashed border-blue-400 bg-blue-50" : "border-gray-300 bg-gray-50"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <div className={`flex justify-center mb-2.5`}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2}
               stroke="currentColor" className="size-10 text-gray-400">
            <path strokeLinecap="round" strokeLinejoin="round"
                  d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"/>
          </svg>
        </div>
        <p className="text-gray-500 text-sm">파일을 여기에 끌어다 놓거나 클릭하여 선택하세요.</p>
      </div>
      {errorData.message &&
        <Alert message={errorData.message} type={errorData.type} />
      }

      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={handleInputChange}
        className="hidden"
      />

      <div className="space-y-2 text-sm mt-2">
        {files.map((f) => (
          <div
            key={
              f.uploadedAttachment?.id ??
              f.uploadedAttachment?.uuid ?? // 임시 파일 식별자
              `${f.file.name}-${f.file.size}-${f.progress}` // 최종 fallback
            }

            className="flex justify-between items-center gap-4 border border-gray-200 px-3 py-5 rounded-lg bg-gray-50 hover:border-gray-700"
          >
            <div>
              <div
                onClick={() => onFileClick?.(f.uploadedAttachment!)} // ✅ 클릭 시 콜백
                className="block bg-no-repeat bg-cover bg-center h-16 w-16 rounded-md"
                style={{backgroundImage: `url(${f.uploadedAttachment?.path})`}}
              ></div>
            </div>
            <div className="flex-1">
              <span className="text-gray-800">{f.uploadedAttachment?.name}</span>
              <span className="text-gray-500 ml-2 text-xs">
        ({f.uploadedAttachment?.size
                ? formatBytes(f.uploadedAttachment.size)
                : f.file.size
                  ? formatBytes(f.file.size)
                  : "0 B"})
      </span>
              <div className="h-2 bg-gray-200 rounded mt-1">
                <div
                  className={`h-2 rounded-full ${
                    f.status === "error" ? "bg-red-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${f.progress}%`, transition: "width 0.2s linear" }}
                />
              </div>
            </div>
            <button
              type="button"
              className="text-red-500"
              onClick={() => handleDelete(f)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.25}
                stroke="currentColor"
                className="size-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}