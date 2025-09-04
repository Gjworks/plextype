import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

const Authpanel = ({ children }) => {
  const router = useRouter()
  const fixedvar = {
    hidden: { x: 125, y: 0 },
    enter: {
      x: 0,
      y: 0,
      transition: {
        duration: 0.4,
      },
    },
    exit: {
      x: 125,
      y: 0,
      transition: {
        duration: 0.4,
      },
    },
  }

  const parentVariants = {
    onscreen: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.3,
      },
    },
    offscreen: {
      x: 115,
      opacity: 0,
      transition: {
        duration: 0.3,
      },
    },
  }

  return (
    <>
      <motion.div
        variants={fixedvar}
        initial="hidden"
        animate="enter"
        exit="exit"
        className="lg:fixed right-0 bottom-0 top-0 flex justify-center items-center h-[calc(100vh-320px)] lg:h-screen"
      >
        <svg
          className="hidden lg:block left-0 inset-y-0 h-full w-64 text-white fill-white dark:fill-dark-950 z-20 scale-x-[-1]"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <polygon points="50,0 100,0 50,100 0,100"></polygon>
        </svg>
        <div className="relative ml-0 lg:-ml-32 flex-1 h-full z-30 bg-white dark:bg-dark-950 px-0 lg:px-20">
          <div className="lg:flex items-center h-full">
            <div className="absolute left-3 right-3 top-0">
              <motion.header
                transition={{ duration: 0.3 }}
                className="z-101 relative top-0 w-full "
              >
                <div className="max-w-screen-3xl mx-auto">
                  <div className="flex items-center justify-between py-2">
                    <a
                      onClick={() => router.back()}
                      className="dark:text-dark-400 cursor-pointer rounded-lg px-3 py-2 text-gray-500 hover:text-gray-900 dark:hover:text-white bg-gray-100 hover:bg-gray-200 dark:bg-dark-700 dark:hover:bg-dark-800"
                    >
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
                          d="M15.75 19.5L8.25 12l7.5-7.5"
                        />
                      </svg>
                    </a>
                    {process.env.NEXT_PUBLIC_DEFAULT_URL && (
                      <Link
                        href={process.env.NEXT_PUBLIC_DEFAULT_URL}
                        className="dark:text-dark-400 cursor-pointer rounded-lg px-3 py-2 text-gray-500 hover:text-gray-900 dark:hover:text-white bg-gray-100 hover:bg-gray-200 dark:bg-dark-700 dark:hover:bg-dark-800"
                      >
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
                            d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                          />
                        </svg>
                      </Link>
                    )}
                  </div>
                </div>
              </motion.header>
            </div>
            <div className="w-full pt-10 lg:pt-0 lg:w-[32rem] px-3 overflow-hidden z-50 bg-white dark:bg-dark-950">
              <motion.div className="w-full">{children}</motion.div>
              <footer>
                <div className="mx-auto max-w-screen-sm pb-10 pt-5">
                  <div className="dark:via-dark-600 h-px w-full bg-gradient-to-r from-transparent via-gray-200/50 to-transparent"></div>
                  <div className="pb-8 pt-8 lg:pt-5">
                    <motion.div
                      variants={parentVariants}
                      initial="offscreen"
                      whileInView="onscreen"
                      viewport={{ once: false, amount: 0.3 }}
                      className="flex flex-wrap justify-between gap-8"
                    >
                      <motion.div
                        className="flex items-center justify-center"
                        variants={parentVariants}
                      >
                        <div className="dark:text-dark-200 text-center text-xs text-gray-700 lg:text-left">
                          ⓒ 지제이웍스
                        </div>
                      </motion.div>
                      <motion.div className="flex items-center justify-center lg:justify-end">
                        <div className="flex flex-wrap gap-4">
                          <motion.div variants={parentVariants}>
                            <Link
                              href="/"
                              className="dark:text-dark-400 text-xs text-gray-400 hover:text-black dark:hover:text-white"
                            >
                              Terms of service
                            </Link>
                          </motion.div>
                          <motion.div variants={parentVariants}>
                            <Link
                              href="/"
                              className="dark:text-dark-400 text-xs text-gray-400 hover:text-black dark:hover:text-white"
                            >
                              Privacy policy
                            </Link>
                          </motion.div>
                        </div>
                      </motion.div>
                    </motion.div>
                  </div>
                </div>
              </footer>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}

export default Authpanel
