'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import nav from '@plextype/res/config/navigation.json'

const SideNavTemplate = props => {
  const pathname = usePathname()
  const variants = {
    onscreen: {
      x: 0,
      opacity: [0, 1],
      transition: {
        duration: 0.4,
      },
    },
    offscreen: {
      x: -25,
      opacity: 0,
    },
  }
  return (
    <>
      <motion.div className="px-3">
        <div className="space-y-1">
          <motion.div className="mb-1 px-2 pb-2 pt-5 text-xs font-semibold text-gray-950/40 dark:text-white">
            Default
          </motion.div>
          <motion.div variants={variants}>
            <Link
              href="/"
              className={
                'flex items-center space-x-2 rounded-md px-2 py-2 text-gray-900 lg:px-3 ' +
                (pathname === '/'
                  ? 'bg-gray-950 text-white dark:bg-dark-950 dark:text-white'
                  : 'hover:bg-gray-200 hover:text-black dark:text-dark-400 dark:hover:bg-dark-950/80 dark:hover:text-white')
              }
            >
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 11h-1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-.707-1.707l7-7Z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <span className="text-[0.752rem] font-normal">Home</span>
            </Link>
          </motion.div>
          <motion.div variants={variants}>
            <Link
              href="/"
              className="flex items-center space-x-2 rounded-md px-2 py-2 text-gray-900 hover:bg-gray-200 hover:text-black lg:px-3 dark:text-dark-400 dark:hover:bg-dark-950/80 dark:hover:text-white"
            >
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 2a6 6 0 0 0-6 6c0 1.887-.454 3.665-1.257 5.234a.75.75 0 0 0 .515 1.076 32.91 32.91 0 0 0 3.256.508 3.5 3.5 0 0 0 6.972 0 32.903 32.903 0 0 0 3.256-.508.75.75 0 0 0 .515-1.076A11.448 11.448 0 0 1 16 8a6 6 0 0 0-6-6ZM8.05 14.943a33.54 33.54 0 0 0 3.9 0 2 2 0 0 1-3.9 0Z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <span className="text-[0.752rem] font-normal">Notification</span>
            </Link>
          </motion.div>
        </div>
      </motion.div>
      <motion.div className="px-3">
        <div className="mb-1 px-2 pb-2 pt-5 text-xs font-semibold text-gray-950/40 dark:text-white">
          Nav
        </div>
        <motion.div className="mb-1 space-y-1">
          {nav.header &&
            Object.entries(nav.header).map((data, index) => {
              return (
                <motion.div variants={variants} key={data[1].name}>
                  <Link
                    href={data[1].route}
                    className={
                      'flex items-center space-x-2 rounded-md px-2 py-2 lg:px-3 ' +
                      (pathname === data[1].route
                        ? 'bg-gray-950 text-white dark:bg-dark-950 dark:text-white'
                        : 'dark:text-dark-400 text-gray-900 hover:bg-gray-200 hover:text-black dark:hover:bg-dark-950/80 dark:hover:text-white')
                    }
                  >
                    <span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-4 w-4"
                      >
                        <path
                          fillRule="evenodd"
                          d="M15.988 3.012A2.25 2.25 0 0 1 18 5.25v6.5A2.25 2.25 0 0 1 15.75 14H13.5V7A2.5 2.5 0 0 0 11 4.5H8.128a2.252 2.252 0 0 1 1.884-1.488A2.25 2.25 0 0 1 12.25 1h1.5a2.25 2.25 0 0 1 2.238 2.012ZM11.5 3.25a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75v.25h-3v-.25Z"
                          clipRule="evenodd"
                        />
                        <path
                          fillRule="evenodd"
                          d="M2 7a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7Zm2 3.25a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1-.75-.75Zm0 3.5a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1-.75-.75Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                    <span className="text-[0.752rem] font-normal">{data[1].title}</span>
                  </Link>
                </motion.div>
              )
            })}
        </motion.div>
      </motion.div>
      <motion.div className="px-3">
        <div className="space-y-1">
          <motion.div className="mb-1 px-2 pb-2 pt-5 text-xs font-semibold text-gray-950/40 dark:text-white">
            Link
          </motion.div>
          <motion.div variants={variants}>
            <Link
              href="/"
              className="flex items-center space-x-2 rounded-md px-2 py-2 text-gray-900 hover:bg-gray-200 hover:text-black lg:px-3 dark:text-dark-400 dark:hover:bg-dark-950/80 dark:hover:text-white"
            >
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 11h-1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-.707-1.707l7-7Z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <span className="text-[0.752rem] font-normal">Forum</span>
            </Link>
          </motion.div>
          <motion.div variants={variants}>
            <Link
              href="/"
              className="flex items-center space-x-2 rounded-md px-2 py-2 text-gray-900 hover:bg-gray-200 hover:text-black lg:px-3 dark:text-dark-400 dark:hover:bg-dark-950/80 dark:hover:text-white"
            >
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 2a6 6 0 0 0-6 6c0 1.887-.454 3.665-1.257 5.234a.75.75 0 0 0 .515 1.076 32.91 32.91 0 0 0 3.256.508 3.5 3.5 0 0 0 6.972 0 32.903 32.903 0 0 0 3.256-.508.75.75 0 0 0 .515-1.076A11.448 11.448 0 0 1 16 8a6 6 0 0 0-6-6ZM8.05 14.943a33.54 33.54 0 0 0 3.9 0 2 2 0 0 1-3.9 0Z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <span className="flex-1 text-[0.752rem] font-normal">Github</span>
              <span className="text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-3 w-3"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h5a.75.75 0 0 1 0 1.5h-5Z"
                    clipRule="evenodd"
                  />
                  <path
                    fillRule="evenodd"
                    d="M6.194 12.753a.75.75 0 0 0 1.06.053L16.5 4.44v2.81a.75.75 0 0 0 1.5 0v-4.5a.75.75 0 0 0-.75-.75h-4.5a.75.75 0 0 0 0 1.5h2.553l-9.056 8.194a.75.75 0 0 0-.053 1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </>
  )
}
export default SideNavTemplate
