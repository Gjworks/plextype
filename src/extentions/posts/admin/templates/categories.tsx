"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import * as actions from "./categoryAction"; // 서버 액션 경로

// --- Icons ---
const IconGrip = () => (
  <svg className="w-4 h-4 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
  </svg>
);
const IconEdit = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
  </svg>
);
const IconPlus = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);
const IconTrash = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);
const IconChevron = ({ isOpen }: { isOpen: boolean }) => (
  <motion.svg
    animate={{ rotate: isOpen ? 90 : 0 }}
    className="w-4 h-4 text-gray-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </motion.svg>
);

export type TreeItem = {
  id: string;
  title: string;
  parentId: string | null;
  order: number;
  resourceType: string;
};

const SortableTreeItem: React.FC<{
  item: TreeItem;
  level: number;
  onCollapse: (id: string) => void;
  hasChildren: boolean;
  isCollapsed: boolean;
  editingId: string | null;
  onStartEdit: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onAdd: (parentId: string | null) => void;
  onDelete: (id: string) => void;
}> = ({
        item,
        level,
        onCollapse,
        hasChildren,
        isCollapsed,
        editingId,
        onStartEdit,
        onRename,
        onAdd,
        onDelete,
      }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginLeft: level * 24, // 들여쓰기 간격 조정
    opacity: isDragging ? 0.3 : 1, // 드래그 시 원본 투명하게
  };

  return (
    <div ref={setNodeRef} style={style} className="group mb-2">
      <div
        className={`flex items-center gap-2 p-2.5 bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-200 hover:border-gray-900 hover:shadow-md ${
          editingId === item.id ? "ring-2 ring-blue-100 border-blue-400" : ""
        }`}
      >
        {/* 드래그 핸들 */}
        <span
          {...listeners}
          {...attributes}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded fill-gray-900"
        >
          <IconGrip />
        </span>

        {/* 접기/펼치기 버튼 (자식 없으면 투명한 공간만 차지) */}
        {hasChildren && (
          <span
            className="p-1 rounded cursor-pointer transition-colors hover:bg-gray-100 text-gray-500"
            onClick={(e) => {
              e.stopPropagation();
              onCollapse(item.id);
            }}
          >
    <IconChevron isOpen={!isCollapsed} />
  </span>
        )}

        {/* 타이틀 또는 입력창 */}
        <div className="flex-1 min-w-0">
          {editingId === item.id ? (
            <input
              autoFocus
              defaultValue={item.title}
              className="w-full text-sm font-medium px-2 py-1 bg-gray-50 border border-blue-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-900"
              onBlur={(e) => onRename(item.id, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onRename(item.id, (e.target as HTMLInputElement).value);
                }
              }}
            />
          ) : (
            <div
              className="text-sm font-medium text-gray-700 truncate cursor-pointer select-none"
              onDoubleClick={() => onStartEdit(item.id)}
            >
              {item.title}
            </div>
          )}
        </div>

        {/* 액션 버튼 그룹 (호버 시에만 표시) */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => onStartEdit(item.id)}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="수정"
          >
            <IconEdit />
          </button>
          <button
            onClick={() => onAdd(item.id)}
            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="하위 항목 추가"
          >
            <IconPlus />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="삭제"
          >
            <IconTrash />
          </button>
        </div>
      </div>
    </div>
  );
};

