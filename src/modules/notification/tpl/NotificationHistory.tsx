"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  BellOff,
  Calendar,
  CheckCheck,
  ChevronDown,
  Loader2,
  Search,
  Trash2,
  X,
  Zap,
} from "lucide-react";

import { hasClientSession } from "@/core/utils/auth/clientAuth";
import { formatKstTime, getKstDayGroup } from "@/core/utils/date/kst";

const LIMIT = 10;
const filterOptions = [
  { value: "all", label: "전체" },
  { value: "info", label: "안내" },
  { value: "success", label: "성공" },
  { value: "warning", label: "주의" },
  { value: "error", label: "오류" },
];

const StatusIcon = ({ type }: { type: string }) => {
  const iconSize = 18;

  if (type === "success") return <Zap size={iconSize} className="fill-primary-500/20 text-primary-500" />;
  if (type === "error") return <Zap size={iconSize} className="fill-red-500/20 text-red-500" />;
  if (type === "warning") return <Zap size={iconSize} className="fill-amber-500/20 text-amber-500" />;

  return <Bell size={iconSize} className="text-gray-400" />;
};

const NotificationPage = ({ showHeader = true, variant = "default" }: { showHeader?: boolean; variant?: "default" | "account" }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [fetchingMore, setFetchingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));

    try {
      if (!(await hasClientSession())) return;

      const res = await fetch("/api/notifications/read-all", { method: "POST" });
      if (!res.ok) throw new Error("전체 읽음 처리 실패");

      window.dispatchEvent(new Event("refresh-unread"));
    } catch (error) {
      console.error("전체 읽음 처리 실패:", error);
    }
  };

  const fetchHistory = async (targetPage: number) => {
    try {
      targetPage === 1 ? setLoading(true) : setFetchingMore(true);

      const hasSession = await hasClientSession();
      if (!hasSession) {
        setNotifications([]);
        setHasMore(false);
        return;
      }

      const res = await fetch(`/api/notifications/history?page=${targetPage}&limit=${LIMIT}`);
      if (!res.ok) throw new Error("데이터 로드 실패");

      const newData = await res.json();

      if (Array.isArray(newData)) {
        if (newData.length < LIMIT) setHasMore(false);

        setNotifications((prev) => targetPage === 1 ? newData : [...prev, ...newData]);

        if (newData.length > 0) {
          await markAllAsRead();
        }
      }
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally {
      setLoading(false);
      setFetchingMore(false);
    }
  };

  useEffect(() => {
    fetchHistory(1);
  }, []);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchHistory(nextPage);
  };

  const handleDelete = async (uuid: string) => {
    if (!(await hasClientSession())) return;

    setNotifications((prev) => prev.filter((notification) => notification.uuid !== uuid));
    const res = await fetch(`/api/notifications/${uuid}`, { method: "DELETE" });
    if (!res.ok) throw new Error("삭제 실패");

    window.dispatchEvent(new Event("refresh-unread"));
  };

  const handleDeleteAll = async () => {
    if (!confirm("모든 알림 기록을 영구적으로 삭제하시겠습니까?")) return;
    if (!(await hasClientSession())) return;

    setNotifications([]);
    const res = await fetch("/api/notifications/delete-all", { method: "POST" });
    if (!res.ok) throw new Error("전체 삭제 실패");

    window.dispatchEvent(new Event("refresh-unread"));
  };

  const handleRead = async (uuid: string) => {
    if (!(await hasClientSession())) return;

    setNotifications((prev) => prev.map((notification) => (
      notification.uuid === uuid ? { ...notification, isRead: true } : notification
    )));
    const res = await fetch(`/api/notifications/${uuid}/read`, { method: "PATCH" });
    if (!res.ok) throw new Error("읽음 처리 실패");

    window.dispatchEvent(new Event("refresh-unread"));
  };

  const dateGroupedNotifications = useMemo(() => {
    const groups: Record<string, any[]> = { "오늘": [], "어제": [], "이전 알림": [] };
    const query = searchQuery.trim().toLowerCase();

    notifications
      .filter((notification) => {
        if (!query) return true;
        return `${notification.title || ""} ${notification.content || ""}`.toLowerCase().includes(query);
      })
      .filter((notification) => filterType === "all" || notification.type === filterType)
      .forEach((notification) => {
        const group = getKstDayGroup(notification.createdAt);
        if (group === "오늘") groups["오늘"].push(notification);
        else if (group === "어제") groups["어제"].push(notification);
        else groups["이전 알림"].push(notification);
      });

    return groups;
  }, [notifications, searchQuery, filterType]);

  const visibleCount = Object.values(dateGroupedNotifications).flat().length;

  const accountVariant = variant === "account";

  return (
    <div className={accountVariant ? "py-6 md:py-8" : "mx-auto max-w-6xl"}>
      <div className={`${showHeader ? "mb-6" : accountVariant ? "mb-4" : "mb-4 mt-6"} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
        {showHeader && (
          <div>
            <h1 className="text-2xl font-semibold tracking-normal text-gray-950 dark:text-dark-100">알림센터</h1>
            <p className="mt-1 text-sm font-medium text-gray-500 dark:text-dark-400">서비스와 계정에서 발생한 알림을 확인합니다.</p>
          </div>
        )}

        {!showHeader && accountVariant && (
          <div>
            <h2 className="text-base font-semibold text-gray-950 dark:text-dark-100">알림 리스트</h2>
            <p className="mt-1 text-xs font-medium text-gray-400 dark:text-dark-400">{visibleCount}개 알림이 표시됩니다.</p>
          </div>
        )}

        {notifications.length > 0 && (
          <button
            type="button"
            onClick={handleDeleteAll}
            className="inline-flex h-10 w-fit items-center gap-2 rounded-md border border-red-100 bg-white px-4 text-xs font-semibold text-red-500 transition-colors hover:bg-red-50 dark:border-red-500/20 dark:bg-dark-900 dark:hover:bg-red-500/10"
          >
            <Trash2 size={15} />
            전체 삭제
          </button>
        )}
      </div>

      <section className="rounded-lg border border-gray-200 bg-white shadow-sm shadow-gray-200/70 dark:border-dark-700 dark:bg-dark-900 dark:shadow-black/20">
        <div className="flex flex-col gap-3 border-b border-gray-200 p-4 dark:border-dark-700 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative min-w-0 flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="알림 제목이나 내용을 검색"
              className="h-10 w-full rounded-md border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm font-medium text-gray-900 outline-none transition-colors placeholder:text-gray-300 focus:border-gray-300 focus:bg-white dark:border-dark-700 dark:bg-dark-950 dark:text-dark-100 dark:placeholder:text-dark-600 dark:focus:border-dark-700 dark:focus:bg-dark-900"
            />
          </div>

          <div className="flex flex-wrap gap-1 rounded-md bg-gray-50 p-1 dark:bg-dark-950">
            {filterOptions.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilterType(item.value)}
                className={`relative h-8 rounded-md px-3 text-xs font-semibold transition-colors ${
                  filterType === item.value
                    ? "text-gray-950 dark:text-dark-100"
                    : "text-gray-400 hover:text-gray-700 dark:hover:text-dark-200"
                }`}
              >
                {filterType === item.value && (
                  <motion.span
                    layoutId="notification-filter-active"
                    className="absolute inset-0 rounded-md bg-white shadow-sm dark:bg-dark-800"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  />
                )}
                <span className="relative">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          {loading && page === 1 ? (
            <div className="flex min-h-72 items-center justify-center">
              <div className="inline-flex items-center gap-2 rounded-md bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-400 dark:bg-dark-800">
                <Loader2 size={14} className="animate-spin" />
                알림을 불러오는 중
              </div>
            </div>
          ) : visibleCount > 0 ? (
            <div className="space-y-8">
              {Object.entries(dateGroupedNotifications).map(([dateLabel, items]) => (
                items.length > 0 && (
                  <section key={dateLabel}>
                    <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-gray-400 dark:text-dark-500">
                      <Calendar size={14} />
                      {dateLabel}
                    </div>

                    <div className="grid gap-2">
                      {items.map((notification) => (
                        <motion.div
                          key={notification.uuid}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.18, ease: "easeOut" }}
                          className="group relative flex items-center gap-3 overflow-hidden rounded-lg border border-gray-200 bg-white p-3 shadow-sm shadow-gray-200/70 transition-colors hover:bg-gray-50 dark:border-dark-700 dark:bg-dark-950 dark:shadow-black/20 dark:hover:bg-dark-800/60"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-50 dark:bg-dark-900">
                            {notification.imageUrl ? (
                              <img src={notification.imageUrl} className="h-full w-full object-cover" alt="" />
                            ) : (
                              <StatusIcon type={notification.type} />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 text-sm font-semibold text-gray-950 dark:text-dark-100">
                                {!notification.isRead && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-primary-500" />}
                                <span className="line-clamp-1">{notification.title}</span>
                              </div>
                              <span className="shrink-0 text-[11px] font-semibold text-gray-300 dark:text-dark-600">
                                {formatKstTime(notification.createdAt)}
                              </span>
                            </div>
                            <p className="mt-1 line-clamp-1 text-xs font-medium text-gray-500 dark:text-dark-400">{notification.content}</p>
                          </div>

                          <div className="flex shrink-0 gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                            {!notification.isRead && (
                              <button
                                type="button"
                                onClick={() => handleRead(notification.uuid)}
                                className="flex h-8 w-8 items-center justify-center rounded-md text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10"
                                aria-label="읽음 처리"
                              >
                                <CheckCheck size={16} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDelete(notification.uuid)}
                              className="flex h-8 w-8 items-center justify-center rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                              aria-label="삭제"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </section>
                )
              ))}

              {hasMore && notifications.length > 0 && (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={fetchingMore}
                    className="inline-flex h-10 items-center gap-2 rounded-md border border-gray-200 bg-white px-5 text-xs font-semibold text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-dark-700 dark:bg-dark-950 dark:hover:bg-dark-800"
                  >
                    {fetchingMore ? (
                      <Loader2 size={15} className="animate-spin text-primary-500" />
                    ) : (
                      <>
                        이전 알림 더보기
                        <ChevronDown size={15} />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex min-h-72 flex-col items-center justify-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gray-100 text-gray-300 dark:bg-dark-800 dark:text-dark-600">
                <BellOff size={26} />
              </div>
              <div className="mt-4 text-sm font-semibold text-gray-900 dark:text-dark-100">기록된 알림이 없습니다</div>
              <p className="mt-2 text-xs font-medium text-gray-400 dark:text-dark-500">새로운 알림이 생기면 이곳에 시간순으로 표시됩니다.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default NotificationPage;
