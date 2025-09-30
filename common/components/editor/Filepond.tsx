"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

// NPM import 대신 CDN 로드 방식을 사용하기 위해 전역 객체 선언 (전역 로드 가정)
declare const FilePond: any;
declare const FilePondPluginImagePreview: any;
declare const FilePondPluginFileValidateType: any;
declare const FilePondPluginFileValidateSize: any;

// CDN URL 정의 (모든 의존성)
const CDN_URLS = [
  // Core CSS
  'https://unpkg.com/filepond/dist/filepond.min.css',
  // Plugins CSS
  'https://unpkg.com/filepond-plugin-image-preview/dist/filepond-plugin-image-preview.min.css',
  // Core JS (핵심 파일)
  'https://unpkg.com/filepond/dist/filepond.min.js',
  // Plugins JS
  'https://unpkg.com/filepond-plugin-image-preview/dist/filepond-plugin-image-preview.min.js',
  'https://unpkg.com/filepond-plugin-file-validate-type/dist/filepond-plugin-file-validate-type.min.js',
  'https://unpkg.com/filepond-plugin-file-validate-size/dist/filepond-plugin-file-validate-size.min.js',
];

interface UploadFilePondProps {
  resourceType: string;
  resourceId: number;
  onUpdate?: (files: any[]) => void;
  onTempId?: (id: string | null) => void;
  maxFiles?: number;
  acceptedFileTypes?: string[];
}

// 필수 FilePond 객체 및 플러그인이 모두 전역에 등록되었는지 확인
const checkAllObjectsReady = () => {
  return (
    typeof window !== 'undefined' &&
    typeof FilePond !== 'undefined' &&
    typeof FilePond.create === 'function' &&
    typeof FilePondPluginImagePreview !== 'undefined' &&
    typeof FilePondPluginFileValidateType !== 'undefined' &&
    typeof FilePondPluginFileValidateSize !== 'undefined'
  );
}

/**
 * InnerFilePondComponent: 모든 준비가 완료된 후 *key*에 의해 안전하게 마운트/리마운트되는 컴포넌트.
 */
const InnerFilePondComponent: React.FC<
  UploadFilePondProps & { filesToLoad: any[]; processUrlParams: string; setError: (e: string | null) => void }