const SortableTree: React.FC<{ collapsible?: boolean }> = ({ collapsible }) => {
  const [items, setItems] = useState<TreeItem[]>([]);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // 센서 설정 (마우스, 터치, 키보드)
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    actions.fetchCategories("posts").then((data) => setItems(data));
  }, []);

  const handleCollapse = (id: string) => {
    if (!collapsible) return;
    setCollapsedIds((prev) => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  const handleDragStart = (event: any) => setActiveId(event.active.id);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    setItems((prev) => {
      const activeItem = prev.find((i) => i.id === active.id)!;
      const overItem = prev.find((i) => i.id === over.id)!;
      let newItems = [...prev];

      // 부모 변경 로직
      let newParentId: string | null = null;
      const overHasChildren = prev.some((i) => i.parentId === overItem.id);

      if (overItem.parentId === null) {
        newParentId = !overHasChildren && overItem.id !== activeItem.id ? overItem.id : null;
      } else {
        newParentId = overItem.parentId;
      }

      newItems = newItems.map((i) =>
        i.id === activeItem.id ? { ...i, parentId: newParentId } : i
      );

      // 같은 부모 내 순서 조정
      const siblings = newItems.filter((i) => i.parentId === newParentId);
      const oldIndex = siblings.findIndex((i) => i.id === active.id);
      const newIndex = siblings.findIndex((i) => i.id === over.id);
      const reorderedSiblings = arrayMove(siblings, oldIndex, newIndex);

      let idx = 0;
      newItems = newItems.map((i) => {
        if (i.parentId === newParentId) {
          const updated = { ...reorderedSiblings[idx], order: idx };
          idx++;
          return updated;
        }
        return i;
      });

      actions.saveTree(newItems, "posts");
      return newItems;
    });
  };

  const handleRename = async (id: string, newTitle: string) => {
    const updated = await actions.renameCategory(id, newTitle);
    setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
    setEditingId(null);
  };

  const handleAdd = async (parentId: string | null) => {
    const siblings = items.filter((i) => i.parentId === parentId);
    const newItem = await actions.addCategory("새 항목", parentId, "posts");
    newItem.order = siblings.length;
    setItems((prev) => [...prev, newItem]);
    setEditingId(newItem.id);
    await actions.saveTree([...items, newItem], "posts");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까? 하위 항목도 모두 삭제됩니다.")) return;
    await actions.deleteCategory(id);
    setItems((prev) => prev.filter((i) => i.id !== id && i.parentId !== id));
  };

  const renderTree = (parentId: string | null, level = 0) => {
    const childrenNodes = items
      .filter((i) => i.parentId === parentId)
      .sort((a, b) => a.order - b.order); // 순서대로 정렬

    return (
      <SortableContext items={childrenNodes.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col">
          {childrenNodes.map((node) => {
            const childNodes = items.filter((i) => i.parentId === node.id);
            const isCollapsed = collapsedIds.has(node.id);

            return (
              <div key={node.id}>
                <SortableTreeItem
                  item={node}
                  level={level}
                  onCollapse={handleCollapse}
                  hasChildren={childNodes.length > 0}
                  isCollapsed={isCollapsed}
                  editingId={editingId}
                  onStartEdit={(id) => setEditingId(id)}
                  onRename={handleRename}
                  onAdd={handleAdd}
                  onDelete={handleDelete}
                />
                <AnimatePresence>
                  {!isCollapsed && childNodes.length > 0 && (
                    <motion.div
                      key={`children-${node.id}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      {renderTree(node.id, level + 1)}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </SortableContext>
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="bg-gray-50/50 p-6 rounded-2xl border-2 border-dashed border-gray-200 min-h-[400px]">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-3 border-2 border-dashed border-gray-200 rounded-xl">
            <p className="text-sm">생성된 카테고리가 없습니다.</p>
            <button
              onClick={() => handleAdd(null)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <IconPlus /> 첫 번째 카테고리 추가
            </button>
          </div>
        ) : (
          <>
            {/* 최상위 루트 추가 버튼 (선택 사항) */}
            <div className="flex justify-end mb-4">
              <button
                onClick={() => handleAdd(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-all"
              >
                <IconPlus /> 루트 항목 추가
              </button>
            </div>
            {renderTree(null)}
          </>
        )}
      </div>

      {/* 드래그 중일 때 보여지는 모습 (반투명 + 그림자 강조) */}
      <DragOverlay dropAnimation={null}>
        {activeId ? (
          <div className="flex items-center gap-2 p-3 bg-white/90 backdrop-blur-sm border border-blue-400 rounded-xl shadow-xl scale-105 rotate-1 cursor-grabbing">
            <IconGrip />
            <span className="text-sm font-bold text-gray-800">
               {items.find((i) => i.id === activeId)?.title}
             </span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="max-w-2xl mx-auto p-4">{children}</div>
);

const DashboardPostCategories = () => {
  return (
    <Wrapper>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">카테고리 관리</h2>
        <p className="text-sm text-gray-500 mt-1">드래그하여 순서와 구조를 변경할 수 있습니다.</p>
      </div>
      <SortableTree collapsible />
    </Wrapper>
  );
};

export default DashboardPostCategories;