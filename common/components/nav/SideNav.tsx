'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import SideNavTemplate from 'src/widgets/nav/SideNavTemplate'

const SideNav = props => {
  const pathname = usePathname()
  console.log(pathname)
  const parentVariants = {
    onscreen: {
      transition: { staggerChildren: 0.1 },
    },
    offscreen: {
      transition: { staggerChildren: 0.1, staggerDirection: -1 },
    },
  }

  return (
    <>
      <div className="relative h-full overflow-hidden">
        <motion.div
          variants={parentVariants}
          initial="offscreen"
          whileInView="onscreen"
          // initial={{ opacity: 0, x: "-50%" }}
          className="overflow-scroll-hide dark:bg-dark-900/80 absolute bottom-0 top-0 h-full w-[275px] overflow-y-auto bg-white/90 pb-[80px]"
        >
          <SideNavTemplate />
        </motion.div>
      </div>
    </>
  )
}
export default SideNav
