"use client";

import React, { useEffect, useRef } from "react";
import EditorJS, { OutputData } from "@editorjs/editorjs";

interface EditorjsProps {
  holder?: string;
  onChange: (data: OutputData) => void;
  data?: OutputData;
}

const Editorjs: React.FC<EditorjsProps> = ({
  holder = "editorjs",
  onChange,
  data,
}) => {
  const editorRef = useRef<EditorJS | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 이미 초기화된 경우 다시 실행 방지
    if (editorRef.current) return;

    const editor = new EditorJS({
      holder,
      autofocus: true,
      placeholder: "내용을 입력하세요...",
      data: data || { blocks: [] },
      async onChange(api) {
        const savedData = await api.saver.save();
        onChange(savedData);
      },
    });

    editorRef.current = editor;

    return () => {
      if (editorRef.current) {
        // destroy()는 async → 안전하게 await 처리
        editorRef.current.isReady
          .then(() => editorRef.current?.destroy())
          .catch(() => {});
        editorRef.current = null;
      }
    };
  }, []); // 의존성 최소화

  return <div id={holder} className="min-h-[300px] p-2" />;
};

export default Editorjs;
