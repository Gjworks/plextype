'use client'

import Image from 'next/image'

import { motion } from 'framer-motion'

const Page = () => {
  const parentVariants = {
    onscreen: {
      transition: { staggerChildren: 0.2 },
    },
    offscreen: {
      transition: { staggerChildren: 0.2, staggerDirection: -1 },
    },
  }
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
        initial="offscreen"
        whileInView="onscreen"
        viewport={{ once: false, amount: 0.1 }}
        variants={parentVariants}
        className="pt-20 pb-10"
      >
        <div className="relative mx-auto max-w-screen-xl pt-20 px-3">
          <div className="grid grid-cols-12 gap-0 lg:gap-8 py-10">
            <div className="col-span-12"></div>
          </div>
        </div>
      </motion.div>
    </>
  )
}

export default Page
