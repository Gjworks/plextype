'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
// 🌟 [수정] HardDrive 아이콘을 추가로 임포트했습니다!
import { Users, FileText, MessageSquare, Activity, ArrowUpRight, Zap, Globe, HardDrive } from 'lucide-react'
import { useToastStore } from '@/core/store/useToastStore'
import ActiveUserPulse from '@widgets/admin/activeUser'
import DocumentList from "@widgets/admin/documentList";
import SystemStackWidget from '@widgets/admin/system'
import CommentList from "@widgets/admin/commentList";

const Page = () => {
  const [cpuHistory, setCpuHistory] = useState<number[]>(new Array(15).fill(0))
  const addToast = useToastStore(state => state.addToast)
  // 🌟 [수정] 초기 상태에 network, disk, uptime을 추가해서 'undefined' 에러를 방지합니다.
  const [currentStats, setCurrentStats] = useState({
    cpu: 0,
    mem: 0,
    network: { down: '0.00', up: '0.00' },
    disk: 0,
    uptime: 0,
  })

  useEffect(() => {
    const eventSource = new EventSource('/api/system/stats')

    eventSource.onmessage = event => {
      const data = JSON.parse(event.data)
      setCurrentStats(data)

      setCpuHistory(prev => {
        const newHistory = [...prev.slice(1), data.cpu]
        return newHistory
      })
    }

    eventSource.onerror = err => {
      console.error('SSE 연결 오류:', err)
      eventSource.close()
    }

    return () => eventSource.close()
  }, [])

  return (
    <div className="relative min-h-screen font-sans">
      {/* 🌌 배경 영역 */}
      <div className="absolute inset-0 -z-10 bg-[#F8F9FA] dark:bg-dark-950">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100/50 rounded-full blur-[120px] dark:bg-cyan-950/20" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-100/40 rounded-full blur-[120px] dark:bg-indigo-950/20" />
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-12 gap-6 max-w-[1920px] mx-auto">
        {/* [좌측 3칸] 유저 펄스 */}
        <div className="col-span-12 lg:col-span-3  space-y-6">
          <section className="space-y-8 bg-white/80 p-8 rounded-xl shadow-lg shadow-gray-100 dark:border dark:border-dark-800 dark:bg-dark-900/70 dark:shadow-black/20">
            <p className="text-[9px] font-bold uppercase tracking-[0.012em] text-gray-400 mb-1">Community</p>
            <div className="text-sm font-medium text-gray-500 uppercase tracking-[0.012em] dark:text-dark-300">Recent Documents</div>
            <DocumentList />
          </section>
          <section className="space-y-8 bg-white/80 p-8 rounded-xl shadow-lg shadow-gray-100 dark:border dark:border-dark-800 dark:bg-dark-900/70 dark:shadow-black/20">
            <p className="text-[9px] font-bold uppercase tracking-[0.012em] text-gray-400 mb-1">Community</p>
            <div className="text-sm font-medium text-gray-500 uppercase tracking-[0.012em] dark:text-dark-300">Recent Comments</div>
            <CommentList />
          </section>
        </div>

        {/* 🌟 [가운데] System Core (Main) */}
        <div className="col-span-12 lg:col-span-6 space-y-6">
          <section className="bg-white rounded-2xl p-10 shadow-lg shadow-gray-100 flex flex-col dark:border dark:border-dark-800 dark:bg-dark-900/70 dark:shadow-black/20">
            <header className="flex justify-between items-end mb-16">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-gray-100 rounded-md dark:border-dark-800">
                  <Zap size={10} className="text-gray-400" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">System Flow</span>
                </div>
                <div className="text-xl font-medium tracking-tight text-gray-800 dark:text-dark-100">Operational Overview</div>
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
                    <Globe size={12} className="text-gray-300 dark:text-dark-600" />
                    <span className="text-[12px] text-gray-500 font-medium dark:text-dark-300">Network</span>
                  </div>
                  <span className="text-[12px] font-mono text-gray-400">{currentStats.network?.down || '0.00'} MB/s</span>
                </div>
                <div className="h-[2px] w-full bg-gray-50 overflow-hidden dark:bg-dark-800">
                  <motion.div animate={{ width: `${Math.min((Number(currentStats.network?.down) || 0) * 10, 100)}%` }} className="h-full bg-gray-900 dark:bg-cyan-400" />
                </div>
              </div>

              {/* Storage */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-2">
                    <HardDrive size={12} className="text-gray-300 dark:text-dark-600" />
                    <span className="text-[12px] text-gray-500 font-medium dark:text-dark-300">Storage</span>
                  </div>
                  <span className="text-[12px] font-mono text-gray-400">{currentStats.disk}%</span>
                </div>
                <div className="h-[2px] w-full bg-gray-50 overflow-hidden dark:bg-dark-800">
                  <motion.div animate={{ width: `${currentStats.disk}%` }} className="h-full bg-gray-900 dark:bg-cyan-400" />
                </div>
              </div>

              {/* Uptime (박스 제거, 텍스트로만 정갈하게) */}
              <div className="pt-4 flex justify-between items-center border-t border-gray-50 dark:border-dark-800">
                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Uptime</span>
                <span className="text-[12px] font-medium text-gray-600 dark:text-dark-300">
                  {Math.floor(currentStats.uptime / 3600)}h {Math.floor((currentStats.uptime % 3600) / 60)}m
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-12 mt-12 pt-8 border-t border-gray-50 dark:border-dark-800">
              <MiniStat label="Mem" value={`${currentStats.mem}%`} />
              <MiniStat label="Status" value="Active" color="text-blue-500" />
              <MiniStat label="Latency" value="1.2ms" />
            </div>
          </section>


        </div>

        {/* 🌟 [우측] Activity Feed */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <ActiveUserPulse />
          <SystemStackWidget />
        </div>
      </motion.div>


    </div>
  )
}

const MiniStat = ({ label, value, color = 'text-gray-800' }: any) => (
  <div>
    <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">{label}</p>
    <p className={`text-[13px] font-medium dark:text-dark-100 ${color}`}>{value}</p>
  </div>
)

export default Page
