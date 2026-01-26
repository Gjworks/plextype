'use client'
import React from "react";
import { ContainerScroll } from "@plextype/components/hero/scroll-animation";
import Image from "next/image";
const Page = () => {
  return <>
    <div className="flex flex-col">
      <ContainerScroll
        titleComponent={
          <div className="flex flex-col items-center">
            <h1 className="text-4xl md:text-6xl font-bold text-zinc-900 dark:text-white leading-tight">
              더 나은 개발 경험을 위한 <br />
              <span className="text-primary-600 dark:text-primary-400">스크롤 애니메이션</span>
            </h1>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400 max-w-xl">
              스크롤을 내리면 3D 카드가 평면으로 펼쳐지며 대시보드가 나타납니다.
            </p>
          </div>
        }
      >
1
      </ContainerScroll>

      {/* 스크롤 여백을 위한 더미 섹션 */}

    </div>
  </>
}
export default Page
