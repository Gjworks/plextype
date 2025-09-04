'use client'
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

import Modal from '@plextype/components/modal/Modal'
import SearchForm from 'src/widgets/forms/SearchForm'

const MymenuTemplate = () => {
  const [showModal, setShowModal] = useState(false)
  const closeModal = close => {
    setShowModal(close)
  }
  const innerAnimation = {
    open: {
      opacity: 1,
      x: '0%',
      transition: {
        duration: 0.3,
      },
    },
    close: {
      opacity: 0,
      x: '-20%',
      transition: {
        duration: 0.2,
      },
    },
  }
  return (
    <>
      <div className="mx-auto min-h-screen max-w-screen-xl border-l border-gray-200 bg-white/90 dark:bg-dark-900/80 dark:border-transparent px-3 pb-10 pt-8 backdrop-blur-lg">
        <div className="mb-3">
          <div className="flex gap-4 px-3">
            <div className="text-xl font-semibold text-black dark:text-white">
              알림센터
            </div>
          </div>
        </div>
        <div className="py-4">
          <div className="">
            <button
              className="flex w-full items-center gap-4 rounded-full bg-gray-400/10 px-3 py-2 text-gray-400 backdrop-blur-lg hover:bg-gray-300/60 hover:text-gray-900 dark:hover:text-white"
              onClick={() => setShowModal(!showModal)}
            >
              <div className="">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                  />
                </svg>
              </div>
              <div className="text-sm">검색어를 입력하세요.</div>
            </button>
          </div>
        </div>
        <div className="h-full py-3">
          <div className="flex h-[350px] items-center justify-center rounded-xl bg-gray-100 dark:bg-dark-600/20 p-5">
            <div className="text-sm text-gray-400">알림이 없습니다.</div>
          </div>
        </div>
      </div>
      <Modal state={showModal} close={closeModal}>
        <SearchForm />
      </Modal>
    </>
  )
}
export default MymenuTemplate
