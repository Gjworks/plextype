"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { FileText, UploadCloud, X } from "lucide-react";

import { fieldLabelClass } from "./fieldStyles";

interface Props {
  inputTitle: string;
  // 넘기면 고른 파일을 실제 file input에 담아 일반 form 전송(FormData)으로 보낸다.
  name?: string;
  id?: string;
  // input의 accept와 같다. 예: "image/*", ".pdf,.zip"
  accept?: string;
  multiple?: boolean;
  // 파일 하나의 최대 크기(byte). 넘는 파일은 목록에 넣지 않고 오류로 알린다.
  maxSize?: number;
  // 최대 파일 개수. multiple일 때만 쓴다.
  maxFiles?: number;
  // 넘기면 controlled. 서버 업로드를 직접 하는 화면은 onChange로 받아 처리한다.
  files?: File[];
  onChange?: (files: File[]) => void;
  description?: React.ReactNode;
  hideLabel?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export const formatFileSize = (bytes: number) => {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${unit === 0 ? size : size.toFixed(1)}${units[unit]}`;
};

// accept 규칙("image/*", ".pdf", "application/zip")에 맞는지 확인한다. 끌어놓기는 input의 accept 검사를 거치지 않는다.
const matchesAccept = (file: File, accept?: string) => {
  if (!accept) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return accept
    .split(",")
    .map((rule) => rule.trim().toLowerCase())
    .filter(Boolean)
    .some((rule) => (rule.startsWith(".") ? name.endsWith(rule) : rule.endsWith("/*") ? type.startsWith(rule.slice(0, -1)) : type === rule));
};

const fileKey = (file: File) => `${file.name}-${file.size}-${file.lastModified}`;

/**
 * 파일을 끌어다 놓거나 눌러서 고르는 영역. 고른 파일 목록과 크기를 보여주고 하나씩 뺄 수 있다.
 * 이미지 파일은 작은 미리보기를 보여준다.
 */
const FileDropzone = ({
  inputTitle,
  name,
  id,
  accept,
  multiple = false,
  maxSize,
  maxFiles,
  files,
  onChange,
  description,
  hideLabel = false,
  disabled,
  error,
  className = "",
}: Props) => {
  const autoId = useId();
  const inputId = id || name || autoId;
  const inputRef = useRef<HTMLInputElement>(null);
  const [innerFiles, setInnerFiles] = useState<File[]>([]);
  const current = files ?? innerFiles;
  const [dragging, setDragging] = useState(false);
  const [rejectMessage, setRejectMessage] = useState("");
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const message = error || rejectMessage;

  // form 전송에 실리도록 실제 file input의 목록을 고른 파일과 맞춘다.
  const syncInput = (list: File[]) => {
    if (!inputRef.current || typeof DataTransfer === "undefined") return;
    const transfer = new DataTransfer();
    list.forEach((file) => transfer.items.add(file));
    inputRef.current.files = transfer.files;
  };

  useEffect(() => syncInput(current), [current]);

  useEffect(() => {
    const urls: Record<string, string> = {};
    current.forEach((file) => {
      if (file.type.startsWith("image/")) urls[fileKey(file)] = URL.createObjectURL(file);
    });
    setPreviews(urls);
    return () => Object.values(urls).forEach((url) => URL.revokeObjectURL(url));
  }, [current]);

  const update = (next: File[]) => {
    if (files === undefined) setInnerFiles(next);
    onChange?.(next);
  };

  const addFiles = (incoming: File[]) => {
    const rejected: string[] = [];
    const accepted = incoming.filter((file) => {
      if (!matchesAccept(file, accept)) {
        rejected.push(`${file.name}: 허용되지 않는 형식`);
        return false;
      }
      if (maxSize && file.size > maxSize) {
        rejected.push(`${file.name}: ${formatFileSize(maxSize)} 초과`);
        return false;
      }
      return true;
    });

    let next = multiple ? [...current] : [];
    accepted.forEach((file) => {
      if (!next.some((item) => fileKey(item) === fileKey(file))) next.push(file);
    });
    if (!multiple) next = next.slice(-1);
    if (multiple && maxFiles && next.length > maxFiles) {
      rejected.push(`최대 ${maxFiles}개까지 올릴 수 있습니다.`);
      next = next.slice(0, maxFiles);
    }

    setRejectMessage(rejected.join(" · "));
    // 목록이 그대로여도 input에는 방금 고른 파일만 남으므로 바로 다시 맞춘다.
    syncInput(next);
    update(next);
  };

  const hint = [
    accept && `형식: ${accept}`,
    maxSize && `파일당 ${formatFileSize(maxSize)} 이하`,
    multiple && maxFiles && `최대 ${maxFiles}개`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className={`w-full ${className}`}>
      {!hideLabel && (
        <label htmlFor={inputId} className={fieldLabelClass(disabled)}>
          {inputTitle}
        </label>
      )}

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        aria-label={`${inputTitle}: 파일을 끌어다 놓거나 눌러서 고르기`}
        aria-describedby={message ? `${inputId}-error` : undefined}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(event) => {
          if (!disabled && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (!disabled) addFiles(Array.from(event.dataTransfer.files));
        }}
        className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gray-200/80 dark:focus-visible:ring-dark-700/60 ${
          disabled
            ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-60 dark:border-dark-700 dark:bg-dark-800"
            : dragging
              ? "cursor-copy border-gray-900 bg-gray-50 dark:border-dark-200 dark:bg-dark-800"
              : message
                ? "cursor-pointer border-red-300 bg-white hover:border-red-400 dark:border-red-500/60 dark:bg-dark-900"
                : "cursor-pointer border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-dark-700 dark:bg-dark-900 dark:hover:border-dark-500 dark:hover:bg-dark-800/60"
        }`}
      >
        <UploadCloud size={24} className={dragging ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-dark-400"} />
        <div className="text-sm text-gray-700 dark:text-dark-200">
          {dragging ? "여기에 놓으세요" : (
            <>
              파일을 끌어다 놓거나 <span className="font-semibold text-gray-950 underline underline-offset-2 dark:text-white">눌러서 고르기</span>
            </>
          )}
        </div>
        {(description || hint) && <div className="text-xs text-gray-400 dark:text-dark-400">{description || hint}</div>}
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          name={name}
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          tabIndex={-1}
          className="sr-only"
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => {
            // input의 목록은 effect가 고른 파일 전체로 다시 맞춘다.
            addFiles(Array.from(event.target.files ?? []));
          }}
        />
      </div>

      {current.length > 0 && (
        <ul className="mt-3 grid gap-2">
          {current.map((file) => {
            const key = fileKey(file);
            return (
              <li
                key={key}
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-dark-700 dark:bg-dark-900"
              >
                {previews[key] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previews[key]} alt="" className="h-9 w-9 shrink-0 rounded-md object-cover" />
                ) : (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-400 dark:bg-dark-800 dark:text-dark-400">
                    <FileText size={16} />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-gray-800 dark:text-dark-100">{file.name}</span>
                  <span className="block text-xs tabular-nums text-gray-400 dark:text-dark-400">{formatFileSize(file.size)}</span>
                </span>
                {!disabled && (
                  <button
                    type="button"
                    aria-label={`${file.name} 빼기`}
                    onClick={() => update(current.filter((item) => fileKey(item) !== key))}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-800 dark:text-dark-400 dark:hover:bg-dark-800 dark:hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {message && (
        <div id={`${inputId}-error`} className="mt-1.5 text-xs leading-5 text-red-500">
          {message}
        </div>
      )}
    </div>
  );
};

export default FileDropzone;
