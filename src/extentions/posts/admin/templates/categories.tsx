"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// 타입 정의
type TreeItem = {
  id: string;
  title: string;
  parentId: string | null;
};

// 초기 데이터
const initialData: TreeItem[] = [
  { id: "1", title: "폴더 A", parentId: null },
  { id: "2", title: "파일 A1", parentId: "1" },
  { id: "3", title: "파일 A2", parentId: "1" },
  { id: "4", title: "폴더 B", parentId: null },
  { id: "5", title: "파일 B1", parentId: "4" },
  { id: "6", title: "파일 루트", parentId: null },
];

// Sortable 아이템
const SortableTreeItem: React.FC<{
  item: TreeItem;
  level: number;
  onCollapse: (id: string) => void;
  hasChildren: boolean;
  isCollapsed: boolean; // <- 추가
}> = ({ item, level, onCollapse, hasChildren, isCollapsed }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginLeft: level * 20,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-center gap-2 border rounded px-4 py-3 mb-1 shadow-sm bg-white">
        {/* 드래그 아이콘만 listeners 붙이기 */}
        <span
          {...listeners}
          {...attributes}
          className="mr-2 cursor-grab select-none hover:bg-gray-100 rounded-md"
        >
          <svg viewBox="0 0 20 20" width="12">
            <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
          </svg>
        </span>

        {/* 화살표 */}
        {hasChildren && (
          <span
            className="hover:bg-gray-100 rounded-md p-1 text-gray-400 hover:text-gray-700"
            onClick={() => onCollapse(item.id)}
          >
            <motion.svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
              animate={{ rotate: isCollapsed ? 0 : 180 }}
              transition={{ duration: 0.2 }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m19.5 8.25-7.5 7.5-7.5-7.5"
              />
            </motion.svg>
          </span>
        )}
        <div className={`text-sm`}>{item.title}</div>
      </div>
    </div>
  );
};

// SortableTree
const SortableTree: React.FC<{ collapsible?: boolean }> = ({ collapsible }) => {
  const [items, setItems] = useState<TreeItem[]>(initialData);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleCollapse = (id: string) => {
    if (!collapsible) return;
    setCollapsedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
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
        if (!overHasChildren && overItem.id !== activeItem.id) {
          newParentId = overItem.id;
        } else {
          newParentId = null;
        }
      } else {
        newParentId = overItem.parentId;
      }

      newItems = newItems.map((i) =>
        i.id === activeItem.id ? { ...i, parentId: newParentId } : i,
      );

      // 같은 부모 내 순서 조정
      const siblings = newItems.filter((i) => i.parentId === newParentId);
      const oldIndex = siblings.findIndex((i) => i.id === active.id);
      const newIndex = siblings.findIndex((i) => i.id === over.id);
      const reorderedSiblings = arrayMove(siblings, oldIndex, newIndex);

      let idx = 0;
      newItems = newItems.map((i) => {
        if (i.parentId === newParentId) return reorderedSiblings[idx++];
        return i;
      });

      return newItems;
    });
  };

  const renderTree = (parentId: string | null, level = 0) => {
    // 해당 parentId를 가진 아이템 모두 가져오기
    const childrenNodes = items.filter((i) => i.parentId === parentId);

    // 빈 부모라도 SortableContext 유지
    return (
      <SortableContext
        items={childrenNodes.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
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
                isCollapsed={collapsedIds.has(node.id)} // <- 전달
              />

              {/* 상위 AnimatePresence 활용, key 유지 */}
              {!isCollapsed && (
                <motion.div
                  key={node.id}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{
                    height: isCollapsed ? 0 : "auto", // auto 대신 아래 방법 적용
                    opacity: isCollapsed ? 0 : 1,
                  }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <div
                    ref={(el) => {
                      if (el && !isCollapsed) {
                        el.style.height = "auto"; // 실제 높이 적용
                      }
                    }}
                  >
                    {renderTree(node.id, level + 1)}
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}
      </SortableContext>
    );
  };

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {renderTree(null)}
      <DragOverlay>
        {activeId ? (
          <div className="p-2 border border-gray-200 bg-white/10 backdrop-blur-sm rounded shadow">
            {items.find((i) => i.id === activeId)?.title}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

// Wrapper
export const Wrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <div className="max-w-md mx-auto p-4 bg-gray-50 rounded">{children}</div>;

// 실제 사용
const DashboardPostCategories = () => {
  return (
    <>
      <Wrapper>
        <SortableTree collapsible />
      </Wrapper>
    </>
  );
};

export default DashboardPostCategories;
