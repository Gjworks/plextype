'use client'

import { motion } from 'framer-motion'

const FootAlert = () => {
  const variants = {
    onscreen: {
      y: 0,
      opacity: [0, 1],
      transition: {
        duration: 0.4,
      },
    },
    offscreen: {
      y: 25,
      opacity: 0,
    },
  }
  return (
    <>
      <motion.div
        variants={variants}
        initial="offscreen"
        whileInView="onscreen"
        viewport={{ once: false, amount: 0.3 }}
        className="transition transform z-100 bottom-0 inset-x-0 pb-2 sm:py-5 opacity-100 scale-100 translate-y-0 ease-out duration-500 lg:mb-0 hover:translate-y-1 hover:transition-all hover:duration-300"
      >
        <div className="px-3">
          <div className="p-3 rounded-xl bg-gray-900 dark:bg-dark-700/75 shadow-lg shadow-gray-400 dark:shadow-dark-950">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="w-0 flex-1 flex items-center px-3">
                <div className="inline-block lg:flex gap-4 items-center font-medium text-white dark:text-dark-50">
                  <div className="">
                    <span className="text-base">Plextype</span> Beta release!
                  </div>
                  <div className="hidden md:flex flex-1 items-center text-gray-400">
                    <span className="text-sm line-clamp-2">
                      손쉽게 사용가능한 UI Components가 업데이트 되었습니다.
                    </span>
                  </div>
                </div>
              </div>
              <div className="order-3 flex-shrink-0 w-full sm:order-2 sm:mt-0 sm:w-auto">
                <div className="rounded-md shadow-sm">
                  <a
                    href="http://plextype.com"
                    target="_blank"
                    className="flex items-center gap-2 justify-center px-4 py-2 border border-transparent text-sm leading-5 font-medium rounded-md text-gray-900 bg-white dark:bg-dark-950 dark:text-white hover:text-gray-800 focus:outline-none focus:underline"
                  >
                    Learn more
                    <span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.75}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                        />
                      </svg>
                    </span>
                  </a>
                </div>
              </div>
              <div className="order-2 flex-shrink-0 sm:order-3">
                <button
                  type="button"
                  className="-mr-1 flex p-2 rounded-md hover:bg-gray-700/70 dark:hover:bg-dark-950 focus:outline-none focus:bg-gray-800 "
                  aria-label="Hide banner"
                >
                  <svg
                    className="h-6 w-6 text-white dark:text-white"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    ></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}
export default FootAlert
