"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FolderArchive } from "lucide-react";

// ✅ 내부 컴포넌트 임포트
import AttachmentList from "./_tpl/default/AttachmentList";
import MyFiles from "./_tpl/default/myFiles";

// ✅ 공용 컴포넌트 임포트
import UploadFileManager from "@components/editor/UploadFileManager";
import Popup from "@components/modal/Popup";
import Button from "@components/button/Button";

// ✅ 🌟 [수정] 타입 이름이 겹치지 않게 별칭(as)을 줍니다.
import { Attachment as IAttachment } from "./_actions/_type";
import { getAttachmentsAction } from "./_actions/attachment.action";
import { extractUploadPaths } from "./_lib/parser";


interface AttachmentBoxProps {
  content: string;
  onFileClick: (file: IAttachment) => void;
  onFileDelete: (file: IAttachment) => void;
}

export const Attachment = {
  Box: ({ content, onFileClick, onFileDelete }: AttachmentBoxProps) => {
    // ✅ 🌟 가져온 타입을 IAttachment로 사용합니다.
    const [allMyFiles, setAllMyFiles] = useState<IAttachment[]>([]);
    const [showPopup, setShowPopup] = useState(false);

    const refreshLibrary = async () => {
      const res = await getAttachmentsAction();
      if (res.success && res.data) {
        setAllMyFiles(res.data);
      }
    };

    useEffect(() => {
      refreshLibrary();
    }, []);

    const usedFiles = useMemo(() => {
      // 숲(content)에서 나무(paths)를 찾아내는 과정
      const pathsInContent = extractUploadPaths(content);

      // 내 전체 보관함 중에서 '본문에 있는 경로'를 가진 녀석들만 필터링
      return allMyFiles.filter((file) => pathsInContent.includes(file.path));
    }, [content, allMyFiles]);

    return (
      <div className="space-y-4">
        <div className="flex justify-start">
          <Button
            type="button"
            onClick={() => setShowPopup(true)}
            className="bg-white border !border-gray-200 hover:!bg-sky-100 hover:!text-sky-500 hover:!border-sky-200 text-xs"
          >
            <span className="flex items-center gap-1">
              <FolderArchive size={14} className="text-gray-500" />
            나의 보관함
            </span>
          </Button>
        </div>

        <AttachmentList
          attachments={usedFiles}
          onFileClick={onFileClick}
          onDeleteRequest={onFileDelete}
        />

        <UploadFileManager
          onUploadSuccess={refreshLibrary}
          onFileClick={onFileClick}
        />

        <Popup
          id="user-file-storage"
          state={showPopup}
          title="나의 첨부파일 보관함"
          close={() => setShowPopup(false)}
          showFooter={false}
        >
          <MyFiles
            onFileSelect={(file) => {
              onFileClick(file);
              setShowPopup(false);
            }}
          />
        </Popup>
      </div>
    );
  }
};