import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { getCommentListAll } from './comment'

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/ko'

dayjs.extend(relativeTime)
dayjs.locale('ko')

const CommentList = ({ mid, count = 5 }: any) => {
  const [mounted, setMounted] = useState(false)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)

    const loadData = async () => {
      try {
        setLoading(true)
        const comments = await getCommentListAll(count)
        setItems(comments || [])
      } catch (error) {
        console.error('댓글 로드 실패:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [mid, count])

  if (!mounted) {
    return <div className="h-[240px] w-full border-t border-slate-100" />
  }

  if (loading) {
    return (
      <div className="space-y-5">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="h-4 w-full rounded bg-gray-100 animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-[12px] text-gray-400">
        최근 댓글이 없습니다.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {items.map((item) => {
        const document = item.document
        const module = document?.module

        if (!document || !module) {
          return null
        }

        return (
          <Link
            href={`/posts/${module.mid}/${document.slug}#comment-${item.id}`}
            key={item.id}
            className="block group cursor-pointer"
          >
            <div className="flex justify-between items-start gap-4">
              <div className="min-w-0">
                <div className="text-[12px] text-gray-600 group-hover:text-gray-900 transition-colors truncate">
                  [{module.moduleName}] {document.title || '제목 없음'}
                </div>

                <div className="mt-1 text-[11px] text-gray-400 line-clamp-1">
                  {item.content}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-medium text-gray-800">
                  {item.user?.nickName || '비회원'}
                </span>

                <span className="text-[11px] font-medium text-gray-400">
                  {dayjs(item.createdAt).fromNow()}
                </span>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

export default CommentList