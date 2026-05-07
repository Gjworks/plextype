import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { getDocumentListAll } from './document'

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/ko'

dayjs.extend(relativeTime)
dayjs.locale('ko')

function extractTextFromTiptap(content: unknown) {
  if (!content) return ''

  let json: any = content

  if (typeof content === 'string') {
    try {
      json = JSON.parse(content)
    } catch {
      return content
    }
  }

  const texts: string[] = []

  const walk = (node: any) => {
    if (!node) return

    if (node.type === 'text' && node.text) {
      texts.push(node.text)
    }

    if (Array.isArray(node.content)) {
      node.content.forEach(walk)
    }
  }

  walk(json)

  return texts.join(' ').trim()
}

const DocumentList = ({ mid, count = 5 }: any) => {
  const [mounted, setMounted] = useState(false)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)

    const loadData = async () => {
      try {
        setLoading(true)
        const documents = await getDocumentListAll(count)
        setItems(documents || [])
      } catch (error) {
        console.error('게시글 로드 실패:', error)
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
        최근 게시글이 없습니다.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {items.map((item) => {
        const module = item.module
        const preview = extractTextFromTiptap(item.content)

        if (!module) {
          return null
        }

        return (
          <Link
            href={`/posts/${module.mid}/${item.slug}`}
            key={item.id}
            className="block group cursor-pointer"
          >
            <div className="flex justify-between items-start gap-4">
              <div className="min-w-0">
                <div className="text-[12px] text-gray-600 group-hover:text-gray-900 transition-colors truncate">
                  [{module.moduleName}] {item.title || '제목 없음'}
                </div>

                <div className="mt-1 text-[11px] text-gray-400 line-clamp-1">
                  {preview}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-medium text-gray-800">
                  {item.user?.nickName || item.authorName || '비회원'}
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

export default DocumentList