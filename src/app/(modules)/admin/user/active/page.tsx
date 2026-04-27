'use client'

import React, { useEffect, useState } from 'react'
import { getActiveUserList, forceLogout } from '@/widgets/admin/activeUser/activeUser'
import { ArrowLeft, RefreshCw, LogOut } from 'lucide-react'
import { useToastStore } from '@/core/store/useToastStore'
import Link from 'next/link'

export default function ActiveUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const addToast = useToastStore(state => state.addToast)

  const loadData = async () => {
    setLoading(true)
    const data = await getActiveUserList()
    setUsers(data)
    setLoading(false)
  }

  const handleKick = async (userId: string, ip: string, nickName: string) => {
    if (!confirm(`${nickName}님을 강제로 로그아웃 시키겠습니까?`)) return

    const res = await forceLogout(userId, ip)
    if (res.success) {
      addToast(`${nickName}님을 추방했습니다.`, 'success')
      loadData() // 리스트 새로고침
    } else {
      addToast('추방에 실패했습니다.', 'error')
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* 헤더 영역 */}
      <header className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-full transition-all">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">실시간 접속자 명단</h1>
        </div>
        <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 active:scale-95 transition-all">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          새로고침
        </button>
      </header>

      {/* 테이블 영역 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="p-4 text-[11px] font-bold uppercase text-gray-400 tracking-wider">사용자</th>
              <th className="p-4 text-[11px] font-bold uppercase text-gray-400 tracking-wider">계정 ID</th>
              <th className="p-4 text-[11px] font-bold uppercase text-gray-400 tracking-wider">IP 주소</th>
              <th className="p-4 text-[11px] font-bold uppercase text-gray-400 tracking-wider">상태</th>
              <th className="p-4 text-[11px] font-bold uppercase text-gray-400 tracking-wider text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((user, i) => (
              <tr key={i} className="hover:bg-gray-50/30 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[10px] text-blue-600 font-bold">{user.nickName?.charAt(0)}</div>
                    <span className="text-sm font-medium text-gray-700">{user.nickName}</span>
                  </div>
                </td>
                <td className="p-4 text-sm text-gray-500 font-mono">{user.accountId || '-'}</td>
                <td className="p-4 text-sm text-gray-400 font-mono">{user.ip}</td>
                <td className="p-4">
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-600 rounded-md text-[10px] font-bold uppercase">
                    <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                    Online
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => handleKick(user.id, user.ip, user.nickName)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all active:scale-90" title="강제 로그아웃">
                    <LogOut size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && !loading && <div className="p-20 text-center text-gray-400 text-sm">현재 접속 중인 회원이 없습니다.</div>}
      </div>
    </div>
  )
}
