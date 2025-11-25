"use client";

import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import EditorJS, { OutputData } from "@editorjs/editorjs";
import Header from "@editorjs/header";
import List from "@editorjs/list";
import Checklist from "@editorjs/checklist";
import Quote from "@editorjs/quote";
import Table from "@editorjs/table";
import ImageTool from "@editorjs/image";
import Embed from "@editorjs/embed";

interface EditorjsProps {
  holder?: string;
  onChange: (data: OutputData) => void;
  data?: OutputData;
  onReady?: (editor: EditorJS) => void; // ✅ 추가
}

const Editorjs = forwardRef<EditorJS | null, EditorjsProps>(
  ({ holder = "editorjs", onChange, data, onReady }, ref) => {
    const editorRef = useRef<EditorJS | null>(null);
    const mounted = useRef(false);

    useEffect(() => {
      if (typeof window === "undefined") return;
      if (mounted.current) return;
      mounted.current = true;

      const editor = new EditorJS({
        holder,
        data: data || { blocks: [] },
        autofocus: true,
        placeholder: "내용을 입력하세요...",
        tools: {
          header: Header,
          list: List,
          checklist: Checklist,
          quote: Quote,
          table: Table,
          image: {
            class: ImageTool,
            config: {
              inlineToolbar: false, // 인라인 툴바 비활성화 (선택)
              captionPlaceholder: "", // 캡션 입력창은 비우기
            },
          },
          embed: Embed,
        },
        async onChange(api) {
          const savedData = await api.saver.save();
          onChange(savedData);
        },
        onReady() {
          onReady?.(editor); // ✅ 여기서 부모로 전달
        },
      });

      editorRef.current = editor;

      return () => {
        editorRef.current?.isReady
          .then(() => editorRef.current?.destroy())
          .catch(() => {});
        editorRef.current = null;
      };
    }, [holder, onChange, data, onReady]);

    useImperativeHandle(ref, () => editorRef.current!, [editorRef.current]);

    return <div id={holder} className="min-h-[200px] p-2" />;
  }
);

Editorjs.displayName = "Editorjs";
export default Editorjs;