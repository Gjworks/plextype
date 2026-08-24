"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { FileText, Loader2, MessageSquareText, Paperclip, UserRound } from "lucide-react";

import HeaderUser from "@/modules/user/tpl/default/header";
import { ActionState } from "@/modules/user/actions/_type";
import {
  getUserTimelineAction,
  UserTimelineData,
  UserTimelineFilter,
  UserTimelineItem,
  UserTimelineKind,
} from "@/modules/user/actions/timeline.action";

type TimelineLoadAction = (
  cursor?: string | null,
  limit?: number,
  filter?: UserTimelineFilter,
) => Promise<ActionState<UserTimelineData>>;

type TimelineProps = {
  initialData?: UserTimelineData | null;
  loadTimelineAction?: TimelineLoadAction;
  showHeader?: boolean;
  embedded?: boolean;
};

const TIME_ZONE = "Asia/Seoul";

const kindMeta: Record<UserTimelineKind, { label: string; icon: React.ReactNode }> = {
  document: { label: "게시글", icon: <FileText size={15} /> },
  comment: { label: "댓글", icon: <MessageSquareText size={15} /> },
  attachment: { label: "파일", icon: <Paperclip size={15} /> },
};

const formatDate = (date: Date | string) => {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  }).format(new Date(date));
};

const TimelineItemCard = ({ item }: { item: UserTimelineItem }) => {
  const meta = kindMeta[item.kind];
  const content = (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-[0_14px_34px_rgba(15,23,42,0.05)] dark:border-dark-800 dark:bg-dark-900 dark:hover:border-dark-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-500 dark:bg-dark-800 dark:text-dark-300">
            {meta.icon}
            {meta.label}
          </div>
          <h3 className="line-clamp-2 text-base font-medium tracking-[-0.025em] text-gray-950 dark:text-dark-100">
            {item.title}
          </h3>
          {item.description && item.kind !== "attachment" && (
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-500 dark:text-dark-400">
              {item.description}
            </p>
          )}
          <div className="mt-3 text-xs text-gray-400 dark:text-dark-500">{item.meta}</div>
        </div>
        <div className="shrink-0 text-xs text-gray-400 dark:text-dark-500" suppressHydrationWarning>
          {formatDate(item.createdAt)}
        </div>
      </div>
    </article>
  );

  if (!item.href) return content;
  return (
    <Link href={item.href} className="block">
      {content}
    </Link>
  );
};

