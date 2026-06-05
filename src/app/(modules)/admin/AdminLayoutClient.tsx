'use client'

import React, { useState, useMemo, useEffect, useRef, useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation' // ✅ useRouter 추가
import { motion, AnimatePresence } from 'framer-motion'
import pkg from '../../../../package.json'
import { Search, ChevronRight, ChevronDown, Monitor, Moon, Sun } from 'lucide-react'
import Link from 'next/link'
import DefaultList from '@/core/components/nav/DefaultList'
import { useUserContext } from '@/core/providers/UserProvider'
import Avator from '@/core/components/avator/Avator'
import NotificationBell from '@/core/components/bell/bell'
import Right from '@/core/components/panel/Right'
import MymenuTemplate from '@widgets/forms/MymenuTemplate'
import { saveMyPreferenceAction } from '@/modules/user/actions/preference.action'
import type { UserPreferenceData, UserThemePreference } from '@/modules/user/actions/preference.query'
import { getAdminBreadcrumbRegistry, getAdminMenuRegistry } from '@/core/registry/adminRegistry'

const MENU_CONFIG = getAdminMenuRegistry()
const ADMIN_BREADCRUMB_LABELS = getAdminBreadcrumbRegistry()

const THEME_STORAGE_KEY = 'userThemePreference'

const writeThemeCookie = (theme: UserThemePreference) => {
  document.cookie = `${THEME_STORAGE_KEY}=${encodeURIComponent(theme)}; path=/; max-age=31536000; samesite=lax`
}

const defaultUserPreference: UserPreferenceData = {
  theme: 'system',
  notifyComments: true,
  notifyReplies: true,
  notifyAdmin: true,
  showProfileImage: true,
  showNickname: true,
  editorCompact: true,
  reduceMotion: false,
  fontScale: 'normal',
}

const themeOptions: Array<{
  value: UserThemePreference;
  label: string;
  icon: React.ReactNode;
}> = [
  { value: 'system', label: 'System', icon: <Monitor size={13} /> },
  { value: 'light', label: 'Light', icon: <Sun size={13} /> },
  { value: 'dark', label: 'Dark', icon: <Moon size={13} /> },
]

const resolveThemePreference = (value?: string | null): UserThemePreference => {
  if (value === 'light' || value === 'dark') return value
  return 'system'
}

const applyThemePreference = (theme: UserThemePreference) => {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const shouldUseDark = theme === 'dark' || (theme === 'system' && prefersDark)

  document.documentElement.classList.toggle('dark', shouldUseDark)
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = shouldUseDark ? 'dark' : 'light'
  localStorage.setItem(THEME_STORAGE_KEY, theme)
  writeThemeCookie(theme)
}

const getAdminBreadcrumbs = (pathname: string) => {
  const segments = pathname.split('/').filter(Boolean)
  const section = segments[1]

  if (!section) return ['ADMIN', 'OVERVIEW']

  const sectionLabel = section === 'user' ? 'USER' : section.toUpperCase()
  const lastSegment = segments[segments.length - 1]
  const candidate = !lastSegment || !Number.isNaN(Number(lastSegment)) ? 'index' : lastSegment
  const mapped = ADMIN_BREADCRUMB_LABELS[section]?.[candidate]

  if (mapped) return [sectionLabel, mapped]

  if (segments[2] && !Number.isNaN(Number(segments[2]))) {
    return [sectionLabel, 'UPDATE']
  }

  return [sectionLabel, (candidate || 'OVERVIEW').replace(/([a-z])([A-Z])/g, '$1 $2').toUpperCase()]
}

const cleanAdminPath = (path: string) => {
  if (!path || path === '/') return path
  return path.replace(/\/+$/, '')
}

const isAdminIndexHref = (href: string) => href === '/admin' || href === '/admin/settings'

const isAdminPathActive = (pathname: string, href: string) => {
  const cleanedPath = cleanAdminPath(pathname)
  const cleanedHref = cleanAdminPath(href)

  if (cleanedPath === cleanedHref) return true
  if (isAdminIndexHref(cleanedHref)) return false

  return cleanedPath.startsWith(`${cleanedHref}/`)
}

const AdminLayoutClient = ({
  children,
  appName,
  adminSessionGuard,
}: {
  children: React.ReactNode;
  appName: string;
  adminSessionGuard: boolean;
}) => {
  const pathname = usePathname()
  // 1️⃣ 공통 유틸: 경로 끝의 슬래시 제거
  const normalizedPathname = cleanAdminPath(pathname ?? '')
  const [isHovered, setIsHovered] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showRight, setShowRight] = useState(false)
  const [themePreference, setThemePreference] = useState<UserThemePreference>('system')
  const [, startThemeTransition] = useTransition()

  const { user, isLoading, refetch } = useUserContext()
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const isDashboardMain = normalizedPathname === '/admin'
  const breadcrumbs = useMemo(() => getAdminBreadcrumbs(normalizedPathname), [normalizedPathname])
  const appInitial = appName.trim().charAt(0).toUpperCase() || 'G'
  const closeRight = close => {
    setShowRight(close)
  }

  const dropdownRef = useRef<HTMLDivElement>(null) // 🌟 드롭다운 영역 감지용 Ref

  // 🌟 [핵심 로직] 영역 밖 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 클릭된 곳이 dropdownRef(버튼+메뉴) 안쪽이 아니라면 닫기
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false)
      }
    }

    // 마우스를 누를 때(mousedown) 감지 시작
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      // 컴포넌트가 사라질 때 이벤트 제거 (메모리 누수 방지)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const isLoggedIn = !!user

  const userNav = [
    { title: '내 정보', name: 'user', route: '/user' },
    { title: '개인 설정', name: 'preferences', route: '/user/preferences' },
    { title: '알림', name: 'notification', route: '#right' },
    { title: '로그아웃', name: 'Signout', route: '/' },
  ]

  const handleSignOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    window.location.href = '/'
  }

  const callbackName = (name: string) => {
    if (name === 'Signout') handleSignOut()
  }

  useEffect(() => {
    const savedTheme = resolveThemePreference(user?.preferences?.theme)
    setThemePreference(savedTheme)
  }, [user?.preferences?.theme])

  const handleThemePreferenceChange = (theme: UserThemePreference) => {
    setThemePreference(theme)
    applyThemePreference(theme)

    const nextPreference: UserPreferenceData = {
      ...defaultUserPreference,
      ...(user?.preferences || {}),
      theme,
    }
    const formData = new FormData()
    Object.entries(nextPreference).forEach(([key, value]) => {
      formData.set(key, String(value))
    })

    startThemeTransition(async () => {
      const result = await saveMyPreferenceAction(formData)
      if (result.success && result.data) {
        setThemePreference(result.data.theme)
        applyThemePreference(result.data.theme)
        void refetch()
      }
    })
  }

  useEffect(() => {
    if (isLoading) return

    if (!user) {
      window.location.replace(`/auth/signin?reason=expired&redirect=${encodeURIComponent(normalizedPathname || '/admin')}`)
      return
    }

    if (!user.isAdmin) {
      window.location.replace('/access')
    }
  }, [isLoading, normalizedPathname, user])

  useEffect(() => {
    if (!adminSessionGuard) return

    let isMounted = true

    const verifyAdminSession = async () => {
      try {
        const result = await refetch()
        const nextUser = result?.data

        if (!isMounted) return

        if (!nextUser) {
          window.location.replace(`/auth/signin?reason=expired&redirect=${encodeURIComponent(normalizedPathname || '/admin')}`)
          return
        }

        if (!nextUser.isAdmin) {
          window.location.replace('/access')
        }
      } catch {
        if (isMounted) {
          window.location.replace(`/auth/signin?reason=expired&redirect=${encodeURIComponent(normalizedPathname || '/admin')}`)
        }
      }
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) void verifyAdminSession()
    }

    window.addEventListener('focus', verifyAdminSession)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    const interval = window.setInterval(verifyAdminSession, 5 * 60 * 1000)

    return () => {
      isMounted = false
      window.removeEventListener('focus', verifyAdminSession)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.clearInterval(interval)
    }
  }, [adminSessionGuard, normalizedPathname, refetch])

  // 2️⃣ 모바일 체크 (실시간 해상도 감지) - 사이드바 대응용
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 3️⃣ 사이드바 확장 로직 (삭제하면 사이드바가 안 움직여요!)
  const closedPaths = ['/', '/admin']
  const isEntryPage = closedPaths.includes(normalizedPathname)
  const isExpanded = !isMobile && (isHovered || !isEntryPage)

  // 4️⃣ 본문 탭 메뉴 로직 (새로 추가된 것!)
  const activeSubMenus = useMemo(() => {
    const pathSegments = normalizedPathname.split('/')
    const baseCategoryPath = pathSegments.slice(0, 3).join('/') // "/admin/posts"

    if (baseCategoryPath === '/admin/posts' && pathSegments[3] && !isNaN(Number(pathSegments[3]))) {
      const postId = pathSegments[3]
      return [
        { label: '게시판 정보', href: `/admin/posts/${postId}/update` },
        { label: '카테고리', href: `/admin/posts/${postId}/categories` },
        { label: '확장필드', href: `/admin/posts/${postId}/extraField` },
      ]
    }

    const parent = MENU_CONFIG.find(menu => {
      // 대메뉴 자체 href와 일치하거나
      if (menu.href && cleanAdminPath(menu.href) === baseCategoryPath) return true

      // 서브 아이템 중 하나라도 대분류 경로와 일치하는게 있는지 확인
      return menu.items?.some(sub => cleanAdminPath(sub.href).startsWith(baseCategoryPath))
    })

    return parent?.items || null
  }, [normalizedPathname])

  return (
    <>
      <motion.div className="relative flex min-h-screen bg-[#FDFDFD] text-[#111] antialiased selection:bg-blue-100 selection:!text-black overflow-hidden font-sans dark:bg-dark-950 dark:text-dark-100 dark:selection:bg-cyan-500/30 dark:selection:!text-white">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[80%] bg-blue-50/50 rounded-full blur-[120px] pointer-events-none dark:bg-cyan-950/20" />
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[80%] bg-olive-200/50 rounded-full blur-[120px] pointer-events-none dark:bg-indigo-950/20" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-indigo-50/50 rounded-full blur-[100px] pointer-events-none dark:bg-blue-950/20" />

        {/* 1. SIDENAV */}
        <motion.aside initial={false} animate={{ width: isExpanded ? 240 : 72 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} className="fixed h-screen flex flex-col bg-white/20 backdrop-blur-3xl z-50 shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:bg-dark-950/55 dark:shadow-[4px_0_32px_rgba(0,0,0,0.35)]">
          <Link href="/" className="h-16 flex items-center justify-center shrink-0 cursor-pointer">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-lg text-white font-bold shrink-0 shadow-lg shadow-gray-950/25 cursor-pointer dark:bg-dark-100 dark:text-dark-950 dark:shadow-black/40">{appInitial}</div>
            <AnimatePresence>
              {isExpanded && (
                <motion.span initial={{ opacity: 0, x: 0 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 0 }} className="ml-3 text-[14px] font-bold tracking-tight truncate text-gray-800 whitespace-nowrap dark:text-dark-100">
                  {appName}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          <div className="flex-1 py-6 overflow-y-auto px-3 space-y-1 scrollbar-hide">
            {MENU_CONFIG.map(menu => (
              <SideAccordionItem key={menu.id} menu={menu} isExpanded={isExpanded} isMobile={isMobile} />
            ))}
            <div className="py-6 px-4">
              <div className="h-[1px] bg-black/5 dark:bg-dark-800" />
            </div>
          </div>

          <div className="p-5 mt-auto">
            <div className={`rounded-2xl transition-all ${isExpanded ? 'space-y-3 bg-black/[0.03] px-3 py-3 ring-1 ring-black/[0.03] dark:bg-dark-900 dark:ring-dark-800' : 'flex flex-col items-center gap-2'}`}>
              {isExpanded && (
                <motion.div initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -5 }} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-dark-500">Theme</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-300 dark:text-dark-600">{themePreference}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 rounded-xl bg-white/60 p-1 ring-1 ring-black/[0.04] dark:bg-dark-950 dark:ring-dark-800">
                    {themeOptions.map((item) => {
                      const active = themePreference === item.value

                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => handleThemePreferenceChange(item.value)}
                          className={`flex h-8 cursor-pointer items-center justify-center rounded-lg transition-colors ${
                            active
                              ? 'bg-gray-950 text-white shadow-sm dark:bg-dark-100 dark:text-dark-950'
                              : 'text-gray-400 hover:bg-black/[0.04] hover:text-gray-700 dark:text-dark-500 dark:hover:bg-white/[0.06] dark:hover:text-dark-200'
                          }`}
                          aria-label={`${item.label} theme`}
                          aria-pressed={active}
                        >
                          {item.icon}
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              )}

              {!isExpanded && (
                <button
                  type="button"
                  onClick={() => {
                    const currentIndex = themeOptions.findIndex((item) => item.value === themePreference)
                    const nextTheme = themeOptions[(currentIndex + 1) % themeOptions.length]?.value || 'system'
                    handleThemePreferenceChange(nextTheme)
                  }}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-black/[0.03] text-gray-400 ring-1 ring-black/[0.03] transition-colors hover:text-gray-800 dark:bg-dark-900 dark:text-dark-400 dark:ring-dark-800 dark:hover:text-dark-100"
                  aria-label="Change theme"
                >
                  {themeOptions.find((item) => item.value === themePreference)?.icon || <Monitor size={13} />}
                </button>
              )}

              <div className="flex items-center justify-center gap-3 md:justify-start">
                <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400 shadow-[0_0_8px_rgba(156,163,175,0.45)] dark:bg-dark-400" />

                {isExpanded && (
                  <motion.div initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -5 }} className="flex flex-col items-start leading-none">
                    <span className="mb-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-dark-500">System Version</span>
                    <span className="font-mono text-[11px] font-bold tracking-tighter text-gray-600 dark:text-dark-300">v{pkg.version}</span>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.aside>

        {/* 2. RIGHT WRAPPER */}
        <motion.div
          initial={false}
          animate={{
            marginLeft: isMobile ? 72 : isExpanded ? 240 : 72,
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
          }}
          className="flex-1 flex min-h-screen flex-col min-w-0 overflow-hidden"
        >
          <motion.header
            initial={false}
            animate={{
              left: isMobile ? 72 : isExpanded ? 240 : 72,
              width: isMobile ? 'calc(100vw - 72px)' : isExpanded ? 'calc(100vw - 240px)' : 'calc(100vw - 72px)',
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
            className="fixed h-16 flex items-center justify-end md:justify-between px-3 md:px-8 bg-white/40 backdrop-blur-2xl shrink-0 z-40 dark:bg-dark-950/45"
          >
            {/* Left: Breadcrumbs */}
            <div className="hidden md:flex items-center gap-2 text-[12px] font-medium text-gray-400 dark:text-dark-500">
              {breadcrumbs.map((item, index) => (
                <React.Fragment key={`${item}-${index}`}>
                  {index > 0 && <ChevronRight size={14} className="text-gray-200 dark:text-dark-700" />}
                  <span className={`${index === breadcrumbs.length - 1 ? 'text-black dark:text-dark-100' : 'text-gray-400 dark:text-dark-500'} font-bold uppercase tracking-widest text-[10px]`}>
                    {item}
                  </span>
                </React.Fragment>
              ))}
            </div>

            <div className="flex items-center gap-0 md:gap-3">
              {/* Search */}
              <div className="relative group hidden lg:block">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-dark-500" size={14} />
                <input type="text" placeholder="Quick search..." className="bg-black/5 rounded-full py-1.5 pl-9 pr-4 text-[12px] w-48 focus:w-64 focus:bg-white transition-all outline-none dark:bg-dark-900 dark:text-dark-100 dark:placeholder:text-dark-500 dark:focus:bg-dark-800" />
              </div>

              <button
                className="cursor-pointer"
                // onClick={() => setShowModal(!showModal)}
                onClick={() => setShowRight(true)}
              >
                <NotificationBell />
              </button>

              <div className="h-4 w-[1px] bg-gray-200/60 mx-1 dark:bg-dark-800" />

              {/* 🌟 런타임 데이터가 반영된 유저 드롭다운 버튼 */}
              <div className="relative" ref={dropdownRef}>
                {isLoading ? (
                  <div className="w-28 h-9 bg-black/[0.03] animate-pulse rounded-full dark:bg-dark-900" />
                ) : (
                  <button onClick={() => setShowUserDropdown(!showUserDropdown)} className={`flex items-center gap-3 py-1.5  transition-all border border-transparent group cursor-pointer ${showUserDropdown ? '' : ''}`}>
                    {/* 상태 도트 */}
                    <div className="relative flex items-center justify-center">
                      <Avator
                        username={user?.nickName}
                        isLoggedIn={!!user}
                        tokenExpiryTime={user?.expiry || Date.now() + 3600000}
                        profileImage={user?.profileImage || user?.profile?.profileImage}
                      />
                    </div>

                    <ChevronDown size={14} className={`text-gray-400 transition-transform dark:text-dark-500 ${showUserDropdown ? 'rotate-180' : ''}`} />
                  </button>
                )}

                {/* 2. 드롭다운 메뉴 */}
                <AnimatePresence>
                  {showUserDropdown && (
                    <motion.div initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }} transition={{ duration: 0.15 }} style={{ transform: 'translateZ(0)' }} className="absolute right-0 top-[calc(100%+8px)] w-60 z-[100]">
                      <div className="overflow-hidden bg-white/70 backdrop-blur-2xl border border-white/60 rounded-[20px] shadow-xl p-2 dark:border-dark-800 dark:bg-dark-900/90 dark:shadow-black/30">
                        <div className="px-3.5 py-3 border-b border-black/[0.04] mb-1.5 dark:border-dark-800">
                          <p className="text-[10px] text-gray-400 font-mono uppercase tracking-tighter mb-0.5 dark:text-dark-500">Signed in as</p>
                          <p className="text-[13px] font-bold text-gray-900 truncate dark:text-dark-100">{user?.email}</p>
                        </div>

                        <div className="space-y-0.5">
                          <DefaultList list={userNav} loggedInfo={user} callback={callbackName} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.header>

          <div className="relative mt-[64px] flex min-h-[calc(100vh-64px)] flex-1 overflow-hidden overflow-x-auto px-2 pb-2 scrollbar-hide md:px-4 md:pb-4 md:pt-4">
            <main
              className={`min-h-full w-full flex flex-col overflow-hidden ${
                isDashboardMain
                  ? 'bg-transparent border-none shadow-none' // 대시보드일 때 스타일
                  : 'bg-white/80 backdrop-blur-lg rounded-xl md:rounded-xl shadow-xl shadow-gray-100 dark:bg-dark-950/72 dark:shadow-black/25 dark:ring-1 dark:ring-dark-800' // 일반 페이지 스타일
              }`}
            >
              {/* 🌟 탭 내비게이션: 서브 메뉴가 있을 때만 출력 */}
              <AnimatePresence mode="wait">
                {activeSubMenus && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="shrink-0 border-b border-gray-100 bg-white/50 backdrop-blur-sm px-6 md:px-10 dark:border-dark-800 dark:bg-dark-950/55">
                    <div className="flex items-center gap-6 md:gap-8 overflow-x-auto scrollbar-hide">
                      {activeSubMenus.map(sub => {
                        const isSubActive = isAdminPathActive(normalizedPathname, sub.href)

                        return (
                          <Link key={sub.href} href={sub.href} className="relative py-4 shrink-0">
                            <span className={`text-[13px] font-bold transition-colors ${isSubActive ? 'text-blue-600 dark:text-cyan-400' : 'text-gray-400 hover:text-gray-900 dark:text-dark-500 dark:hover:text-dark-100'}`}>{sub.label}</span>
                            {isSubActive && (
                              <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-blue-600 rounded-full dark:bg-cyan-400"
                                transition={{
                                  type: 'spring',
                                  bounce: 0.2,
                                  duration: 0.6,
                                }}
                              />
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 실제 컨텐츠 스크롤 영역 */}
              <div className="flex-1">
                <div>{children}</div>
              </div>
            </main>
          </div>
        </motion.div>
      </motion.div>
      <Right state={showRight} close={closeRight}>
        <MymenuTemplate />
      </Right>
    </>
  )
}

// --- 서브 컴포넌트들 ---

// ... (상단 MENU_CONFIG 및 imports는 동일)
const SideAccordionItem = ({ menu, isExpanded, isMobile }: any) => {
  const pathname = usePathname()
  const router = useRouter()
  const normalizedPathname = cleanAdminPath(pathname ?? '')

  // 🌟 1. 활성화 판별 로직 고도화
  const isActive = useMemo(() => {
    // [Case A] 서브 메뉴가 있는 아코디언 메뉴 (Posts, Settings 등)
    if (menu.items) {
      return menu.items.some((sub: any) => {
        return isAdminPathActive(normalizedPathname, sub.href)
      })
    }

    // [Case B] 단일 메뉴 (Dashboard 등)
    if (menu.href) {
      return isAdminPathActive(normalizedPathname, menu.href)
    }

    return false
  }, [normalizedPathname, menu])

  // 🌟 2. 하위 메뉴 중 정확히 어디에 불을 켤지 결정 (isChildActive)
  const isChildActive = (subHref: string) => {
    return isAdminPathActive(normalizedPathname, subHref)
  }

  const [isOpen, setIsOpen] = useState(isActive)

  // 페이지 이동 시 활성화 상태라면 아코디언 자동으로 열기
  useEffect(() => {
    if (isActive) setIsOpen(true)
  }, [isActive])

  const handleMenuClick = () => {
    if (isMobile && menu.items) {
      router.push(menu.items[0].href)
    } else {
      setIsOpen(!isOpen)
    }
  }

  if (!menu.items) {
    return <SideItem href={menu.href} icon={menu.icon} label={menu.label} isExpanded={isExpanded} active={isActive} />
  }

  return (
    <div className="flex flex-col gap-0.5">
      <button onClick={handleMenuClick} className={`group flex items-center w-full rounded-xl transition-all h-10 px-3 cursor-pointer ${isActive ? 'bg-white/80 text-black shadow-sm border border-white/60 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-100' : 'text-gray-400 hover:text-black hover:bg-white/40 border border-transparent dark:text-dark-500 dark:hover:bg-dark-900 dark:hover:text-dark-100'}`}>
        <span className={`${isActive ? 'text-blue-600 dark:text-cyan-400' : 'text-gray-400 group-hover:text-black dark:text-dark-500 dark:group-hover:text-dark-100'} shrink-0 transition-colors`}>{menu.icon}</span>
        <AnimatePresence>
          {isExpanded && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-1 items-center justify-between ml-3 overflow-hidden">
              <span className={`text-[13px] font-semibold tracking-tight truncate ${isActive ? 'text-black dark:text-dark-100' : ''}`}>{menu.label}</span>
              <motion.span animate={{ rotate: isOpen ? 180 : 0 }}>
                <ChevronDown size={14} className={isActive ? 'text-black dark:text-dark-100' : 'text-gray-300 dark:text-dark-600'} />
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* 아코디언 내용 */}
      <AnimatePresence initial={false}>
        {isOpen && isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden ml-9 flex flex-col border-l border-black/5 dark:border-dark-800">
            {menu.items.map((sub: any) => {
              const active = isChildActive(sub.href) // 고도화된 체크 함수 사용
              return (
                <Link key={sub.href} href={sub.href}>
                  <div className={`px-4 py-2 text-xs font-medium transition-colors hover:text-black rounded-lg cursor-pointer dark:hover:text-dark-100 ${active ? 'text-blue-600 dark:text-cyan-400' : 'text-gray-500 dark:text-dark-500'}`}>{sub.label}</div>
                </Link>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const SideItem = ({ href, icon, label, isExpanded, active }: any) => {
  const pathname = usePathname()
  const isActive = active !== undefined ? active : (pathname ?? '').replace(/\/$/, '') === href.replace(/\/$/, '')

  return (
    <Link href={href}>
      <button className={`group flex items-center w-full rounded-xl transition-all h-10 px-3 mt-0.5 cursor-pointer ${isActive ? 'bg-white/80 text-black shadow-sm border border-white/60 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-100' : 'text-gray-400 hover:text-black hover:bg-white/40 border border-transparent dark:text-dark-500 dark:hover:bg-dark-900 dark:hover:text-dark-100'}`}>
        <span className={`${isActive ? 'text-blue-600 dark:text-cyan-400' : 'text-gray-400 group-hover:text-black dark:text-dark-500 dark:group-hover:text-dark-100'} shrink-0 transition-colors`}>{icon}</span>
        {isExpanded && <span className="ml-3 text-[13px] font-semibold tracking-tight">{label}</span>}
      </button>
    </Link>
  )
}

export default AdminLayoutClient
