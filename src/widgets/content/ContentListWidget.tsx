"use client"

import React from "react"

interface ContentListWidgetProps {
  pid: string;   // 소문자 string 권장
  count: number;
}

const ContentListWidget = ({ pid, count }: ContentListWidgetProps) => {

  return (
    <>
      <div className="p-4 rounded-lg bg-card text-card-foreground">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium tracking-tight">콘텐츠 목록 ({pid})</h3>
          <span className="text-xs text-muted-foreground">최대 {count}개</span>
        </div>

        {/* 💡 여기에 데이터 매핑 로직이 위치합니다 */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground italic">콘텐츠를 불러오는 중입니다...</p>
        </div>
      </div>
    </>
  )
}

export default  ContentListWidget