const Timeline = ({
  initialData = null,
  loadTimelineAction = getUserTimelineAction,
  showHeader = true,
  embedded = false,
}: TimelineProps) => {
  const [data, setData] = useState<UserTimelineData | null>(initialData);
  const [items, setItems] = useState(initialData?.items || []);
  const [nextCursor, setNextCursor] = useState(initialData?.nextCursor || null);
  const [hasMore, setHasMore] = useState(initialData?.hasMore || false);
  const [activeFilter, setActiveFilter] = useState<UserTimelineFilter>("all");
  const [isPending, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const summary = data?.summary;
  const total = summary ? summary.documentCount + summary.commentCount + summary.attachmentCount : 0;
  const tabs = useMemo(() => [
    { key: "all" as const, label: "전체", count: total },
    { key: "document" as const, label: "게시글", count: summary?.documentCount || 0 },
    { key: "comment" as const, label: "댓글", count: summary?.commentCount || 0 },
    { key: "attachment" as const, label: "파일", count: summary?.attachmentCount || 0 },
  ], [summary, total]);

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setItems(initialData.items);
      setNextCursor(initialData.nextCursor);
      setHasMore(initialData.hasMore);
    }
  }, [initialData]);

  const load = (cursor: string | null, filter: UserTimelineFilter, append = false) => {
    startTransition(async () => {
      const result = await loadTimelineAction(cursor, 15, filter);
      if (!result.success || !result.data) {
        if (!append) setItems([]);
        setHasMore(false);
        return;
      }

      setData(result.data);
      setNextCursor(result.data.nextCursor);
      setHasMore(result.data.hasMore);
      setItems((prev) => append ? [...prev, ...result.data!.items.filter((item) => !prev.some((old) => old.id === item.id))] : result.data!.items);
    });
  };

  const changeFilter = (filter: UserTimelineFilter) => {
    if (filter === activeFilter || isPending) return;
    setActiveFilter(filter);
    load(null, filter);
  };

  const loadMore = () => {
    if (!hasMore || isPending || !nextCursor) return;
    load(nextCursor, activeFilter, true);
  };

  useEffect(() => {
    const target = sentinelRef.current;
    if (!target) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) loadMore();
    }, { rootMargin: "320px 0px" });

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, isPending, nextCursor, activeFilter]);

  if (!data) {
    return (
      <div className={embedded ? "bg-transparent" : "min-h-screen bg-white dark:bg-dark-950"}>
        {showHeader && <HeaderUser />}
        <div className="mx-auto max-w-screen-lg px-4 py-10">
          <div className="flex min-h-72 items-center justify-center rounded-3xl border border-gray-200 bg-white text-sm text-gray-400 shadow-[0_18px_60px_rgba(15,23,42,0.06)] dark:border-dark-800 dark:bg-dark-900 dark:text-dark-500">
            <Loader2 size={17} className="mr-2 animate-spin" />
            계정 정보를 불러오는 중
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={embedded ? "bg-transparent" : "min-h-screen bg-white dark:bg-dark-950"}>
      {showHeader && <HeaderUser />}
      <div className="mx-auto max-w-screen-lg px-4 py-10 md:py-14">
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] dark:border-dark-800 dark:bg-dark-900 md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-gray-100 text-gray-500 ring-1 ring-gray-200 dark:bg-dark-800 dark:text-dark-300 dark:ring-dark-700">
                {data.user.profileImage ? (
                  <img src={data.user.profileImage} alt={data.user.nickName} className="h-full w-full object-cover" />
                ) : (
                  <UserRound size={24} />
                )}
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-gray-400 dark:text-dark-500">Timeline</div>
                <h1 className="mt-2 text-2xl font-medium tracking-[-0.04em] text-gray-950 dark:text-dark-100">{data.user.nickName}</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-dark-400">@{data.user.accountId}</p>
              </div>
            </div>
            <div className="rounded-2xl bg-gray-50 px-5 py-4 text-sm text-gray-500 ring-1 ring-gray-200 dark:bg-dark-950/40 dark:text-dark-300 dark:ring-dark-800">
              <span className="block text-xs uppercase tracking-[0.18em] text-gray-400 dark:text-dark-500">Activity</span>
              <span className="mt-1 block text-xl font-medium text-gray-950 dark:text-white">{total}</span>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-3xl border border-gray-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.04)] dark:border-dark-800 dark:bg-dark-900">
          <div className="mb-5 inline-flex max-w-full gap-1 overflow-x-auto rounded-full bg-gray-100 p-1 dark:bg-dark-950">
            {tabs.map((tab) => {
              const active = activeFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => changeFilter(tab.key)}
                  className={`inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-3.5 py-2 text-sm transition-all duration-200 ${
                    active
                      ? "bg-white text-gray-950 shadow-sm dark:bg-dark-800 dark:text-white"
                      : "text-gray-500 hover:text-gray-950 dark:text-dark-400 dark:hover:text-white"
                  }`}
                >
                  {tab.label}
                  <span className={active ? "text-white/70 dark:text-dark-950/70" : "text-gray-400"}>{tab.count}</span>
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            {items.length > 0 ? (
              items.map((item) => <TimelineItemCard key={item.id} item={item} />)
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-400 dark:border-dark-700 dark:text-dark-500">
                아직 표시할 활동이 없습니다.
              </div>
            )}
          </div>

          <div ref={sentinelRef} className="flex min-h-14 items-center justify-center pt-5">
            {isPending ? (
              <span className="inline-flex items-center gap-2 text-sm text-gray-400">
                <Loader2 size={15} className="animate-spin" />
                불러오는 중
              </span>
            ) : hasMore ? (
              <button type="button" onClick={loadMore} className="cursor-pointer rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-500 transition-all hover:border-gray-300 hover:text-gray-950 hover:shadow-[inset_0_0_0_1px_rgba(15,23,42,0.04)] dark:border-dark-700 dark:bg-dark-900 dark:text-dark-300 dark:hover:border-dark-600 dark:hover:text-white">
                더 보기
              </button>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Timeline;
