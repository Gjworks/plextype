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
      <section className="bg-white/80 p-8 rounded-xl shadow-lg shadow-gray-100">
        <p className="text-[9px] font-bold uppercase tracking-[0.012em] text-gray-400 mb-1">
          Runtime
        </p>
        <div className="text-sm font-medium text-gray-500 uppercase tracking-[0.012em] mb-6">
          System Stack
        </div>

        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-4 rounded bg-gray-100 animate-pulse" />
          ))}
        </div>
      </section>
    )
  }

  if (!info) {
    return null
  }

  return (
    <section className="bg-white/80 p-8 rounded-xl shadow-lg shadow-gray-100">
      <div className="flex items-start justify-between mb-7">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.012em] text-gray-400 mb-1">
            Runtime
          </p>
          <div className="text-sm font-medium text-gray-500 uppercase tracking-[0.012em]">
            System Stack
          </div>
        </div>

        <div className="w-9 h-9 rounded-xl bg-gray-900 text-white flex items-center justify-center">
          <Server size={15} />
        </div>
      </div>

      <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 mb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">
              Application
            </p>
            <p className="text-[13px] font-semibold text-gray-800">
              {info.app.name}
            </p>
          </div>

          <span className="px-2.5 py-1 rounded-full bg-white text-[10px] font-bold text-blue-600 shadow-sm">
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

      <div className="border-t border-gray-100 pt-4 space-y-2">
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
  <div className="bg-white rounded-xl border border-gray-100 p-3">
    <div className="flex items-center gap-2 mb-2">
      <Icon size={12} className="text-gray-300" />
      <p className="text-[9px] font-bold uppercase text-gray-400">
        {label}
      </p>
    </div>
    <p className="text-[13px] font-semibold text-gray-800">
      {value}
    </p>
  </div>
)

const StackLine = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between">
    <span className="text-[11px] text-gray-400">{label}</span>
    <span className="text-[11px] font-mono text-gray-600">{value}</span>
  </div>
)

export default SystemStackWidget