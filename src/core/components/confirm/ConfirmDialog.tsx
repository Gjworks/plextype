"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, HelpCircle } from "lucide-react";
import { create } from "zustand";

export interface ConfirmOptions {
  title: string;
  message?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  // danger는 삭제·복원처럼 되돌릴 수 없는 작업에 쓴다. 확인 버튼이 빨간색이 된다.
  tone?: "default" | "danger";
  // 넘기면 이 문구를 똑같이 입력해야 확인 버튼이 켜진다. 서비스 이름 등 실수하면 큰 작업에 쓴다.
  requireText?: string;
}

interface ConfirmRequest extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
}

const useConfirmStore = create<{ request: ConfirmRequest | null; set: (request: ConfirmRequest | null) => void }>((set) => ({
  request: null,
  set: (request) => set({ request }),
}));

/**
 * 확인 창을 띄우고 사용자의 선택을 boolean으로 돌려준다. 루트 layout의 ConfirmDialogHost가 화면에 그린다.
 * 이미 열린 창이 있으면 그 창은 취소(false)로 끝내고 새 창을 띄운다.
 * 예: if (!(await confirmDialog({ title: "삭제할까요?", tone: "danger" }))) return;
 */
export const confirmDialog = (options: ConfirmOptions) =>
  new Promise<boolean>((resolve) => {
    const { request, set } = useConfirmStore.getState();
    request?.resolve(false);
    set({ ...options, resolve });
  });

export const ConfirmDialogHost = () => {
  const request = useConfirmStore((state) => state.request);
  const setRequest = useConfirmStore((state) => state.set);
  const [mounted, setMounted] = useState(false);
  const [typed, setTyped] = useState("");
  const confirmRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  const finish = (confirmed: boolean) => {
    if (!request) return;
    request.resolve(confirmed);
    setRequest(null);
  };

  useEffect(() => {
    if (!request) return;
    setTyped("");
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // 위험한 작업은 실수로 Enter를 눌러도 실행되지 않게 취소 버튼에 먼저 포커스를 둔다.
    const timer = window.setTimeout(() => {
      if (request.requireText) inputRef.current?.focus();
      else if (request.tone === "danger") cancelRef.current?.focus();
      else confirmRef.current?.focus();
    }, 30);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, [request]);

  useEffect(() => {
    if (!request) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        request.resolve(false);
        setRequest(null);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [request, setRequest]);

  if (!mounted) return null;

  const danger = request?.tone === "danger";
  const locked = Boolean(request?.requireText) && typed.trim() !== request?.requireText;

  return createPortal(
    <AnimatePresence>
      {request && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center px-4" role="presentation">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => finish(false)}
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby={request.message ? "confirm-dialog-message" : undefined}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { type: "spring", damping: 26, stiffness: 320 } }}
            exit={{ opacity: 0, y: 12, scale: 0.96, transition: { duration: 0.15 } }}
            className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-dark-800 dark:bg-dark-900"
          >
            <div className="flex gap-4">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  danger ? "bg-red-50 text-red-500 dark:bg-red-500/10" : "bg-gray-100 text-gray-500 dark:bg-dark-800 dark:text-dark-300"
                }`}
              >
                {danger ? <AlertTriangle size={18} /> : <HelpCircle size={18} />}
              </div>
              <div className="min-w-0 flex-1">
                <h2 id="confirm-dialog-title" className="text-base font-semibold text-gray-950 dark:text-white">
                  {request.title}
                </h2>
                {request.message && (
                  <div id="confirm-dialog-message" className="mt-2 text-sm leading-6 text-gray-500 dark:text-dark-300">
                    {request.message}
                  </div>
                )}
                {request.requireText && (
                  <label className="mt-4 block text-sm text-gray-600 dark:text-dark-300">
                    계속하려면 <strong className="font-semibold text-gray-950 dark:text-white">{request.requireText}</strong>을(를) 입력하세요.
                    <input
                      ref={inputRef}
                      value={typed}
                      onChange={(event) => setTyped(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.nativeEvent.isComposing && !locked) finish(true);
                      }}
                      autoComplete="off"
                      className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm text-black outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-200/75 dark:border-dark-600 dark:bg-dark-800/80 dark:text-dark-100 dark:focus:border-dark-400 dark:focus:ring-dark-700/45"
                    />
                  </label>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                ref={cancelRef}
                type="button"
                onClick={() => finish(false)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gray-200/80 dark:border-dark-700 dark:bg-dark-900 dark:text-dark-300 dark:hover:bg-dark-800 dark:hover:text-white dark:focus-visible:ring-dark-700/60"
              >
                {request.cancelText || "취소"}
              </button>
              <button
                ref={confirmRef}
                type="button"
                disabled={locked}
                onClick={() => finish(true)}
                className={`rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-40 ${
                  danger
                    ? "bg-red-600 hover:bg-red-500 focus-visible:ring-red-200 dark:focus-visible:ring-red-500/30"
                    : "bg-gray-900 hover:bg-gray-700 focus-visible:ring-gray-300 dark:bg-white dark:text-gray-950 dark:hover:bg-dark-200 dark:focus-visible:ring-dark-600"
                }`}
              >
                {request.confirmText || "확인"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
