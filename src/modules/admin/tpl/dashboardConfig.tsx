"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Activity,
  ChevronDown,
  FileText,
  GripVertical,
  Handshake,
  Headphones,
  LayoutPanelTop,
  MessageSquare,
  Plus,
  RotateCcw,
  Save,
  Server,
  ServerCog,
  TerminalSquare,
  Trash2,
  Zap,
} from "lucide-react";

import {
  AdminExtensionPage,
  adminDarkButtonClass,
  adminGhostButtonClass,
  adminPrimaryButtonClass,
} from "@/extensions/admin/AdminExtensionTemplate";

import { DASHBOARD_WIDGET_STORAGE_KEY, parseDashboardLayout, type PlacedWidget, type WidgetColSpan } from "../dashboard/layout";
const DASHBOARD_WIDGET_PANEL_WIDTH_KEY = "gjworks.admin.dashboard.widgetPanelWidth";
const DEFAULT_WIDGET_PANEL_WIDTH = 420;
const MIN_WIDGET_PANEL_WIDTH = 320;
const MAX_WIDGET_PANEL_WIDTH = 680;

const siteAdminTabs = [
  { label: "사이트맵", href: "/admin/site/sitemap" },
  { label: "대시보드 구성", href: "/admin/site/dashboard" },
];

type DashboardWidget = {
  id: string;
  icon: ReactNode;
  module: string;
  title: string;
  description: string;
  path: string;
  preview: "list" | "comments" | "support" | "sessions" | "system" | "flow";
  defaultColSpan: WidgetColSpan;
};

const widgetCatalog: DashboardWidget[] = [
  {
    id: "admin.flow",
    icon: <Zap size={17} />,
    module: "admin",
    title: "System Flow",
    description: "CPU, 네트워크, 스토리지, 업타임을 한 화면에서 보는 운영 위젯입니다.",
    path: "src/modules/admin/widgets/systemFlow",
    preview: "flow",
    defaultColSpan: 8,
  },
  {
    id: "posts.documents",
    icon: <FileText size={17} />,
    module: "posts",
    title: "Recent Documents",
    description: "최근 작성된 문서 목록을 보여주는 게시판 위젯입니다.",
    path: "src/modules/posts/admin/widgets/documentList",
    preview: "list",
    defaultColSpan: 6,
  },
  {
    id: "posts.comments",
    icon: <MessageSquare size={17} />,
    module: "posts",
    title: "Recent Comments",
    description: "최근 댓글과 연결된 문서 흐름을 보여주는 게시판 위젯입니다.",
    path: "src/modules/posts/admin/widgets/commentList",
    preview: "comments",
    defaultColSpan: 6,
  },
  {
    id: "service.support",
    icon: <Headphones size={17} />,
    module: "service",
    title: "1:1 문의",
    description: "서비스 문의 접수와 처리 상태를 빠르게 확인하는 위젯입니다.",
    path: "src/extensions/service/admin/widgets/supportList",
    preview: "support",
    defaultColSpan: 6,
  },
  {
    id: "service.hostingRequests",
    icon: <ServerCog size={17} />,
    module: "service",
    title: "호스팅 신청 현황",
    description: "회원이 신청한 호스팅과 서비스 설치 상태를 확인하는 위젯입니다.",
    path: "src/extensions/service/admin/widgets/hostingRequests",
    preview: "support",
    defaultColSpan: 6,
  },
  {
    id: "service.partnerApplications",
    icon: <Handshake size={17} />,
    module: "service",
    title: "파트너 신청 현황",
    description: "파트너 신청 접수, 검토, 승인 상태를 빠르게 확인하는 위젯입니다.",
    path: "src/extensions/partners/admin/widgets/partnerApplications",
    preview: "support",
    defaultColSpan: 6,
  },
  {
    id: "service.hostingLogs",
    icon: <TerminalSquare size={17} />,
    module: "service",
    title: "호스팅 로그 목록",
    description: "설치와 배포 실행 로그를 최근순으로 확인하는 위젯입니다.",
    path: "src/extensions/service/admin/widgets/hostingLogs",
    preview: "comments",
    defaultColSpan: 8,
  },
  {
    id: "user.sessions",
    icon: <Activity size={17} />,
    module: "user",
    title: "Live sessions",
    description: "현재 접속 중인 사용자 세션을 보여주는 회원 위젯입니다.",
    path: "src/modules/user/admin/widgets/activeUser",
    preview: "sessions",
    defaultColSpan: 4,
  },
  {
    id: "admin.system",
    icon: <Server size={17} />,
    module: "admin",
    title: "System Stack",
    description: "서버 런타임과 주요 패키지 상태를 보여주는 시스템 위젯입니다.",
    path: "src/modules/admin/widgets/system",
    preview: "system",
    defaultColSpan: 4,
  },
];

