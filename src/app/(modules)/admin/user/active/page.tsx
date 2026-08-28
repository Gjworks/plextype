'use client'

import React, { useEffect, useState } from 'react'
import { getActiveUserList, forceLogout } from '@/widgets/admin/activeUser/activeUser'
import { RefreshCw, LogOut, Clock, Wifi } from 'lucide-react'
import { useToastStore } from '@/core/store/useToastStore'
import useRelativeTime from '@/core/hooks/date/useRelativeTime'
import Button from '@components/button/Button'
import { UserAdminTabs } from '@/modules/user/admin/adminTabs'

const UserRow = ({ user, onKick }: { user: any; onKick: (id: string, ip: string, name: string) => void }) => {
  const timeAgo = useRelativeTime(user.loginAt)

  return (
    <tr className="border-b border-gray-100 transition-colors last:border-b-0 hover:bg-primary-50/30 dark:border-dark-800 dark:hover:bg-white/[0.04]">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-[10px] font-bold text-primary-600 dark:bg-primary-400/10 dark:text-primary-300">{user.nickName?.charAt(0)}</div>
          <span className="text-sm font-medium text-gray-700 dark:text-dark-100">{user.nickName}</span>
        </div>
      </td>
      <td className="p-4 text-sm text-gray-500 font-mono dark:text-dark-300">{user.accountId || '-'}</td>
      <td className="p-4 text-sm text-gray-400 font-mono">{user.ip}</td>

      {/* 🌟 2. 접속 시간 컬럼 데이터 */}
      <td className="p-4 text-sm text-primary-500 font-medium dark:text-primary-300">
        <div className="flex items-center gap-1">
          <Clock size={12} className="text-primary-300" />
          {timeAgo}
        </div>
      </td>

      <td className="p-4">
        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-600 rounded-md text-[10px] font-bold uppercase">
          <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
          Online
        </span>
      </td>
      <td className="p-4 text-right">
        <button onClick={() => onKick(user.id, user.ip, user.nickName)} className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-gray-400 transition-all hover:bg-red-50 hover:text-red-500 active:scale-95 dark:hover:bg-red-400/10 dark:hover:text-red-300" title="강제 로그아웃">
          <LogOut size={16} />
        </button>
      </td>
    </tr>
  )
}

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

    // 🌟 서버 액션을 userId만 받도록 수정했다면 여기서 ip는 참고용으로만 남습니다.
    const res = await forceLogout(userId)
    if (res.success) {
      addToast(`${nickName}님을 추방했습니다.`, 'success')
      loadData()
    } else {
      addToast('추방에 실패했습니다.', 'error')
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div className="mx-auto max-w-screen-2xl px-3 py-10 dark:text-dark-100">
      <div className="space-y-6">
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-dark-800 dark:bg-dark-950">
          <UserAdminTabs activePath="/admin/user/active" />

          <div className="flex flex-col gap-4 px-5 py-7 xl:flex-row xl:items-end xl:justify-between md:px-8">
            <div>
              <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-gray-400">
                <Wifi size={13} />
                User Session
              </div>
              <div className="mt-2 text-lg font-semibold text-gray-700 dark:text-dark-100">로그인 된 회원</div>
              <div className="mt-1 text-sm text-gray-400">
                현재 접속 중인 회원 세션을 확인하고 필요할 때 강제 로그아웃할 수 있습니다.
              </div>
            </div>

            <Button
              type="button"
              onClick={loadData}
              fullWidth={false}
              icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
            >
              새로고침
            </Button>
          </div>
        </section>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-dark-800 dark:bg-dark-950">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 dark:border-dark-800 dark:bg-dark-950/70">
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">사용자</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">계정 ID</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">IP 주소</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">접속 시간</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">상태</th>
                  <th className="p-4 text-right text-[10px] font-bold uppercase tracking-widest text-gray-400">관리</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => (
                  <UserRow key={user.id || i} user={user} onKick={handleKick} />
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && !loading && <div className="p-20 text-center text-sm text-gray-400">현재 접속 중인 회원이 없습니다.</div>}
        </div>
      </div>
    </div>
  )
}
