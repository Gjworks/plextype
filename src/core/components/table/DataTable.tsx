"use client";

import React, { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

import Checkbox from "@components/form/Checkbox";
import Skeleton from "@components/loading/Skeleton";
import EmptyState from "@components/message/EmptyState";

export type SortDirection = "asc" | "desc";
export interface SortState {
  key: string;
  direction: SortDirection;
}

export interface DataTableColumn<T> {
  key: string;
  header: React.ReactNode;
  // 없으면 row[key]를 그대로 보여준다.
  render?: (row: T, index: number) => React.ReactNode;
  // true면 머리글을 눌러 정렬한다. sortValue가 없으면 row[key]로 비교한다.
  sortable?: boolean;
  sortValue?: (row: T) => string | number | Date | null | undefined;
  align?: "left" | "center" | "right";
  // CSS width 값. 예: 120, "20%"
  width?: number | string;
  // 좁은 화면에서 숨길 열. md 미만에서 감춘다.
  hideOnMobile?: boolean;
  className?: string;
}

interface Props<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  // 정렬 상태를 넘기면 controlled. 서버에서 정렬하는 목록은 onSortChange에서 다시 불러오고 rows를 그대로 넘긴다.
  sort?: SortState | null;
  defaultSort?: SortState | null;
  onSortChange?: (sort: SortState | null) => void;
  // false면 rows 순서를 그대로 보여준다. 서버 정렬일 때 끈다.
  sortLocally?: boolean;
  // 넘기면 앞에 선택 체크박스 열이 생긴다.
  selectedKeys?: string[];
  onSelectionChange?: (keys: string[]) => void;
  isRowSelectable?: (row: T) => boolean;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  loadingRows?: number;
  emptyTitle?: string;
  emptyDescription?: React.ReactNode;
  emptyAction?: React.ReactNode;
  // 머리글을 표 영역 위쪽에 고정한다. className으로 max-h-를 주어 표 안에서 세로 스크롤될 때 쓴다.
  stickyHeader?: boolean;
  caption?: string;
  className?: string;
}

const compareValues = (a: unknown, b: unknown) => {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "ko", { numeric: true });
};

const alignClass = { left: "text-left", center: "text-center", right: "text-right" };

/**
 * 관리자 목록용 표. 정렬, 선택 체크박스, 로딩 자리 표시, 빈 상태를 한 번에 처리한다.
 * 페이지 이동은 표 아래에 PageNavigation을 붙여 쓴다. 넓은 표는 가로 스크롤된다.
 */
