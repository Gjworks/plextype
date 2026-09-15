'use client'

import { useEffect, useMemo, useState, type ComponentType } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowUpRight, LayoutPanelTop } from 'lucide-react'

import Button from '@/core/components/button/Button'

import { DASHBOARD_WIDGET_STORAGE_KEY, parseDashboardLayout, type PlacedWidget, type WidgetColSpan } from './layout'

export type DashboardWidgetRenderer = {
  eyebrow: string
  title: string
  Component: ComponentType
  bare: boolean
  defaultColSpan: WidgetColSpan
}
export type DashboardWidgetRenderers = Record<string, DashboardWidgetRenderer>
const noAdditionalWidgets: DashboardWidgetRenderers = {}

export const WidgetLoader = () => (
  <div className="space-y-4">
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="h-4 animate-pulse rounded bg-gray-100 dark:bg-dark-800" />
    ))}
  </div>
)

const DocumentListWidget = dynamic(() => import('@/modules/posts/admin/widgets/documentList'), {
  ssr: false,
  loading: () => <WidgetLoader />,
})

const CommentListWidget = dynamic(() => import('@/modules/posts/admin/widgets/commentList'), {
  ssr: false,
  loading: () => <WidgetLoader />,
})

const ActiveUserPulseWidget = dynamic(() => import('@/modules/user/admin/widgets/activeUser'), {
  ssr: false,
  loading: () => (
    <section className="rounded-xl border border-gray-200 bg-white p-8 dark:border-dark-800 dark:bg-dark-900">
      <WidgetLoader />
    </section>
  ),
})

const SystemStackWidget = dynamic(() => import('@/modules/admin/widgets/system'), {
  ssr: false,
  loading: () => (
    <section className="rounded-xl border border-gray-200 bg-white p-8 dark:border-dark-800 dark:bg-dark-900">
      <WidgetLoader />
    </section>
  ),
})

const SystemFlowWidget = dynamic(() => import('@/modules/admin/widgets/systemFlow'), {
  ssr: false,
  loading: () => (
    <section className="rounded-xl border border-gray-200 bg-white p-8 dark:border-dark-800 dark:bg-dark-900">
      <WidgetLoader />
    </section>
  ),
})

const coreWidgets: DashboardWidgetRenderers = {
  'admin.flow': {
    defaultColSpan: 8,
    eyebrow: 'System',
    title: 'System Flow',
    Component: SystemFlowWidget,
    bare: true,
  },
  'posts.documents': {
    defaultColSpan: 6,
    eyebrow: 'Posts',
    title: 'Recent Documents',
    Component: DocumentListWidget,
    bare: false,
  },
  'posts.comments': {
    defaultColSpan: 6,
    eyebrow: 'Posts',
    title: 'Recent Comments',
    Component: CommentListWidget,
    bare: false,
  },
  'user.sessions': {
    defaultColSpan: 4,
    eyebrow: 'User',
    title: 'Live sessions',
    Component: ActiveUserPulseWidget,
    bare: true,
  },
  'admin.system': {
    defaultColSpan: 4,
    eyebrow: 'System',
    title: 'System Stack',
    Component: SystemStackWidget,
    bare: true,
  },
}

const colSpanClassMap: Record<WidgetColSpan, string> = {
  3: 'xl:col-span-3',
  4: 'xl:col-span-4',
  5: 'xl:col-span-5',
  6: 'xl:col-span-6',
  7: 'xl:col-span-7',
  8: 'xl:col-span-8',
  9: 'xl:col-span-9',
  10: 'xl:col-span-10',
  11: 'xl:col-span-11',
  12: 'xl:col-span-12',
}

const Dashboard = ({ additionalWidgets = noAdditionalWidgets }: { additionalWidgets?: DashboardWidgetRenderers }) => {
  const widgetRenderers = useMemo(() => ({ ...coreWidgets, ...additionalWidgets }), [additionalWidgets])
  const defaults = useMemo(() => Object.fromEntries(Object.entries(widgetRenderers).map(([id, widget]) => [id, widget.defaultColSpan])), [widgetRenderers])
  const router = useRouter()
  const [placedWidgetIds, setPlacedWidgetIds] = useState<PlacedWidget[]>([])

  useEffect(() => {
    const refresh = () => {
      try {
        setPlacedWidgetIds(parseDashboardLayout(window.localStorage.getItem(DASHBOARD_WIDGET_STORAGE_KEY), defaults))
      } catch {
        setPlacedWidgetIds([])
      }
    }
    const onStorage = (event: StorageEvent) => {
      if (event.key === DASHBOARD_WIDGET_STORAGE_KEY || event.key === null) refresh()
    }
    refresh()
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', refresh)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', refresh)
    }
  }, [defaults])

  const placedWidgets = useMemo(
    () => placedWidgetIds.map((item) => ({
      layout: item,
      widget: widgetRenderers[item.id],
    })),
    [placedWidgetIds, widgetRenderers],
  )

  return (
    <div className="mx-auto max-w-screen-2xl">
      {placedWidgets.length === 0 ? (
        <EmptyDashboard onConfigure={() => router.push('/admin/site/dashboard')} />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-12"
        >
          {placedWidgets.map(({ layout, widget }) => {
            const WidgetComponent = widget.Component

            return widget.bare ? (
              <div key={layout.id} className={colSpanClassMap[layout.colSpan]}><WidgetComponent /></div>
            ) : (
              <section
                key={layout.id}
                className={`space-y-7 rounded-xl border border-gray-200 bg-white p-6 dark:border-dark-800 dark:bg-dark-950 ${colSpanClassMap[layout.colSpan]}`}
              >
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 dark:text-dark-500">{widget.eyebrow}</p>
                  <h2 className="mt-2 text-sm font-semibold text-gray-900 dark:text-dark-100">{widget.title}</h2>
                </div>
                <WidgetComponent />
              </section>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}

const EmptyDashboard = ({ onConfigure }: { onConfigure: () => void }) => (
  <motion.section
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex min-h-[520px] items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-16 dark:border-dark-700 dark:bg-dark-900"
  >
    <div className="flex max-w-md flex-col items-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-gray-500 dark:bg-dark-800 dark:text-dark-300">
        <LayoutPanelTop size={26} />
      </div>
      <p className="mt-7 text-[11px] font-bold uppercase tracking-[0.24em] text-gray-400 dark:text-dark-500">
        Dashboard
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-gray-900 dark:text-dark-50">
        위젯을 배치하세요.
      </h1>
      <p className="mt-3 text-sm leading-6 text-gray-500 dark:text-dark-400">
        사이트 관리에서 필요한 위젯을 선택하면 관리자 메인에 배치한 순서대로 표시됩니다.
      </p>
      <Button
        type="button"
        fullWidth={false}
        icon={<ArrowUpRight size={16} />}
        onClick={onConfigure}
        className="mt-8 h-12 !border-primary-600 !bg-primary-600 px-5 text-sm font-semibold !text-white hover:!border-primary-500 hover:!bg-primary-500 hover:!text-white dark:!border-primary-400 dark:!bg-primary-400 dark:!text-gray-950 dark:hover:!border-primary-300 dark:hover:!bg-primary-300 dark:hover:!text-gray-950"
      >
        위젯 배치하기
      </Button>
    </div>
  </motion.section>
)

export default Dashboard