const colSpanOptions: WidgetColSpan[] = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const colSpanClassMap: Record<WidgetColSpan, string> = {
  3: "xl:col-span-3",
  4: "xl:col-span-4",
  5: "xl:col-span-5",
  6: "xl:col-span-6",
  7: "xl:col-span-7",
  8: "xl:col-span-8",
  9: "xl:col-span-9",
  10: "xl:col-span-10",
  11: "xl:col-span-11",
  12: "xl:col-span-12",
};

const findWidget = (id: string) => widgetCatalog.find((widget) => widget.id === id);

const widgetWidths = Object.fromEntries(widgetCatalog.map(widget => [widget.id, widget.defaultColSpan]));

const readStoredWidgets = () => {
  if (typeof window === "undefined") return [];

  try {
    return parseDashboardLayout(window.localStorage.getItem(DASHBOARD_WIDGET_STORAGE_KEY), widgetWidths);
  } catch {
    return [];
  }
};

const readStoredPanelWidth = () => {
  if (typeof window === "undefined") return DEFAULT_WIDGET_PANEL_WIDTH;

  const width = Number(window.localStorage.getItem(DASHBOARD_WIDGET_PANEL_WIDTH_KEY));

  if (!Number.isFinite(width)) return DEFAULT_WIDGET_PANEL_WIDTH;

  return Math.min(Math.max(width, MIN_WIDGET_PANEL_WIDTH), MAX_WIDGET_PANEL_WIDTH);
};

