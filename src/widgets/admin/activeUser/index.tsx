'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Users } from 'lucide-react'
import { getActiveUserList } from './activeUser'
import useRelativeTime from '@core/hooks/date/useRelativeTime'

interface ActiveUser {
  id: string
  nickName: string // NickName 대신 nickname으로 통일하는 게 국룰입니다. ㅡㅡ+
  status: string
  duration: number
  loginAt: string
}

const UserItem = ({ user }: { user: ActiveUser }) => {
  // 이미 만들어두신 훅 사용! "5분 전" 등으로 변환됩니다.
  const timeAgo = useRelativeTime(user.loginAt)

  return (
    <div className="flex items-center gap-3">
      {/* 아바타 (첫 글자) */}
      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[10px] text-blue-400 border border-blue-100 font-bold">{user.nickName.charAt(0).toUpperCase()}</div>

      <div className="flex-1">
        <p className="text-[12px] font-medium text-gray-800">{user.nickName}</p>
        <div className="flex items-center gap-1.5">
          <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
          {/* 🌟 기존 duration 대신 timeAgo(상대 시간) 표시 */}
          <p className="text-[11px] text-blue-500 font-mono">{timeAgo}</p>
        </div>
      </div>
    </div>
  )
}

export default function ActiveUserPulse() {
  const [users, setUsers] = useState<ActiveUser[]>([])

  const refreshList = async () => {
    const data = await getActiveUserList(5)
    // 85원 정신: 유저 ID가 숫자면 'User #1' 식으로 표시하거나,
    // 나중에 DB에서 이름을 가져오는 로직을 붙이면 좋습니다.
    setUsers(data)
  }

  useEffect(() => {
    refreshList()
    const timer = setInterval(refreshList, 10000) // 10초마다 갱신
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="space-y-8 bg-white/80 p-8 rounded-xl shadow-lg shadow-gray-100">
      <header className="flex justify-between items-center">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">User Pulse</p>
          <div className="text-sm font-medium text-gray-500">Live session ({users.length})</div>
        </div>
        <Link href="/admin/user/active" className="hover:text-blue-500 transition-colors cursor-pointer">
          <Users size={14} className="text-gray-300 hover:text-blue-500" />
        </Link>
      </header>

      <div className="space-y-5">
        {users.length > 0 ? (
          users.map(user => (
            // 🌟 분리한 UserItem 컴포넌트 호출
            <UserItem key={user.id} user={user} />
          ))
        ) : (
          <p className="text-[11px] text-gray-400 text-center py-4">접속자가 없습니다.</p>
        )}
      </div>
    </section>
  )
}
