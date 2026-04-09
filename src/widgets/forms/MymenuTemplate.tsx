"use client";

import React, { useEffect, useState } from "react";
import { Search, Bell, Zap, Trash2, CheckCheck, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Prisma 모델과 일치하는 타입 정의
interface DBNotification {
  uuid: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
}

const MymenuTemplate = () => {
  const [notifications, setNotifications] = useState<DBNotification[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. 데이터 로드 (unread API 사용)
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notifications/unread');
      if (!res.ok) throw new Error("데이터를 가져오지 못했습니다.");
      const data = await res.json();
      setNotifications(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // 2. 개별 읽음 처리 (낙관적 업데이트)
  const handleRead = async (uuid: string) => {
    // 🚀 화면에서 즉시 제거 (macOS의 쫀득한 속도감)
    setNotifications(prev => prev.filter(n => n.uuid !== uuid));

    try {
      const res = await fetch(`/api/notifications/${uuid}/read`, { method: 'PATCH' });
      if (!res.ok) throw new Error("읽음 처리 실패");
    } catch (error) {
      // 에러 발생 시 데이터 복구 로직을 추가할 수도 있지만, 보통은 조용히 로그만 남깁니다.
      console.error(error);
    }
  };

  // 3. 전체 읽음 처리
  const handleReadAll = async () => {
    if (notifications.length === 0) return;

    setNotifications([]); // 즉시 비우기
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="relative h-screen w-full flex flex-col p-6 overflow-hidden bg-white/5 dark:bg-black/5 backdrop-blur-[100px] font-sans">

      {/* Tahoe 배경 빛 효과 */}
      <div className="absolute top-[-10%] right-[-10%] w-[350px] h-[350px] bg-blue-400/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 h-full flex flex-col">
        {/* 헤더 */}
        <header className="flex justify-between items-center mb-10 px-2">
          <div>
            <p className="text-[9px] font-black text-black/20 dark:text-white/20 uppercase tracking-[0.3em] mb-1">Intelligence</p>
            <div className="text-[26px] font-bold text-black/90 dark:text-white/95 tracking-tight">알림 센터</div>
          </div>
          <button
            onClick={handleReadAll}
            className="p-2.5 bg-black/5 dark:bg-white/5 rounded-xl text-black/40 dark:text-white/40 hover:bg-black/10 hover:text-blue-500 transition-all"
            title="모두 읽음"
          >
            <CheckCheck size={18} />
          </button>
        </header>

        {/* 알림 리스트 */}
        <div className="flex-1 flex flex-col min-h-0">
          <p className="text-[10px] font-black text-black/30 dark:text-white/30 uppercase tracking-widest mb-5 px-2">
            Unread {notifications.length > 0 && `(${notifications.length})`}
          </p>

          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-4">
            <AnimatePresence mode="popLayout">
              {loading ? (
                /* 로딩 스피너 */
                <div className="flex flex-col items-center justify-center h-48">
                  <Loader2 size={24} className="text-black/10 dark:text-white/10 animate-spin" />
                </div>
              ) : notifications.length > 0 ? (
                notifications.map((noti) => (
                  <motion.div
                    key={noti.uuid}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    onClick={() => handleRead(noti.uuid)} // 클릭 시 읽음 처리
                    className="group relative flex items-start gap-4 p-5 bg-white/30 dark:bg-white/5 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-[26px] shadow-sm hover:bg-white/50 transition-all cursor-pointer"
                  >
                    {/* 아이콘/이미지 */}
                    <div className="shrink-0 pt-0.5">
                      {noti.imageUrl ? (
                        <img src={noti.imageUrl} className="w-11 h-11 rounded-[14px] object-cover shadow-sm" alt="" />
                      ) : (
                        <div className="w-11 h-11 bg-black/5 dark:bg-white/10 rounded-[14px] flex items-center justify-center border border-white/20">
                          <StatusIcon type={noti.type} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-bold text-black/80 dark:text-white/90 leading-tight mb-1 truncate">
                        {noti.title || "알림"}
                      </div>
                      <p className="text-[13px] text-black/50 dark:text-white/40 leading-snug line-clamp-2">
                        {noti.content}
                      </p>
                    </div>

                    {/* 빠른 삭제 아이콘 */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                      <Trash2 size={14} className="text-black/20" />
                    </div>
                  </motion.div>
                ))
              ) : (
                /* 알림 없을 때 */
                <div className="flex flex-col items-center justify-center h-64 rounded-[40px] border border-dashed border-black/5 dark:border-white/5">
                  <Bell size={32} className="text-black/5 dark:text-white/5 mb-3" />
                  <p className="text-[11px] font-bold text-black/20 dark:text-white/20 uppercase tracking-widest text-center">No Activity</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

// 상태 아이콘 컴포넌트
const StatusIcon = ({ type }: { type: any }) => {
  const iconSize = 18;
  const icons = {
    success: <Zap size={iconSize} className="text-blue-500 fill-blue-500/20" />,
    error: <Zap size={iconSize} className="text-red-500 fill-red-500/20" />,
    warning: <Zap size={iconSize} className="text-amber-500 fill-amber-500/20" />,
    info: <Bell size={iconSize} className="text-zinc-400" />,
  };
  return icons[type as keyof typeof icons] || icons.info;
};

export default MymenuTemplate;