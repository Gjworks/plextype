import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { getCommentListAll } from './comment'

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/ko'

dayjs.extend(relativeTime)
dayjs.locale('ko')

const extractCommentPreview = (content?: string | null) => {
  if (!content) return ''

  try {
    const parsed = JSON.parse(content)

    if (parsed?.type !== 'doc') return content

    const textParts: string[] = []
    let imageCount = 0

    const walk = (node: any) => {
      if (!node) return

      if (node.type === 'text' && node.text) {
        textParts.push(node.text)
      }

      if (node.type === 'image') {
        imageCount += 1
      }

      if (Array.isArray(node.content)) {
        node.content.forEach(walk)
      }
    }

    walk(parsed)

    const text = textParts.join(' ').replace(/\s+/g, ' ').trim()
    if (text) return text
    if (imageCount > 0) return imageCount > 1 ? `이미지 ${imageCount}개` : '이미지'

    return ''
  } catch {
    return content
  }
}

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
    return <div className="h-[240px] w-full border-t border-slate-100 dark:border-dark-800" />
  }

  if (loading) {
    return (
      <div className="space-y-5">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="h-4 w-full animate-pulse rounded bg-gray-100 dark:bg-dark-800"
          />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-[12px] text-gray-400 dark:text-dark-500">
        최근 댓글이 없습니다.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {items.map((item) => {
        const document = item.document
        const module = document?.module
        const preview = extractCommentPreview(item.content)

        if (!document || !module) {
          return null
        }

        return (
          <Link
            href={`/posts/${module.mid}/${document.slug}#comment-${item.id}`}
            key={item.id}
            className="group block cursor-pointer"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="truncate text-[12px] text-gray-600 transition-colors group-hover:text-gray-900 dark:text-dark-300 dark:group-hover:text-dark-100">
                  [{module.moduleName}] {document.title || '제목 없음'}
                </div>

                <div className="mt-1 line-clamp-1 text-[11px] text-gray-400 dark:text-dark-500">
                  {preview || '내용 없음'}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <span className="text-[11px] font-medium text-gray-800 dark:text-dark-200">
                  {item.user?.nickName || '비회원'}
                </span>

                <span className="text-[11px] font-medium text-gray-400 dark:text-dark-500">
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
