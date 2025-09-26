"use client";

import React, { useEffect, useRef } from "react";
import EditorJS, { OutputData } from "@editorjs/editorjs";
import Header from "@editorjs/header";
import List from "@editorjs/list";
import Checklist from "@editorjs/checklist";
import Quote from "@editorjs/quote";
import Table from "@editorjs/table";

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
      },
      async onChange(api) {
        const savedData = await api.saver.save();
        onChange(savedData);
      },
    });

    editorRef.current = editor;

    return () => {
      editorRef.current?.isReady
        .then(() => editorRef.current?.destroy())
        .catch(() => {});
      editorRef.current = null;
    };
  }, [holder, onChange, data]);

  return <div id={holder} className="min-h-[300px] p-2" />;
};

export default Editorjs;