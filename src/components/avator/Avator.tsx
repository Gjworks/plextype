"use client";

import React, { useState, useEffect, useRef } from "react";

const Avator = ({ username, isLoggedIn, tokenExpiryTime }) => {
  const [status, setStatus] = useState("online");
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // 🌟 1. 프롭 체크: 콘솔에 이게 찍히는지 확인해보세요.
    console.log("Avatar Component Mounted. isLoggedIn:", isLoggedIn);

    if (!isLoggedIn) {
      console.warn("isLoggedIn이 false라 리스너가 작동하지 않습니다.");
      return;
    }

    const updateStatus = (newStatus) => {
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);

      if (newStatus === "online") {
        console.log("상태 변경 예약: 2초 후 online");
        statusTimerRef.current = setTimeout(() => {
          setStatus("online");
          console.log("상태 변경 완료: online 🟢");
        }, 2000);
      } else {
        setStatus(newStatus);
        console.log(`상태 즉시 변경: ${newStatus} 🟡`);
      }
    };

    // 🌟 2. 핸들러 함수 하나로 통합 (이벤트 제거를 확실하게 하기 위함)
    const handleStateChange = () => {
      // blur나 visibilityState가 hidden이면 무조건 away
      if (document.visibilityState === "hidden" || !document.hasFocus()) {
        updateStatus("away");
      } else {
        updateStatus("online");
      }
    };

    // 🌟 3. 이벤트 리스너 등록
    window.addEventListener("blur", handleStateChange);
    window.addEventListener("focus", handleStateChange);
    document.addEventListener("visibilitychange", handleStateChange);

    const checkTokenStatus = () => {
      if (!tokenExpiryTime) return;
      if (Date.now() >= tokenExpiryTime) {
        setStatus("expired");
        console.log("세션 만료: expired 🔴");
      }
    };
    const interval = setInterval(checkTokenStatus, 10000);

    return () => {
      console.log("Avatar 리스너 제거 중...");
      window.removeEventListener("blur", handleStateChange);
      window.removeEventListener("focus", handleStateChange);
      document.removeEventListener("visibilitychange", handleStateChange);
      clearInterval(interval);
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    };
  }, [isLoggedIn, tokenExpiryTime]);

  const statusColor = {
    online: "bg-green-400",
    away: "bg-amber-400",
    expired: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]",
  };

  return (
    <div className="flex gap-2 items-center">
      <div className="flex items-center">
        <div className="relative h-6 w-6 rounded-full bg-gray-400/60 transition-colors">
          {isLoggedIn && (
            <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-zinc-900 transition-colors duration-500 ${statusColor[status]}`}></div>
          )}
        </div>
      </div>
      {isLoggedIn && (
        <div className="hidden lg:flex flex-col leading-none">
          <div className="text-left text-[12px] font-bold text-zinc-800 tracking-tight">
            {username}
          </div>
          <span className={`hidden text-[9px] font-bold uppercase mt-0.5 transition-colors ${status === 'online' ? 'text-green-500' : 'text-zinc-400'}`}>
            {status === 'online' ? 'Active' : status === 'away' ? 'Away' : 'Expired'}
          </span>
        </div>
      )}
    </div>
  );
};

export default Avator;