> = ({
       filesToLoad,
       onUpdate,
       maxFiles = 5,
       acceptedFileTypes = ['image/*'],
       processUrlParams,
       setError,
     }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pondInstanceRef = useRef<any>(null); // FilePond 인스턴스를 저장할 Ref

  // 파일 ID와 해당 MIME 타입을 매핑하는 맵을 생성 (load 핸들러에서 사용)
  const mimeTypeMap = useMemo(() => {
    const map = new Map<string, string>();
    filesToLoad.forEach(file => {
      const id = file.source;
      const mimeType = file.options?.file?.type || 'application/octet-stream';
      map.set(id, mimeType);
    });
    return map;
  }, [filesToLoad]);

  const destroyPond = useCallback(() => {
    if (pondInstanceRef.current && typeof pondInstanceRef.current.destroy === 'function') {
      console.log("DEBUG [FilePond Cleanup] 🗑️ 인스턴스 파괴.");
      pondInstanceRef.current.destroy();
      pondInstanceRef.current = null;
    }
  }, []);

  // --- FilePond 인스턴스 생성 및 정리 (Mount/Unmount 시) ---
  useEffect(() => {
    let isMounted = true;

    // 이전 인스턴스가 남아있을 경우 정리
    destroyPond();

    const initializeFilePond = () => {
      if (!isMounted || !fileInputRef.current) {
        if (!isMounted) console.log("FilePond initialization aborted: Component unmounted.");
        return;
      }

      // 1. 플러그인 등록
      try {
        FilePond.registerPlugin(
          FilePondPluginImagePreview,
          FilePondPluginFileValidateType,
          FilePondPluginFileValidateSize
        );
        console.log("DEBUG [FilePond Init] ✨ 모든 플러그인 등록 완료.");
      } catch (e) {
        // 무시 (이미 등록되었을 수 있음)
      }

      // 2. 인스턴스 생성
      try {
        const pondInstance = FilePond.create(fileInputRef.current, {
          maxFiles: maxFiles,
          allowMultiple: maxFiles > 1,
          acceptedFileTypes: acceptedFileTypes,
          labelIdle: '여기에 파일을 끌어다 놓거나 클릭하세요.',
          labelFileProcessingError: (e: any) => `파일 처리 오류: ${e.body || e.message || '알 수 없는 오류'}`, // 에러 메시지 강화
          labelTapToUndo: '실행 취소',
          labelFileLoading: '파일 로드 중...',
          labelFileWaitingForSize: '크기 확인 중...',
          labelFileSizeNotAvailable: '크기 없음',

          // 초기 파일 주입
          files: filesToLoad,

          onaddfile: (error: any, file: any) => {
            if (error) {
              console.error(`DEBUG [FilePond Event] 파일 추가 오류: ${error.body || error.message}`);
              setError(`파일 추가 오류: ${error.body || error.message || '알 수 없는 오류'}`);
            } else {
              console.log(`DEBUG [FilePond Event] 파일 추가 완료: ${file.filename}`);
              setError(null);
            }
          },

          // oninit 핸들러는 초기 파일 주입을 'files' 옵션으로 변경하며 제거합니다.

          // 서버 설정
          server: {
            url: '/api/attachments',
            // 파일 업로드 (새 파일)
            process: (fieldName: string, file: any, metadata: any, load: any, error: any, progress: any, abort: any) => {
              const formData = new FormData();
              formData.append(fieldName, file, file.name);

              const request = new XMLHttpRequest();
              request.open('POST', `/api/attachments?${processUrlParams}`);
              request.withCredentials = true;

              request.upload.onprogress = (e: any) => { progress(e.lengthComputable, e.loaded, e.total); };

              request.onload = function() {
                if (request.status >= 200 && request.status < 300) {
                  try {
                    const res = JSON.parse(request.responseText);
                    console.log("DEBUG [FilePond Process] ✅ 업로드 성공 서버 응답 (ID 확인):", res);

                    if (onUpdate) onUpdate(res);
                    // FilePond는 process 후 서버가 반환하는 ID를 source로 사용합니다.
                    const fileId = res.id ? String(res.id) : res.uuid ?? (res.path ? String(res.path) : 'ok');
                    load(fileId);
                  } catch (e) {
                    console.error("FilePond Process: ❌ 서버 응답 파싱 실패", e, request.responseText);
                    error('서버 응답 파싱 실패 (JSON 형식 오류)');
                  }
                } else {
                  console.error("FilePond Process: ❌ 파일 업로드 실패", request.status, request.statusText, request.responseText);
                  error('파일 업로드 실패: ' + (request.responseText || request.statusText));
                }
              };
              request.onerror = () => { error('파일 업로드 중 네트워크 오류 발생'); };
              request.send(formData);
              return { abort: () => { request.abort(); } };
            },
            // 파일 삭제
            revert: {
              url: '/api/attachments',
              method: 'DELETE',
              withCredentials: true,
              onload: (response) => {
                console.log("DEBUG [FilePond Revert] 🗑️ 서버 삭제 응답:", response);
              },
              onerror: (response) => {
                console.error("DEBUG [FilePond Revert] ❌ 서버 삭제 오류:", response);
              }
            },

            // load 핸들러: 서버가 기대하는 'path' 매개변수를 사용하여 파일 콘텐츠를 요청
            load: (source: string, load: any, error: any, progress: any, abort: any, headers: any) => {
              const initialMimeType = mimeTypeMap.get(source) || 'application/octet-stream';
              const fileMetadata = filesToLoad.find(f => f.source === source);
              const fileName = fileMetadata?.options?.file?.name || source.split('/').pop() || 'unknown';

              console.log(`DEBUG [FilePond Load] 🟢 로드 시도: Path ${source}, 파일명: ${fileName}`);

              const request = new XMLHttpRequest();
              request.open('GET', `/api/attachments?path=${source}`);
              request.responseType = 'blob'; // 파일 콘텐츠를 Blob으로 받기 위해 필수
              request.withCredentials = true;

              request.onload = function() {
                if (request.status >= 200 && request.status < 300) {
                  const blob = request.response;

                  if (!(blob instanceof Blob) || blob.size === 0) {
                    console.error(`DEBUG [FilePond Load] 🚨 로드 실패: Blob 크기 0 또는 유효하지 않음. Response status: ${request.status}`);
                    error('파일 로드 실패 (서버에서 파일 콘텐츠를 받지 못함)');
                    return;
                  }

                  // 🔥 핵심: File 객체로 변환하여 파일명 포함
                  const file = new File([blob], fileName, { type: initialMimeType });

                  console.log(`DEBUG [FilePond Load] 🚀 로드 성공: ${fileName} (${blob.size} bytes)`);

                  load(file);  // Blob 대신 File 객체 전달
                } else {
                  console.error(`DEBUG [FilePond Load] ❌ 파일 로드 실패: HTTP Status ${request.status}`);
                  error('파일 로드 실패: ' + request.statusText);
                }
              };
              request.onerror = () => { error('네트워크 오류'); };
              request.onprogress = (e: any) => { progress(e.lengthComputable, e.loaded, e.total); };
              request.send();
              return { abort: () => { request.abort(); } };
            },
          },
        });

        pondInstanceRef.current = pondInstance;

      } catch (e: any) {
        console.error("FilePond 초기화 시도 중 예외 발생:", e);
        setError(`FilePond 초기화 중 예외 발생: ${e.message}`);
      }
    };

    // DOM이 준비된 후 비동기적으로 FilePond 초기화 시도 (0ms 지연)
    const initTimeout = setTimeout(initializeFilePond, 0);

    // 클린업
    return () => {
      isMounted = false;
      clearTimeout(initTimeout);
      destroyPond();
    };
  }, [filesToLoad, maxFiles, acceptedFileTypes, onUpdate, processUrlParams, setError, mimeTypeMap, destroyPond]);

  return (
    <>
      <h3 className={`text-lg font-semibold mb-2 text-gray-800`}>파일 첨부</h3>
      {/* 이 input이 FilePond에 의해 교체될 대상입니다 */}
      <input
        type="file"
        ref={fileInputRef}
        className="filepond"
        name="filepond-attachments"
        multiple={maxFiles > 1}
      />
    </>
  );
};


