'use client'

import React, { useEffect, useState } from 'react'
import { Server, Package, Cpu, Database } from 'lucide-react'
import { getSystemStackInfo } from './systemStack'

type SystemStackInfo = Awaited<ReturnType<typeof getSystemStackInfo>>

const SystemStackWidget = () => {
  const [info, setInfo] = useState<SystemStackInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const data = await getSystemStackInfo()
        setInfo(data)
      } catch (error) {
        console.error('시스템 스택 정보 로드 실패:', error)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  if (loading) {
    return (
	      <section className="rounded-xl bg-white/80 p-8 shadow-lg shadow-gray-100 dark:border dark:border-dark-800 dark:bg-dark-900/70 dark:shadow-black/20">
	        <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.012em] text-gray-400 dark:text-dark-500">
	          Runtime
	        </p>
	        <div className="mb-6 text-sm font-medium uppercase tracking-[0.012em] text-gray-500 dark:text-dark-300">
	          System Stack
	        </div>

	        <div className="space-y-3">
	          {Array.from({ length: 5 }).map((_, index) => (
	            <div key={index} className="h-4 animate-pulse rounded bg-gray-100 dark:bg-dark-800" />
	          ))}
	        </div>
      </section>
    )
  }

  if (!info) {
    return null
  }

  return (
	    <section className="rounded-xl bg-white/80 p-8 shadow-lg shadow-gray-100 dark:border dark:border-dark-800 dark:bg-dark-900/70 dark:shadow-black/20">
	      <div className="flex items-start justify-between mb-7">
	        <div>
	          <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.012em] text-gray-400 dark:text-dark-500">
	            Runtime
	          </p>
	          <div className="text-sm font-medium uppercase tracking-[0.012em] text-gray-500 dark:text-dark-300">
	            System Stack
	          </div>
	        </div>

	        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900 text-white dark:bg-dark-100 dark:text-dark-950">
	          <Server size={15} />
	        </div>
	      </div>

	      <div className="mb-5 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-dark-800 dark:bg-dark-950/70">
	        <div className="flex items-center justify-between">
	          <div>
	            <p className="mb-1 text-[10px] font-bold uppercase text-gray-400 dark:text-dark-500">
	              Application
	            </p>
	            <p className="text-[13px] font-semibold text-gray-800 dark:text-dark-100">
	              {info.app.name}
	            </p>
	          </div>

	          <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-gray-600 shadow-sm dark:bg-dark-800 dark:text-dark-200">
	            v{info.app.version}
	          </span>
	        </div>
	      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <StackMini icon={Cpu} label="Node" value={info.runtime.node} />
        <StackMini icon={Package} label="npm" value={info.runtime.npm} />
        <StackMini icon={Package} label="Next.js" value={info.packages.next} />
        <StackMini icon={Package} label="React" value={info.packages.react} />
        <StackMini icon={Database} label="Prisma" value={info.packages.prismaClient} />
        <StackMini icon={Database} label="pg" value={info.packages.pg} />
      </div>

	      <div className="space-y-2 border-t border-gray-100 pt-4 dark:border-dark-800">
	        <StackLine label="React DOM" value={info.packages.reactDom} />
        <StackLine label="Prisma CLI" value={info.packages.prismaCli} />
        <StackLine label="Adapter PG" value={info.packages.adapterPg} />
        <StackLine label="TypeScript" value={info.packages.typescript} />
      </div>
    </section>
  )
}

const StackMini = ({
                     icon: Icon,
                     label,
                     value,
                   }: {
  icon: any
  label: string
  value: string
}) => (
	  <div className="rounded-xl border border-gray-100 bg-white p-3 dark:border-dark-800 dark:bg-dark-950/70">
	    <div className="flex items-center gap-2 mb-2">
	      <Icon size={12} className="text-gray-300 dark:text-dark-500" />
	      <p className="text-[9px] font-bold uppercase text-gray-400 dark:text-dark-500">
	        {label}
	      </p>
	    </div>
	    <p className="text-[13px] font-semibold text-gray-800 dark:text-dark-100">
	      {value}
	    </p>
	  </div>
)

const StackLine = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between">
	    <span className="text-[11px] text-gray-400 dark:text-dark-500">{label}</span>
	    <span className="font-mono text-[11px] text-gray-600 dark:text-dark-300">{value}</span>
  </div>
)

export default SystemStackWidget
