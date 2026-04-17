"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation"; // ✅ useRouter 추가
import { motion, AnimatePresence } from "framer-motion";
import pkg from "../../../../package.json";
import {
  LayoutGrid, Settings, MessageSquareText, Users,
  Search, Bell, ChevronRight, Globe, ChevronDown,
  LogOut, UserCircle, Zap
} from "lucide-react";
import Link from "next/link";
import Dropdown from "@/core/components/dropdown/Dropdown";
import DefaultList from "@/core/components/nav/DefaultList";
import { useUserContext } from "@/core/providers/UserProvider";
import Avator from "@/core/components/avator/Avator";
import NotificationBell from "@/core/components/bell/bell";
import Right from "@/core/components/panel/Right";
import MymenuTemplate from "@widgets/forms/MymenuTemplate";

const MENU_CONFIG = [
  { id: "dashboard", href: "/admin", icon: <LayoutGrid size={18} />, label: "Dashboard" },
  {
    id: "users",
    icon: <Users size={18} />,
    label: "회원 설정",
    items: [
      { label: "회원 목록", href: "/admin/user/list" },
      { label: "회원 추가", href: "/admin/user/create" },
      { label: "회원 그룹 관리", href: "/admin/user/groupList" },
    ]
  },
  {
    id: "posts",
    icon: <MessageSquareText size={18} />,
    label: "게시판 설정",
    items: [
      { label: "게시판 목록", href: "/admin/posts/list" },
      { label: "게시판 생성", href: "/admin/posts/create" },
      { label: "카테고리 관리", href: "/admin/posts/category" },
    ]
  },
  { id: "infra", href: "/infra", icon: <Globe size={18} />, label: "Infrastructure" },
];

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  // 1️⃣ 공통 유틸: 경로 끝의 슬래시 제거
  const cleanPath = (p: string) => p.replace(/\/$/, "");
  const normalizedPathname = cleanPath(pathname);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const { user, isLoading } = useUserContext();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const isDashboardMain = normalizedPathname === "/admin";
  const closeRight = (close) => {
    setShowRight(close);
  };

  const dropdownRef = useRef<HTMLDivElement>(null); // 🌟 드롭다운 영역 감지용 Ref

  // 🌟 [핵심 로직] 영역 밖 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 클릭된 곳이 dropdownRef(버튼+메뉴) 안쪽이 아니라면 닫기
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };

    // 마우스를 누를 때(mousedown) 감지 시작
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // 컴포넌트가 사라질 때 이벤트 제거 (메모리 누수 방지)
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const isLoggedIn = !!user;

  const userNav = [
    { title: "내 정보", name: "user", route: "/user" },
    { title: "알림", name: "notification", route: "#right" },
    { title: "로그아웃", name: "Signout", route: "/" },
  ];

  const handleSignOut = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.href = "/";
  };

  const callbackName = (name: string) => {
    if (name === "Signout") handleSignOut();
  };

  // 2️⃣ 모바일 체크 (실시간 해상도 감지) - 사이드바 대응용
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 3️⃣ 사이드바 확장 로직 (삭제하면 사이드바가 안 움직여요!)
  const closedPaths = ["/", "/admin"];
  const isEntryPage = closedPaths.includes(normalizedPathname);
  const isExpanded = !isMobile && (isHovered || !isEntryPage);

  // 4️⃣ 본문 탭 메뉴 로직 (새로 추가된 것!)
  const activeSubMenus = useMemo(() => {
    const pathSegments = normalizedPathname.split('/');
    const baseCategoryPath = pathSegments.slice(0, 3).join('/'); // "/admin/posts"

    const parent = MENU_CONFIG.find(menu => {
      // 대메뉴 자체 href와 일치하거나
      if (menu.href && cleanPath(menu.href) === baseCategoryPath) return true;

      // 서브 아이템 중 하나라도 대분류 경로와 일치하는게 있는지 확인
      return menu.items?.some(sub => cleanPath(sub.href).startsWith(baseCategoryPath));
    });

    return parent?.items || null;
  }, [normalizedPathname]);

  return (
    <>
      <div className="flex h-screen bg-[#FDFDFD] text-[#111] antialiased selection:bg-blue-100 selection:!text-black overflow-hidden font-sans relative">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[80%] bg-blue-50/50 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[80%] bg-olive-200/50 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-indigo-50/50 rounded-full blur-[100px] pointer-events-none" />

        {/* 1. SIDENAV */}
        <motion.aside
          initial={false}
          animate={{ width: isExpanded ? 240 : 72 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="flex flex-col bg-white/20 backdrop-blur-3xl z-50 shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]"
        >
          <div className="h-16 flex items-center justify-center shrink-0">
            <div className="w-10 h-10 bg-black rounded-xl shadow-gray-400 flex items-center justify-center text-lg text-white font-bold shrink-0 shadow-lg shadow-gray-950/25 cursor-pointer">G</div>
            <AnimatePresence>
              {isExpanded && (
                <motion.span initial={{ opacity: 0, x: 0 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 0 }}
                             className="ml-3 text-[14px] font-bold tracking-tight truncate text-gray-800 whitespace-nowrap"
                >
                  Gjworks
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <div className="flex-1 py-6 overflow-y-auto px-3 space-y-1 scrollbar-hide">
            {MENU_CONFIG.map((menu) => (
              <SideAccordionItem key={menu.id} menu={menu} isExpanded={isExpanded} isMobile={isMobile} />
            ))}
            <div className="py-6 px-4">
              <div className="h-[1px] bg-black/5" />
            </div>
            <SideItem href="/settings" icon={<Settings size={18} />} label="Settings" isExpanded={isExpanded} />
          </div>

          <div className="p-5 mt-auto"> {/* mt-auto를 주면 사이드바 최하단에 고정됩니다 */}
            <div className={`flex items-center justify-center md:justify-start gap-3 px-3 py-2 rounded-2xl transition-all ${isExpanded ? 'bg-black/[0.03] border border-black/[0.03]' : ''}`}>
              {/* 버전에 어울리는 파란색 도트로 변경해봤어요 */}
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] shrink-0" />

              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -5 }}
                  className="flex flex-col items-start leading-none"
                >
        <span className="text-[9px] font-bold text-gray-400 font-mono tracking-widest uppercase mb-0.5">
          System Version
        </span>
                  <span className="text-[11px] font-bold text-gray-600 font-mono tracking-tighter">
          v{pkg.version}
        </span>
                </motion.div>
              )}
            </div>
          </div>
        </motion.aside>

        {/* 2. RIGHT WRAPPER */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-16 flex items-center justify-end md:justify-between px-3 md:px-8 bg-white/40 backdrop-blur-2xl shrink-0 z-40 relative">

            {/* Left: Breadcrumbs */}
            <div className="hidden md:flex items-center gap-2 text-[12px] font-medium text-gray-400">
              <span className="uppercase tracking-widest text-[10px]">gjworks</span>
              <ChevronRight size={14} className="text-gray-200" />
              <span className="text-black font-bold uppercase tracking-widest text-[10px]">
              {pathname === "/admin" ? "Overview" : pathname.split('/').pop()}
            </span>
            </div>

            <div className="flex items-center gap-0 md:gap-3">
              {/* Search */}
              <div className="relative group hidden lg:block">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input type="text" placeholder="Quick search..." className="bg-black/5 rounded-full py-1.5 pl-9 pr-4 text-[12px] w-48 focus:w-64 focus:bg-white transition-all outline-none" />
              </div>

              <button
                className="cursor-pointer"
                // onClick={() => setShowModal(!showModal)}
                onClick={() => setShowRight(true)}
              >
                <NotificationBell />

              </button>

              <div className="h-4 w-[1px] bg-gray-200/60 mx-1" />

              {/* 🌟 런타임 데이터가 반영된 유저 드롭다운 버튼 */}
              <div className="relative" ref={dropdownRef}>
                {isLoading ? (
                  <div className="w-28 h-9 bg-black/[0.03] animate-pulse rounded-full" />
                ) : (
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className={`flex items-center gap-3 py-1.5  transition-all border border-transparent group cursor-pointer ${
                      showUserDropdown ? '' : ''
                    }`}
                  >
                    {/* 상태 도트 */}
                    <div className="relative flex items-center justify-center">
                      <Avator username={user?.nickName} isLoggedIn={!!user} tokenExpiryTime={user?.expiry || (Date.now() + 3600000)} />
                    </div>


                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
                  </button>
                )}

                {/* 2. 드롭다운 메뉴 */}
                <AnimatePresence>
                  {showUserDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      style={{ transform: "translateZ(0)" }}
                      className="absolute right-0 top-[calc(100%+8px)] w-60 z-[100]"
                    >
                      <div className="overflow-hidden bg-white/70 backdrop-blur-2xl border border-white/60 rounded-[20px] shadow-xl p-2">
                        <div className="px-3.5 py-3 border-b border-black/[0.04] mb-1.5">
                          <p className="text-[10px] text-gray-400 font-mono uppercase tracking-tighter mb-0.5">Signed in as</p>
                          <p className="text-[13px] font-bold text-gray-900 truncate">{user?.email}</p>
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
          </header>

          <div className="flex-1 px-2 md:px-4 pb-2 md:pb-4 pt-2 md:pt-4 overflow-hidden relative">
            <main className={`h-full w-full flex flex-col overflow-hidden ${
              isDashboardMain
                ? "bg-transparent border-none shadow-none" // 대시보드일 때 스타일
                : "bg-white/80 backdrop-blur-lg rounded-xl md:rounded-xl shadow-xl shadow-gray-100" // 일반 페이지 스타일
            }`}>

              {/* 🌟 탭 내비게이션: 서브 메뉴가 있을 때만 출력 */}
              <AnimatePresence mode="wait">
                {activeSubMenus && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="shrink-0 border-b border-gray-100 bg-white/50 backdrop-blur-sm px-6 md:px-10"
                  >
                    <div className="flex items-center gap-6 md:gap-8 overflow-x-auto scrollbar-hide">
                      {activeSubMenus.map((sub) => {
                        const subHref = cleanPath(sub.href);
                        const isSubActive = normalizedPathname.includes(subHref.split('/').pop() || "");

                        return (
                          <Link key={sub.href} href={sub.href} className="relative py-4 shrink-0">
                        <span className={`text-[13px] font-bold transition-colors ${
                          isSubActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-900'
                        }`}>
                      {sub.label}
                    </span>
                            {isSubActive && (
                              <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-blue-600 rounded-full"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                              />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 실제 컨텐츠 스크롤 영역 */}
              <div className="flex-1 overflow-y-auto scrollbar-hide px-2 py-3">
                <div>
                  {children}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
      <Right state={showRight} close={closeRight}>
        <MymenuTemplate />
      </Right>
    </>
  );
};

// --- 서브 컴포넌트들 ---

// ... (상단 MENU_CONFIG 및 imports는 동일)
const SideAccordionItem = ({ menu, isExpanded, isMobile }: any) => {
  const pathname = usePathname();
  const router = useRouter();
  const cleanPath = (p: string) => p.replace(/\/$/, "");
  const normalizedPathname = cleanPath(pathname);

  // 🌟 1. 활성화 판별 로직 고도화
  const isActive = useMemo(() => {
    const pathSegments = normalizedPathname.split("/");
    const currentBase = pathSegments.slice(0, 3).join("/"); // "/admin/posts" 등

    // [Case A] 서브 메뉴가 있는 아코디언 메뉴 (Posts, Settings 등)
    if (menu.items) {
      return menu.items.some((sub: any) => {
        const subHref = cleanPath(sub.href);
        const subBase = subHref.split("/").slice(0, 3).join("/");

        // 현재 주소가 서브 메뉴로 시작하거나, 대분류(Prefix)가 같으면 활성화
        return normalizedPathname.startsWith(subHref) || subBase === currentBase;
      });
    }

    // [Case B] 단일 메뉴 (Dashboard 등)
    if (menu.href) {
      const targetHref = cleanPath(menu.href);

      // 🌟 핵심: 대시보드(/admin)는 '정확히' 일치할 때만 활성화
      // 그 외의 단일 메뉴는 'startsWith'로 처리
      if (targetHref === "/admin") {
        return normalizedPathname === "/admin";
      }

      return normalizedPathname.startsWith(targetHref);
    }

    return false;
  }, [normalizedPathname, menu]);

  // 🌟 2. 하위 메뉴 중 정확히 어디에 불을 켤지 결정 (isChildActive)
  const isChildActive = (subHref: string) => {
    const cleanedSub = cleanPath(subHref);

    // 🌟 1. 정확히 일치하면 당연히 True
    if (normalizedPathname === cleanedSub) return true;

    // 🌟 2. 동적 경로(/2/categories 등) 대응 로직
    const subSegments = cleanedSub.split("/"); // ["", "admin", "user", "list"]
    const pathSegments = normalizedPathname.split("/"); // ["", "admin", "posts", "list"]

    // 핵심: 대분류 카테고리(index 2번: user vs posts)가 다르면 무조건 탈락!
    const isSameCategory = subSegments[2] === pathSegments[2];

    // 소분류 키워드(list, category 등) 포함 여부 확인
    const subKeyword = [...subSegments].pop(); // 원본 훼손 방지를 위해 복사 후 pop
    const hasKeyword = normalizedPathname.includes(subKeyword || "");

    return isSameCategory && hasKeyword;
  };

  const [isOpen, setIsOpen] = useState(isActive);

  // 페이지 이동 시 활성화 상태라면 아코디언 자동으로 열기
  useEffect(() => {
    if (isActive) setIsOpen(true);
  }, [isActive]);

  const handleMenuClick = () => {
    if (isMobile && menu.items) {
      router.push(menu.items[0].href);
    } else {
      setIsOpen(!isOpen);
    }
  };

  if (!menu.items) {
    return <SideItem href={menu.href} icon={menu.icon} label={menu.label} isExpanded={isExpanded} active={isActive} />;
  }

  return (
    <div className="flex flex-col gap-0.5">
      <button
        onClick={handleMenuClick}
        className={`group flex items-center w-full rounded-xl transition-all h-10 px-3 cursor-pointer ${
          isActive
            ? 'bg-white/80 text-black shadow-sm border border-white/60'
            : 'text-gray-400 hover:text-black hover:bg-white/40 border border-transparent'
        }`}
      >
        <span className={`${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-black'} shrink-0 transition-colors`}>
          {menu.icon}
        </span>
        <AnimatePresence>
          {isExpanded && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-1 items-center justify-between ml-3 overflow-hidden">
              <span className={`text-[13px] font-semibold tracking-tight truncate ${isActive ? 'text-black' : ''}`}>
                {menu.label}
              </span>
              <motion.span animate={{ rotate: isOpen ? 180 : 0 }}>
                <ChevronDown size={14} className={isActive ? 'text-black' : 'text-gray-300'} />
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* 아코디언 내용 */}
      <AnimatePresence initial={false}>
        {isOpen && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden ml-9 flex flex-col border-l border-black/5"
          >
            {menu.items.map((sub: any) => {
              const active = isChildActive(sub.href); // 고도화된 체크 함수 사용
              return (
                <Link key={sub.href} href={sub.href}>
                  <div className={`px-4 py-2 text-xs font-medium transition-colors hover:text-black rounded-lg cursor-pointer ${
                    active ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {sub.label}
                  </div>
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SideItem = ({ href, icon, label, isExpanded, active }: any) => {
  const pathname = usePathname();
  const isActive = active !== undefined ? active : pathname.replace(/\/$/, "") === href.replace(/\/$/, "");

  return (
    <Link href={href}>
      <button className={`group flex items-center w-full rounded-xl transition-all h-10 px-3 mt-0.5 cursor-pointer ${
        isActive ? 'bg-white/80 text-black shadow-sm border border-white/60' : 'text-gray-400 hover:text-black hover:bg-white/40 border border-transparent'
      }`}>
        <span className={`${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-black'} shrink-0 transition-colors`}>{icon}</span>
        {isExpanded && <span className="ml-3 text-[13px] font-semibold tracking-tight">{label}</span>}
      </button>
    </Link>
  );
};

export default AdminLayout;