function DataTable<T>({
  columns,
  rows,
  rowKey,
  sort,
  defaultSort = null,
  onSortChange,
  sortLocally = true,
  selectedKeys,
  onSelectionChange,
  isRowSelectable,
  onRowClick,
  loading = false,
  loadingRows = 5,
  emptyTitle = "표시할 항목이 없습니다.",
  emptyDescription,
  emptyAction,
  stickyHeader = false,
  caption,
  className = "",
}: Props<T>) {
  const [innerSort, setInnerSort] = useState<SortState | null>(defaultSort);
  const currentSort = sort !== undefined ? sort : innerSort;
  const selectable = selectedKeys !== undefined && !!onSelectionChange;

  const sortedRows = useMemo(() => {
    if (!sortLocally || !currentSort) return rows;
    const column = columns.find((item) => item.key === currentSort.key);
    if (!column) return rows;
    const read = column.sortValue ?? ((row: T) => (row as Record<string, unknown>)[column.key] as string | number);
    const sorted = [...rows].sort((a, b) => compareValues(read(a), read(b)));
    return currentSort.direction === "desc" ? sorted.reverse() : sorted;
  }, [rows, columns, currentSort, sortLocally]);

  // 머리글을 누를 때마다 오름차순 → 내림차순 → 정렬 없음 순서로 바꾼다.
  const toggleSort = (key: string) => {
    const next: SortState | null =
      currentSort?.key !== key
        ? { key, direction: "asc" }
        : currentSort.direction === "asc"
          ? { key, direction: "desc" }
          : null;
    if (sort === undefined) setInnerSort(next);
    onSortChange?.(next);
  };

  const selectableKeys = sortedRows.filter((row) => !isRowSelectable || isRowSelectable(row)).map(rowKey);
  const selectedSet = new Set(selectedKeys ?? []);
  const selectedCount = selectableKeys.filter((key) => selectedSet.has(key)).length;
  const allSelected = selectableKeys.length > 0 && selectedCount === selectableKeys.length;

  const toggleAll = () => {
    if (!onSelectionChange) return;
    const visible = new Set(selectableKeys);
    const others = (selectedKeys ?? []).filter((key) => !visible.has(key));
    onSelectionChange(allSelected ? others : [...others, ...selectableKeys]);
  };

  const toggleRow = (key: string) => {
    if (!onSelectionChange) return;
    onSelectionChange(selectedSet.has(key) ? (selectedKeys ?? []).filter((item) => item !== key) : [...(selectedKeys ?? []), key]);
  };

  const responsive = (column: DataTableColumn<T>) => (column.hideOnMobile ? "hidden md:table-cell" : "");
  const colSpan = columns.length + (selectable ? 1 : 0);

  return (
    <div className={`scrollbar-subtle overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-dark-800 dark:bg-dark-900 ${className}`}>
      <table className="w-full border-collapse text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className={stickyHeader ? "sticky top-0 z-10" : ""}>
          <tr className="border-b border-gray-200 bg-gray-50 dark:border-dark-800 dark:bg-dark-950">
            {selectable && (
              <th scope="col" className="w-11 px-3 py-2.5">
                <Checkbox
                  aria-label="전체 선택"
                  checked={allSelected}
                  indeterminate={selectedCount > 0 && !allSelected}
                  disabled={loading || selectableKeys.length === 0}
                  onChange={toggleAll}
                />
              </th>
            )}
            {columns.map((column) => {
              const active = currentSort?.key === column.key;
              const direction = active ? currentSort?.direction : undefined;
              return (
                <th
                  key={column.key}
                  scope="col"
                  style={{ width: column.width }}
                  aria-sort={direction === "asc" ? "ascending" : direction === "desc" ? "descending" : undefined}
                  className={`whitespace-nowrap px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-dark-300 ${alignClass[column.align ?? "left"]} ${responsive(column)}`}
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(column.key)}
                      className={`inline-flex items-center gap-1 rounded hover:text-gray-950 dark:hover:text-white ${active ? "text-gray-950 dark:text-white" : ""}`}
                    >
                      {column.header}
                      {direction === "asc" ? <ArrowUp size={13} /> : direction === "desc" ? <ArrowDown size={13} /> : <ChevronsUpDown size={13} className="opacity-40" />}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {loading &&
            Array.from({ length: loadingRows }, (_, index) => (
              <tr key={`loading-${index}`} className="border-b border-gray-100 last:border-0 dark:border-dark-800">
                {selectable && (
                  <td className="px-3 py-3">
                    <Skeleton className="h-4 w-4" />
                  </td>
                )}
                {columns.map((column) => (
                  <td key={column.key} className={`px-4 py-3 ${responsive(column)}`}>
                    <Skeleton className="h-4 w-full max-w-[160px]" />
                  </td>
                ))}
              </tr>
            ))}

          {!loading && sortedRows.length === 0 && (
            <tr>
              <td colSpan={colSpan} className="p-4">
                <EmptyState size="compact" bordered={false} title={emptyTitle} description={emptyDescription} action={emptyAction} />
              </td>
            </tr>
          )}

          {!loading &&
            sortedRows.map((row, index) => {
              const key = rowKey(row);
              const checked = selectedSet.has(key);
              const canSelect = !isRowSelectable || isRowSelectable(row);
              return (
                <tr
                  key={key}
                  aria-selected={selectable ? checked : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`border-b border-gray-100 transition-colors last:border-0 dark:border-dark-800 ${
                    checked ? "bg-gray-50 dark:bg-dark-800/60" : ""
                  } ${onRowClick ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-800/60" : ""}`}
                >
                  {selectable && (
                    <td className="px-3 py-3" onClick={(event) => event.stopPropagation()}>
                      <Checkbox aria-label="행 선택" checked={checked} disabled={!canSelect} onChange={() => toggleRow(key)} />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-4 py-3 text-gray-700 dark:text-dark-200 ${alignClass[column.align ?? "left"]} ${responsive(column)} ${column.className ?? ""}`}
                    >
                      {column.render ? column.render(row, index) : String((row as Record<string, unknown>)[column.key] ?? "")}
                    </td>
                  ))}
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