const DashboardConfigAdmin = () => {
  const [placedWidgets, setPlacedWidgets] = useState<PlacedWidget[]>([]);
  const [savedWidgets, setSavedWidgets] = useState<PlacedWidget[]>([]);
  const [savedMessage, setSavedMessage] = useState("");
  const [widgetPanelWidth, setWidgetPanelWidth] = useState(DEFAULT_WIDGET_PANEL_WIDTH);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    const stored = readStoredWidgets();
    setPlacedWidgets(stored);
    setSavedWidgets(stored);
    setWidgetPanelWidth(readStoredPanelWidth());
  }, []);

  const handlePanelResizeStart = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();

    const startX = event.clientX;
    const startWidth = widgetPanelWidth;

    const handleMove = (moveEvent: PointerEvent) => {
      const nextWidth = Math.min(
        Math.max(startWidth + moveEvent.clientX - startX, MIN_WIDGET_PANEL_WIDTH),
        MAX_WIDGET_PANEL_WIDTH,
      );

      setWidgetPanelWidth(nextWidth);
    };

    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  }, [widgetPanelWidth]);

  useEffect(() => {
    window.localStorage.setItem(DASHBOARD_WIDGET_PANEL_WIDTH_KEY, String(widgetPanelWidth));
  }, [widgetPanelWidth]);

  const placedWidgetIds = useMemo(() => placedWidgets.map((widget) => widget.id), [placedWidgets]);
  const availableWidgets = useMemo(
    () => widgetCatalog.filter((widget) => !placedWidgetIds.includes(widget.id)),
    [placedWidgetIds],
  );
  const isDirty = JSON.stringify(placedWidgets) !== JSON.stringify(savedWidgets);

  const addWidget = (widgetId: string) => {
    const widget = findWidget(widgetId);
    if (!widget) return;

    setSavedMessage("");
    setPlacedWidgets((prev) => (
      prev.some((item) => item.id === widgetId)
        ? prev
        : [...prev, { id: widget.id, colSpan: widget.defaultColSpan }]
    ));
  };

  const removeWidget = (widgetId: string) => {
    setSavedMessage("");
    setPlacedWidgets((prev) => prev.filter((item) => item.id !== widgetId));
  };

  const changeWidgetColSpan = (widgetId: string, colSpan: WidgetColSpan) => {
    setSavedMessage("");
    setPlacedWidgets((prev) => prev.map((item) => item.id === widgetId ? { ...item, colSpan } : item));
  };

  const resetPlacement = () => {
    setSavedMessage("");
    setPlacedWidgets(savedWidgets);
  };

  const savePlacement = () => {
    window.localStorage.setItem(DASHBOARD_WIDGET_STORAGE_KEY, JSON.stringify(placedWidgets));
    setSavedWidgets(placedWidgets);
    setSavedMessage("저장되었습니다.");
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setSavedMessage("");
    setPlacedWidgets((items) => {
      const oldIndex = items.findIndex((item) => item.id === String(active.id));
      const newIndex = items.findIndex((item) => item.id === String(over.id));

      if (oldIndex < 0 || newIndex < 0) return items;

      return arrayMove(items, oldIndex, newIndex);
    });
  };

  return (
    <AdminExtensionPage
      icon={<LayoutPanelTop size={13} />}
      eyebrow="Site"
      title="대시보드 구성"
      description="관리자 메인 화면에 표시할 위젯과 운영 지표를 구성합니다."
      tabs={siteAdminTabs}
      activeHref="/admin/site/dashboard"
    >
      <div
        className="grid gap-5 xl:grid-cols-[var(--dashboard-widget-panel)_18px_minmax(0,1fr)]"
        style={{ "--dashboard-widget-panel": `${widgetPanelWidth}px` } as React.CSSProperties}
      >
        <section className="rounded-xl border border-gray-200 bg-white dark:border-dark-800 dark:bg-dark-950">
          <div className="border-b border-gray-100 px-6 py-5 dark:border-dark-800">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-dark-100">배치 가능한 위젯</h2>
            <p className="mt-1 text-xs leading-5 text-gray-400 dark:text-dark-400">
              미리보기를 확인하고 필요한 위젯을 오른쪽으로 추가합니다.
            </p>
          </div>

          <div className="space-y-4 p-5">
            {availableWidgets.length === 0 ? (
              <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-8 text-center dark:border-dark-700 dark:bg-dark-900">
                <p className="text-xs font-medium text-gray-400 dark:text-dark-500">배치 가능한 위젯이 없습니다.</p>
              </div>
            ) : (
              availableWidgets.map((item) => (
                <article key={item.id} className="rounded-xl bg-gray-50 p-4 dark:bg-dark-900">
                  <WidgetPreview widget={item} compact />

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-100">{item.title}</h3>
                        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:bg-dark-800 dark:text-dark-300">
                          {item.module}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-[11px] text-gray-400 dark:text-dark-500">{item.path}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addWidget(item.id)}
                      className={`${adminPrimaryButtonClass} h-9 shrink-0 px-3`}
                    >
                      <Plus size={14} />
                      추가
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <div className="relative hidden xl:block">
          <button
            type="button"
            onPointerDown={handlePanelResizeStart}
            className="absolute inset-y-0 left-1/2 flex w-4 -translate-x-1/2 cursor-col-resize items-center justify-center rounded-full text-gray-300 transition hover:bg-gray-100 hover:text-gray-500 dark:text-dark-600 dark:hover:bg-dark-900 dark:hover:text-dark-300"
            aria-label="배치 가능한 위젯 패널 너비 조절"
          >
            <span className="h-14 w-1 rounded-full bg-current" />
          </button>
        </div>

        <section className="rounded-xl border border-gray-200 bg-white dark:border-dark-800 dark:bg-dark-950">
          <div className="flex flex-col gap-4 border-b border-gray-100 px-6 py-5 dark:border-dark-800 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-dark-100">관리자 메인 배치</h2>
              <p className="mt-1 text-xs leading-5 text-gray-400 dark:text-dark-400">
                12칸 그리드 기준으로 너비와 순서를 정하면 `/admin` 메인에 같은 배치로 표시됩니다.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {savedMessage && <span className="text-xs font-semibold text-primary-600 dark:text-primary-300">{savedMessage}</span>}
              <button type="button" className={`${adminGhostButtonClass} h-9 px-3`} onClick={resetPlacement} disabled={!isDirty}>
                <RotateCcw size={14} />
                되돌리기
              </button>
              <button type="button" className={`${adminDarkButtonClass} h-9 px-3`} onClick={savePlacement} disabled={!isDirty}>
                <Save size={14} />
                저장
              </button>
            </div>
          </div>

          <div className="p-6">
            {placedWidgets.length === 0 ? (
              <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-dark-700 dark:bg-dark-900">
                <div className="max-w-xs">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-gray-500 dark:bg-dark-800 dark:text-dark-300">
                    <LayoutPanelTop size={24} />
                  </div>
                  <h3 className="mt-5 text-base font-semibold text-gray-900 dark:text-dark-100">위젯을 추가하세요.</h3>
                  <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-dark-400">
                    왼쪽 미리보기에서 필요한 위젯을 추가하면 이곳에서 크기와 순서를 조정할 수 있습니다.
                  </p>
                </div>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={placedWidgetIds} strategy={verticalListSortingStrategy}>
                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                    {placedWidgets.map((placed, index) => {
                      const widget = findWidget(placed.id);
                      if (!widget) return null;

                      return (
                        <SortablePlacedWidget
                          key={placed.id}
                          widget={widget}
                          placed={placed}
                          index={index}
                          onRemove={removeWidget}
                          onColSpanChange={changeWidgetColSpan}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </section>
      </div>
    </AdminExtensionPage>
  );
};

const WidgetPreview = ({ widget, compact = false }: { widget: DashboardWidget; compact?: boolean }) => {
  const lineClass = compact ? "h-1.5" : "h-2";

  return (
    <div className={`rounded-xl bg-white p-4 dark:bg-dark-950 ${compact ? "min-h-32" : "min-h-44"}`}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-gray-400 dark:text-dark-500">{widget.module}</p>
          <p className="mt-1 text-xs font-semibold text-gray-900 dark:text-dark-100">{widget.title}</p>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-dark-800 dark:text-dark-300">
          {widget.icon}
        </span>
      </div>

      {widget.preview === "flow" ? (
        <div className="space-y-3">
          {["CPU Load", "Network", "Storage"].map((item, index) => (
            <div key={item}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-gray-500 dark:text-dark-400">{item}</span>
                <span className="text-[10px] font-mono text-gray-400 dark:text-dark-500">{index === 0 ? "42%" : index === 1 ? "1.8 MB/s" : "68%"}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-dark-800">
                <div className={`h-full rounded-full bg-gray-900 dark:bg-primary-300 ${index === 0 ? "w-5/12" : index === 1 ? "w-3/12" : "w-8/12"}`} />
              </div>
            </div>
          ))}
        </div>
      ) : widget.preview === "system" ? (
        <div className="grid grid-cols-2 gap-2">
          {["Next", "React", "Prisma", "Node"].map((item) => (
            <div key={item} className="rounded-lg bg-gray-100 px-3 py-2 dark:bg-dark-800">
              <p className="text-[10px] font-semibold text-gray-500 dark:text-dark-400">{item}</p>
              <div className={`${lineClass} mt-2 w-2/3 rounded-full bg-gray-300 dark:bg-dark-700`} />
            </div>
          ))}
        </div>
      ) : widget.preview === "sessions" ? (
        <div className="space-y-2">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 dark:bg-dark-800">
              <span className="h-2 w-2 rounded-full bg-primary-500 dark:bg-primary-300" />
              <div className={`${lineClass} flex-1 rounded-full bg-gray-300 dark:bg-dark-700`} />
              <div className={`${lineClass} w-10 rounded-full bg-gray-200 dark:bg-dark-700`} />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2.5">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-[10px] font-bold text-gray-400 dark:bg-dark-800 dark:text-dark-500">
                {item}
              </span>
              <div className="min-w-0 flex-1">
                <div className={`${lineClass} w-4/5 rounded-full bg-gray-300 dark:bg-dark-700`} />
                <div className={`${lineClass} mt-2 w-1/2 rounded-full bg-gray-200 dark:bg-dark-800`} />
              </div>
              {widget.preview === "support" && <span className="h-5 w-12 rounded-full bg-primary-100 dark:bg-primary-400/10" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SortablePlacedWidget = ({
  widget,
  placed,
  onRemove,
  onColSpanChange,
}: {
  widget: DashboardWidget;
  placed: PlacedWidget;
  index: number;
  onRemove: (widgetId: string) => void;
  onColSpanChange: (widgetId: string, colSpan: WidgetColSpan) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border border-gray-200 bg-gray-50 p-4 transition dark:border-dark-800 dark:bg-dark-900 ${colSpanClassMap[placed.colSpan]} ${
        isDragging ? "relative z-10 opacity-70 ring-4 ring-primary-500/10 dark:ring-primary-400/10" : ""
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="flex h-10 w-10 cursor-grab items-center justify-center rounded-xl bg-white text-gray-400 transition hover:text-gray-900 active:cursor-grabbing dark:bg-dark-800 dark:text-dark-500 dark:hover:text-dark-100"
            aria-label={`${widget.title} 순서 이동`}
          >
            <GripVertical size={17} />
          </button>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-dark-100">{widget.title}</h3>
          </div>
        </div>

        <button
          type="button"
          className={`${adminGhostButtonClass} h-9 shrink-0 px-3 text-red-500 hover:text-red-500 dark:text-red-300 dark:hover:text-red-300`}
          onClick={() => onRemove(widget.id)}
        >
          <Trash2 size={14} />
          제거
        </button>
      </div>

      <WidgetPreview widget={widget} />

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-dark-500">
          Width
        </span>
        <label className="relative block">
          <select
            value={placed.colSpan}
            onChange={(event) => onColSpanChange(widget.id, Number(event.target.value) as WidgetColSpan)}
            className="h-9 appearance-none rounded-lg border border-gray-200 bg-white pl-3 pr-9 text-xs font-semibold text-gray-700 outline-none transition hover:border-gray-300 focus:border-gray-900 focus:ring-4 focus:ring-gray-900/5 dark:border-dark-800 dark:bg-dark-800 dark:text-dark-200 dark:hover:border-dark-700 dark:focus:border-dark-500 dark:focus:ring-dark-500/10"
            aria-label={`${widget.title} 위젯 너비`}
          >
            {colSpanOptions.map((option) => (
              <option key={option} value={option}>
                {option}칸 / 12
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-dark-400"
          />
        </label>
      </div>
    </div>
  );
};

export default DashboardConfigAdmin;
