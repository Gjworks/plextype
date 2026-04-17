"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
// 🌟 [수정] HardDrive 아이콘을 추가로 임포트했습니다!
import { Users, FileText, MessageSquare, Activity, ArrowUpRight, Zap, Globe, HardDrive } from "lucide-react";
import {useToastStore} from "@/core/store/useToastStore";



const Page = () => {
  const [cpuHistory, setCpuHistory] = useState<number[]>(new Array(15).fill(0));
  const addToast = useToastStore((state) => state.addToast);
  // 🌟 [수정] 초기 상태에 network, disk, uptime을 추가해서 'undefined' 에러를 방지합니다.
  const [currentStats, setCurrentStats] = useState({
    cpu: 0,
    mem: 0,
    network: { down: "0.00", up: "0.00" },
    disk: 0,
    uptime: 0
  });

  useEffect(() => {
    const eventSource = new EventSource('/api/system/stats');

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setCurrentStats(data);

      setCpuHistory(prev => {
        const newHistory = [...prev.slice(1), data.cpu];
        return newHistory;
      });
    };

    eventSource.onerror = (err) => {
      console.error("SSE 연결 오류:", err);
      eventSource.close();
    };

    return () => eventSource.close();
  }, []);

  return (
    <div className="relative min-h-screen font-sans">
      {/* 🌌 배경 영역 */}
      <div className="absolute inset-0 -z-10 bg-[#F8F9FA]">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100/50 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-100/40 rounded-full blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-12 gap-6 max-w-[1920px] mx-auto"
      >
        {/* [좌측 3칸] 유저 펄스 */}
        <div className="col-span-12 lg:col-span-3">
          <section className="space-y-8 bg-white/80 p-8 rounded-xl shadow-lg shadow-gray-100">
            <header className="flex justify-between items-center">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">User Pulse</p>
                <div className="text-sm font-medium text-gray-500">Live session</div>
              </div>
              <Users size={14} className="text-gray-300" />
            </header>

            <div className="space-y-5">
              {[{ name: "김희정", status: "online", time: "Now" }, { name: "SAMA", status: "online", time: "2m" }, { name: "Plextype", status: "away", time: "15m" }].map((user, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-400 border border-gray-200/50">
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-[12px] font-medium text-gray-800">{user.name}</p>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1 h-1 rounded-full ${user.status === 'online' ? 'bg-blue-500' : 'bg-gray-300'}`} />
                      <p className="text-[9px] text-gray-400 uppercase tracking-tighter">{user.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* 🌟 [가운데] System Core (Main) */}
        <div className="col-span-12 lg:col-span-6">
          <section className="bg-white rounded-2xl p-10 shadow-lg shadow-gray-100 h-full flex flex-col">
            <header className="flex justify-between items-end mb-16">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-gray-100 rounded-md">
                  <Zap size={10} className="text-gray-400" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">System Flow</span>
                </div>
                <div className="text-xl font-medium tracking-tight text-gray-800">Operational Overview</div>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">CPU Load</p>
                <p className="text-2xl font-light text-blue-600">{currentStats.cpu}%</p>
              </div>
            </header>

            {/* 실무적이고 얇은 데이터 라인 */}
            <div className="flex-1 space-y-10">
              {/* Network */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-2">
                    <Globe size={12} className="text-gray-300" />
                    <span className="text-[12px] text-gray-500 font-medium">Network</span>
                  </div>
                  <span className="text-[12px] font-mono text-gray-400">{currentStats.network?.down || "0.00"} MB/s</span>
                </div>
                <div className="h-[2px] w-full bg-gray-50 overflow-hidden">
                  <motion.div animate={{ width: `${Math.min((Number(currentStats.network?.down) || 0) * 10, 100)}%` }} className="h-full bg-gray-900" />
                </div>
              </div>

              {/* Storage */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-2">
                    <HardDrive size={12} className="text-gray-300" />
                    <span className="text-[12px] text-gray-500 font-medium">Storage</span>
                  </div>
                  <span className="text-[12px] font-mono text-gray-400">{currentStats.disk}%</span>
                </div>
                <div className="h-[2px] w-full bg-gray-50 overflow-hidden">
                  <motion.div animate={{ width: `${currentStats.disk}%` }} className="h-full bg-gray-900" />
                </div>
              </div>

              {/* Uptime (박스 제거, 텍스트로만 정갈하게) */}
              <div className="pt-4 flex justify-between items-center border-t border-gray-50">
                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Uptime</span>
                <span className="text-[12px] font-medium text-gray-600">
                  {Math.floor(currentStats.uptime / 3600)}h {Math.floor((currentStats.uptime % 3600) / 60)}m
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-12 mt-12 pt-8 border-t border-gray-50">
              <MiniStat label="Mem" value={`${currentStats.mem}%`} />
              <MiniStat label="Status" value="Active" color="text-blue-500" />
              <MiniStat label="Latency" value="1.2ms" />
            </div>
          </section>
        </div>

        {/* 🌟 [우측] Activity Feed */}
        <div className="col-span-12 lg:col-span-3 space-y-12">
          <section className="space-y-8 bg-white/80 p-8 rounded-xl shadow-lg shadow-gray-100">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">User Pulse</p>
            <div className="text-sm font-medium text-gray-500 uppercase tracking-[0.2em]">Activity</div>
            <div className="space-y-6">
              <ActivityRow title="v2.0 Deploy" time="12:00" />
              <ActivityRow title="Feedback" time="11:45" />
              <ActivityRow title="Peak Alert" time="09:20" />
            </div>
          </section>

          <section className="p-6 bg-gray-100 rounded-xl border border-gray-200">
            <p className="text-[12px] font-bold text-gray-900 uppercase mb-3">Insight</p>
            <p className="text-[12px] leading-relaxed text-gray-600 mb-4">현재 시스템 상태가 안정적입니다. 네트워크 최적화가 완료되었습니다.</p>
            <button className="text-[11px] font-bold text-gray-900 flex items-center gap-1 hover:gap-2 transition-all">
              Details <ArrowUpRight size={12} />
            </button>
            <button
              onClick={() => addToast("인사이트를 갱신했습니다.", "success")}
              className="w-full py-2 bg-white rounded-lg text-[11px] font-bold shadow-sm hover:shadow-md transition-all active:scale-95"
            >
              Refresh Insight
            </button>
            {/* 🌟 [수정] 여기에 테스트 벤치를 배치해서 화면에 보이게 합니다! */}
            <div className="mt-auto pt-10">
              <ToastTestBench />
            </div>
          </section>
        </div>
      </motion.div>
    </div>
  );
}

const MiniStat = ({ label, value, color = "text-gray-800" }: any) => (
  <div>
    <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">{label}</p>
    <p className={`text-[13px] font-medium ${color}`}>{value}</p>
  </div>
);

const ActivityRow = ({ title, time }: any) => (
  <div className="flex justify-between items-center group cursor-pointer">
    <p className="text-[12px] text-gray-600 group-hover:text-gray-900 transition-colors">{title}</p>
    <span className="text-[11px] font-medium text-gray-400">{time}</span>
  </div>
);

const ToastTestBench = () => {
  const addToast = useToastStore((state) => state.addToast);

  const triggerRandomToast = () => {
    const messages = [
      { text: "시스템 배포 완료", type: "success" },
      { text: "서버 온도 높음!", type: "warning" },
      { text: "DB 연결 에러", type: "error" },
    ];
    const random = messages[Math.floor(Math.random() * messages.length)];
    addToast(random.text, random.type as any);
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Toast Debugger</p>
      <div className="flex gap-2">
        <button
          onClick={triggerRandomToast}
          className="flex-1 flex items-center justify-center gap-2 py-2 bg-zinc-900 text-white rounded-lg text-[10px] font-bold hover:bg-zinc-800 transition-all active:scale-95"
        >
          RANDOM
        </button>
        <button
          onClick={() => addToast("성공!", "success")}
          className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 hover:bg-blue-100"
        >
          ㅇㄴ
        </button>
      </div>
    </div>
  );
};
export default Page;