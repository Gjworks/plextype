"use client";

import React, { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Activity, Bell, Clock3, Edit3, FileText, Loader2, MessageSquareText, Paperclip, Plus, Search, Trash2, UsersRound } from "lucide-react";

import { UserInfo, UserListResponseData } from "@/modules/user/actions/_type";
import { removeUserAction, updateUserStatusAdminAction } from "@/modules/user/actions/user.action";
import {
  getUserTimelineAdminAction,
  UserTimelineData,
  UserTimelineFilter,
  UserTimelineItem,
  UserTimelineKind,
} from "@/modules/user/actions/timeline.action";
import PageNavigation from "@components/nav/PageNavigation";
import Button from "@components/button/Button";
import Bottom from "@components/panel/Bottom";

type Props = {
  initialUserList: UserInfo[];
  initialNavigation: UserListResponseData["navigation"];
  title?: string;
  description?: string;
  basePath?: string;
  showStatusActions?: boolean;
};

const checkboxClass =
  "h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500";

const timelineKindMeta: Record<UserTimelineKind, {
  label: string;
  color: string;
  icon: React.ReactNode;
}> = {
  document: {
    label: "게시글",
    color: "bg-cyan-50 text-cyan-600 ring-cyan-100",
    icon: <FileText size={14} />,
  },
  comment: {
    label: "댓글",
    color: "bg-violet-50 text-violet-600 ring-violet-100",
    icon: <MessageSquareText size={14} />,
  },
  attachment: {
    label: "파일",
    color: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    icon: <Paperclip size={14} />,
  },
  notification: {
    label: "알림",
    color: "bg-amber-50 text-amber-600 ring-amber-100",
    icon: <Bell size={14} />,
  },
};