/**
 * UploadFilePond: 메인 컴포넌트 (CDN 로드 및 상태 관리)
 */
const UploadFilePond: React.FC<UploadFilePondProps> = (props) => {
  const { resourceType, resourceId, onTempId: onTempIdChange } = props;

  const [isClient, setIsClient] = useState(false);
  const [isGlobalReady, setIsGlobalReady] = useState(false);
  const [filesToLoad, setFilesToLoad] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cdnLoadError, setCdnLoadError] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0); // CDN 로드 시도 횟수

  const isTemporary = resourceId === 0;
  const tempId = useMemo(() => isTemporary ? uuidv4() : null, [isTemporary]);
  const finalResourceId = resourceId === 0 ? 0 : resourceId;

  const processUrlParams = useMemo(() => {
    let params = `resourceType=${resourceType}&resourceId=${finalResourceId}`;
    if (isTemporary && tempId) {
      params += `&tempId=${tempId}`;
    }
    return params;
  }, [resourceType, finalResourceId, isTemporary, tempId]);

  useEffect(() => {
    if (onTempIdChange) {
      onTempIdChange(tempId);
    }
    // 클라이언트 환경 체크
    setIsClient(true);
  }, [tempId, onTempIdChange]);


  // --- 1. 기존 파일 로드 Effect (파일 목록 준비) ---
  useEffect(() => {
    if (!isClient || finalResourceId === 0) {
      setFilesToLoad([]); // 임시 모드에서는 즉시 빈 배열로 설정
      return;
    }

    const fetchExistingFiles = async () => {
      try {
        // resourceId가 유효한 경우에만 로드 시도
        const origin = window.location.origin;
        const fetchUrl = `${origin}/api/attachments?resourceType=${resourceType}&resourceId=${finalResourceId}`;

        console.log("DEBUG [FilePond Load] 🟢 Initial Fetching existing files from URL:", fetchUrl);

        const response = await fetch(fetchUrl);

        if (!response.ok) {
          const errorText = await response.text().catch(() => "Response body not available");
          console.error(`DEBUG [FilePond Load] 🚨 Initial Fetch FAILED (Status: ${response.status}) for ${fetchUrl}. Server responded:`, errorText);
          throw new Error(`기존 첨부파일 목록 로드 실패 (Status: ${response.status} / ${errorText.substring(0, 100)}...)`);
        }

        const rawText = await response.text();
        let existingFiles: any;

        try {
          existingFiles = JSON.parse(rawText);

          // 서버 응답이 배열이 아닌 경우 배열로 감싸는 처리
          let filesArray: any[] = [];
          if (Array.isArray(existingFiles)) {
            filesArray = existingFiles;
          } else if (existingFiles && typeof existingFiles === 'object') {
            filesArray = [existingFiles];
          }

          console.log("DEBUG [FilePond Load] Raw server response (JSON parsed, Check Array):", filesArray);
          existingFiles = filesArray;

        } catch (e) {
          console.error("DEBUG [FilePond Load] 🚨 JSON Parsing Failed 🚨 Raw Response Text:", rawText, e);
          throw new Error("서버 응답이 유효한 JSON 배열 형식이 아닙니다.");
        }

        if (!Array.isArray(existingFiles)) {
          throw new Error("처리된 파일 목록이 유효한 배열이 아닙니다.");
        }

        const filepondFiles = existingFiles.map((file: any) => {
          // FilePond가 기대하는 구조에 맞게 매핑
          const finalSource = file.source || file.path;
          if (!finalSource) {
            console.warn(`DEBUG [FilePond Mapper] ⚠️ Source path is missing for file ID ${file.id}. Skipping.`);
            return null;
          }

          const fileName = file.originalName || file.name || `${finalSource?.split('/').pop() || 'file'}`;
          const fileSize = Number(file.size || 0);
          const mimeType = file.mimeType || file.type || 'application/octet-stream';
          const attachmentId = file.metadata?.id || file.id;

          const filepondObj = {
            source: finalSource,
            options: {
              type: 'local',
              file: {
                name: fileName,
                size: fileSize,
                type: mimeType
              },
              metadata: {
                resourceId: finalResourceId,
                resourceType,
                id: attachmentId
              }
            }
          };

          return filepondObj;

        }).filter((f: any) => f !== null);


        console.log("DEBUG [FilePond Load] 🚀 Processed filesToLoad data structure (FINAL):", filepondFiles);

        setFilesToLoad(filepondFiles); // 로드 완료
        setError(null); // 이전 로드 오류 제거
      } catch (error: any) {
        console.error("기존 첨부파일 로드 처리 중 오류 발생:", error);
        setError(`기존 첨부파일 로드에 실패했습니다: ${error.message}`);
        setFilesToLoad([]); // 오류가 나도 빈 배열로 처리하여 컴포넌트 마운트는 시도
      }
    };

    fetchExistingFiles();

  }, [isClient, finalResourceId, resourceType]);


  // --- 2. Phase 1: CDN 로드 및 전역 객체 대기 ---
  useEffect(() => {
    if (!isClient) return;

    let timeoutId: NodeJS.Timeout | null = null;

    const injectAllFiles = () => {
      CDN_URLS.forEach(url => {
        const isCss = url.endsWith('.css');
        const selector = isCss ? `link[href="${url}"]` : `script[src="${url}"]`;
        if (document.querySelector(selector)) return;

        const element = document.createElement(isCss ? 'link' : 'script');
        if (isCss) {
          (element as HTMLLinkElement).rel = 'stylesheet';
          (element as HTMLLinkElement).href = url;
          element.onerror = () => setCdnLoadError(`CSS 로드 실패: ${url}`);
          document.head.appendChild(element);
        } else {
          (element as HTMLScriptElement).src = url;
          (element as HTMLScriptElement).async = true;
          element.onerror = () => setCdnLoadError(`JS 로드 실패: ${url}`);
          document.body.appendChild(element);
        }
      });
    };

    const attemptGlobalReady = (attempts = 0) => {
      setAttemptCount(attempts);
      if (checkAllObjectsReady()) {
        setIsGlobalReady(true);
        setCdnLoadError(null);
      } else if (attempts < 80) { // 8초 대기 (80 * 100ms)
        timeoutId = setTimeout(() => attemptGlobalReady(attempts + 1), 100);
      } else {
        console.error("[FilePond Error] Timed out waiting for FilePond global objects (8s).");
        setCdnLoadError("FilePond 라이브러리 로드 시간 초과. 네트워크 상태를 확인하세요.");
      }
    }

    injectAllFiles();
    attemptGlobalReady();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isClient]);


  // 로딩 상태 계산
  const isDataLoading = filesToLoad === null;
  const isCdnLoading = !isGlobalReady;
  const isLoading = !isClient || isCdnLoading || isDataLoading;
  const finalError = error || cdnLoadError;

  // 에러 발생 시 UI 표시
  if (finalError) {
    return (
      <div className="p-4 border-2 border-dashed border-red-400 rounded-lg text-center bg-red-50 text-red-700">
        <p className="font-semibold">⚠️ 파일 첨부 컴포넌트 활성화 오류:</p>
        <p className="text-sm mt-1">{finalError}</p>
        {isCdnLoading && attemptCount < 80 && (
          <p className="text-xs mt-2 text-red-500">라이브러리 로드를 ${attemptCount * 100}ms 동안 시도 중...</p>
        )}
        <p className="text-xs mt-2 text-red-500">콘솔 로그 (DEBUG [FilePond...])를 확인하여 서버 응답을 검토하세요.</p>
      </div>
    );
  }

  return (
    <div className="filepond-container p-4 border border-gray-200 rounded-xl bg-white shadow-sm relative min-h-[150px]">

      {/* 로딩 표시 */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col justify-center items-center bg-white/90 z-10 rounded-xl pointer-events-none">
          <p className="font-semibold text-gray-700 animate-pulse">첨부파일 컴포넌트 로드 중...</p>
          <p className="text-sm text-gray-500 mt-1">라이브러리 및 초기 데이터 준비 중입니다. (${attemptCount}/80)</p>
        </div>
      )}

      {/* 준비 완료 시에만 InnerFilePondComponent 렌더링 */}
      {isGlobalReady && filesToLoad !== null && (
        <InnerFilePondComponent
          {...props}
          filesToLoad={filesToLoad}
          processUrlParams={processUrlParams}
          setError={setError} // 통신 오류는 이쪽으로 전달
          // key를 사용하여 resourceId나 tempId가 변경될 때 컴포넌트를 강제로 리마운트
          key={finalResourceId > 0 ? `loaded-${finalResourceId}` : `temp-${tempId}`}
        />
      )}

      {/* 준비가 안 되었을 때는 로딩 상태에서 제목만 표시 */}
      {!isGlobalReady || isDataLoading && (
        <h3 className={`text-lg font-semibold mb-2 text-gray-800 ${isLoading ? 'opacity-50' : ''}`}>파일 첨부</h3>
      )}
    </div>
  );
};

export default UploadFilePond;