const formatTimelineDate = (date: Date | string) => {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

const TimelinePreviewItem = ({ item }: { item: UserTimelineItem }) => {
  const meta = timelineKindMeta[item.kind];
  const content = (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm shadow-gray-100 transition-colors hover:border-gray-200 hover:bg-gray-50">
      <div className="mb-2 flex items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${meta.color}`}>
          {meta.icon}
          {meta.label}
        </span>
        <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-gray-400">
          <Clock3 size={12} />
          {formatTimelineDate(item.createdAt)}
        </span>
      </div>
      <div className="line-clamp-1 text-sm font-bold text-gray-900">{item.title}</div>
      <p className="mt-1 line-clamp-2 text-sm leading-6 text-gray-500">{item.description}</p>
      {item.imageUrl && (
        <div className="mt-3 overflow-hidden rounded-lg bg-gray-100 ring-1 ring-gray-100">
          <img src={item.imageUrl} alt={item.title} className="max-h-56 w-full object-cover" loading="lazy" />
        </div>
      )}
      <div className="mt-3 text-xs font-semibold text-gray-400">{item.meta}</div>
    </div>
  );

  if (!item.href) return content;

  return (
    <Link href={item.href} className="block">
      {content}
    </Link>
  );
};

const AdminUserTimelinePanel = ({ userId }: { userId: number }) => {
  const [data, setData] = useState<UserTimelineData | null>(null);
  const [items, setItems] = useState<UserTimelineItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [activeFilter, setActiveFilter] = useState<UserTimelineFilter>("all");
  const [isPending, startTransition] = useTransition();

  const totalActivity = data
    ? data.summary.documentCount + data.summary.commentCount + data.summary.attachmentCount + data.summary.notificationCount
    : 0;

  const filterTabs = useMemo(() => {
    return [
      { key: "all" as const, label: "전체", count: totalActivity },
      { key: "document" as const, label: "게시글", count: data?.summary.documentCount || 0 },
      { key: "comment" as const, label: "댓글", count: data?.summary.commentCount || 0 },
      { key: "attachment" as const, label: "파일", count: data?.summary.attachmentCount || 0 },
      { key: "notification" as const, label: "알림", count: data?.summary.notificationCount || 0 },
    ];
  }, [data, totalActivity]);

  const fetchTimeline = (filter: UserTimelineFilter, cursor?: string | null, append = false) => {
    startTransition(async () => {
      const result = await getUserTimelineAdminAction(userId, cursor, 15, filter);
      if (!result.success || !result.data) {
        setData(null);
        setItems([]);
        setNextCursor(null);
        setHasMore(false);
        return;
      }

      const nextData = result.data;
      setData(nextData);
      setItems((prev) => append ? [...prev, ...nextData.items.filter((item) => !prev.some((prevItem) => prevItem.id === item.id))] : nextData.items);
      setNextCursor(nextData.nextCursor);
      setHasMore(nextData.hasMore);
    });
  };

  useEffect(() => {
    setActiveFilter("all");
    fetchTimeline("all");
  }, [userId]);

  const changeFilter = (filter: UserTimelineFilter) => {
    if (filter === activeFilter || isPending) return;
    setActiveFilter(filter);
    fetchTimeline(filter);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16">
      <div className="mb-5 border-b border-gray-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-sm font-bold text-gray-500 ring-1 ring-gray-200">
            {data?.user.profileImage ? (
              <img src={data.user.profileImage} alt={data.user.nickName} className="h-full w-full object-cover" />
            ) : (
              data?.user.nickName?.slice(0, 1) || "U"
            )}
          </div>
          <div className="min-w-0">
            <div className="line-clamp-1 text-lg font-black text-gray-950">{data?.user.nickName || "회원 타임라인"}</div>
            <div className="mt-0.5 line-clamp-1 text-sm font-semibold text-gray-400">
              {data ? `@${data.user.accountId} · ${data.user.email}` : "활동 기록을 불러오는 중입니다."}
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto">
          {filterTabs.map((tab) => {
            const active = activeFilter === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => changeFilter(tab.key)}
                className={`flex min-w-20 cursor-pointer items-center justify-between gap-2 rounded-full px-3 py-2 text-xs font-bold transition-colors ${active ? "bg-gray-950 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900"}`}
              >
                <span>{tab.label}</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] ${active ? "bg-white/20" : "bg-white text-gray-400"}`}>{tab.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {isPending && items.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-sm font-semibold text-gray-400">
          <Loader2 size={18} className="mr-2 animate-spin" />
          타임라인을 불러오는 중
        </div>
      ) : items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <TimelinePreviewItem key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-sm font-semibold text-gray-400">
          표시할 활동이 없습니다.
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-5 flex justify-center">
          {hasMore ? (
            <button
              type="button"
              onClick={() => fetchTimeline(activeFilter, nextCursor, true)}
              disabled={isPending}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-xs font-bold text-gray-500 transition-colors hover:bg-gray-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              더 보기
            </button>
          ) : (
            <div className="rounded-full bg-gray-100 px-4 py-2 text-xs font-bold text-gray-400">
              모든 활동을 확인했습니다.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const statusMeta: Record<string, { label: string; className: string }> = {
  active: { label: "활성", className: "bg-emerald-50 text-emerald-600 ring-emerald-100" },
  pending: { label: "승인 대기", className: "bg-amber-50 text-amber-600 ring-amber-100" },
  blocked: { label: "차단", className: "bg-rose-50 text-rose-600 ring-rose-100" },
};

const AdminUserList = ({
  initialUserList,
  initialNavigation,
  title = "회원 목록",
  description,
  basePath = "/admin/user/list",
  showStatusActions = true,
}: Props) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchTarget = searchParams?.get("target") || "accountId";
  const searchKeyword = searchParams?.get("keyword") || "";
  const timelineUserId = Number(searchParams?.get("timelineUserId")) || null;
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isPending, startTransition] = useTransition();

  const allChecked = initialUserList.length > 0 && selectedIds.length === initialUserList.length;
  const timelineCloseHref = (() => {
    const params = new URLSearchParams(searchParams?.toString());
    params.delete("timelineUserId");
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  })();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const target = formData.get("target") as string;
    const keyword = formData.get("keyword") as string;

    router.push(`${basePath}?page=1&target=${target}&keyword=${keyword}`);
  };

  const handleCheck = (id: number, isChecked: boolean) => {
    setSelectedIds((prev) =>
      isChecked ? [...prev, id] : prev.filter((selectedId) => selectedId !== id),
    );
  };

  const handleCheckAll = (isChecked: boolean) => {
    setSelectedIds(isChecked ? initialUserList.map((user) => user.id) : []);
  };

  const handleDelete = () => {
    if (selectedIds.length === 0) {
      alert("삭제할 회원을 선택해주세요.");
      return;
    }

    if (!window.confirm(`선택하신 ${selectedIds.length}명의 회원을 정말 삭제하시겠습니까?`)) return;

    startTransition(async () => {
      try {
        const results = await Promise.all(selectedIds.map((id) => removeUserAction(id)));
        const hasError = results.some((res) => !res.success);

        alert(hasError ? "일부 회원 삭제 중 오류가 발생했습니다." : "성공적으로 삭제되었습니다.");
        setSelectedIds([]);
        router.refresh();
      } catch {
        alert("서버 통신 중 오류가 발생했습니다.");
      }
    });
  };

  const handleOpenTimeline = (id: number) => {
    const params = new URLSearchParams(searchParams?.toString());
    params.set("timelineUserId", id.toString());
    router.push(`${basePath}?${params.toString()}`);
  };

  const handleStatusChange = (id: number, status: "active" | "pending" | "blocked") => {
    startTransition(async () => {
      const result = await updateUserStatusAdminAction(id, status);
      alert(result.message);
      if (result.success) router.refresh();
    });
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-gray-400">
            <UsersRound size={13} />
            User Control
          </div>
          <div className="mt-2 text-lg font-semibold text-gray-700">{title}</div>
          <div className="mt-1 text-sm text-gray-400">
            {description || `전체 ${initialNavigation.totalCount}명 중 ${initialUserList.length}명을 표시하고 있습니다.`}
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row xl:w-auto">
          <form onSubmit={handleSearch} className="flex min-w-0 flex-1 items-center rounded-md border border-gray-200 bg-white px-3 shadow-sm shadow-gray-100 xl:w-[420px] xl:flex-none">
            <select
              name="target"
              defaultValue={searchTarget}
              className="shrink-0 bg-transparent py-2.5 pr-3 text-sm text-gray-500 outline-none"
            >
              <option value="accountId">아이디</option>
              <option value="nickName">닉네임</option>
              <option value="email_address">이메일</option>
            </select>
            <div className="h-4 w-px bg-gray-200" />
            <input
              type="text"
              name="keyword"
              defaultValue={searchKeyword}
              className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-gray-700 outline-none placeholder:text-gray-300"
              placeholder="검색어 입력"
            />
            <button type="submit" className="cursor-pointer text-gray-400 transition-colors hover:text-gray-900" aria-label="검색">
              <Search size={17} />
            </button>
          </form>

          <Link href="/admin/user/create" className="inline-flex w-auto items-center justify-center gap-2 rounded bg-blue-100 px-5 py-2 text-xs font-medium text-blue-500 transition-colors duration-200 hover:bg-blue-600 hover:text-white">
            <Plus size={15} />
            회원추가
          </Link>
          <Button
            type="button"
            onClick={handleDelete}
            isLoading={isPending}
            disabled={selectedIds.length === 0 || isPending}
            fullWidth={false}
            icon={<Trash2 size={14} />}
          >
            삭제
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm shadow-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="w-16 px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">ID</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Account</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Email</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Nickname</th>
                <th className="w-28 px-4 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</th>
                <th className="w-28 px-4 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">Timeline</th>
                <th className="w-28 px-4 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">Edit</th>
                <th className="w-14 px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    className={checkboxClass}
                    checked={allChecked}
                    onChange={(e) => handleCheckAll(e.target.checked)}
                    aria-label="전체 선택"
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {initialUserList.length > 0 ? (
                initialUserList.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 transition-colors last:border-b-0 hover:bg-blue-50/40">
                    <td className="px-4 py-4 text-sm font-medium text-gray-400">{item.id}</td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-semibold text-gray-800">{item.accountId}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">{item.email_address}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{item.nickName}</td>
                    <td className="px-4 py-4 text-center">
                      {(() => {
                        const meta = statusMeta[item.status || "active"] || statusMeta.active;

                        return (
                          <div className="flex flex-col items-center gap-2">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${meta.className}`}>
                              {meta.label}
                            </span>
                            {showStatusActions && item.status === "pending" && (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(item.id, "active")}
                                disabled={isPending}
                                className="cursor-pointer rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600 transition-colors hover:bg-emerald-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                승인
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleOpenTimeline(item.id)}
                        className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-md bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-500 transition-colors hover:bg-cyan-500 hover:text-white"
                      >
                        <Activity size={13} />
                        보기
                      </button>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Link href={`/admin/user/update/${item.id}`} className="inline-flex items-center justify-center gap-1 rounded-md bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-500 transition-colors hover:bg-gray-900 hover:text-white">
                        <Edit3 size={13} />
                        수정
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        className={checkboxClass}
                        checked={selectedIds.includes(item.id)}
                        onChange={(e) => handleCheck(item.id, e.target.checked)}
                        aria-label={`${item.accountId} 선택`}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-sm text-gray-400">조회된 회원이 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {initialNavigation.totalPages > 0 && (
        <div className="mt-6 flex justify-center">
          <PageNavigation page={initialNavigation.page} totalPages={initialNavigation.totalPages} />
        </div>
      )}

      {timelineUserId && (
        <Bottom closeHref={timelineCloseHref}>
          <AdminUserTimelinePanel userId={timelineUserId} />
        </Bottom>
      )}
    </div>
  );
};

export default AdminUserList;
