"use client";

import React, { useState, useEffect } from "react";
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
import * as actions from "./categoryAction"; // 서버 액션 경로

export type TreeItem = {
  id: string;
  title: string;
  parentId: string | null;
  order: number;         // 순서
  resourceType: string;  // 리소스 종류 ("post", "store", ...)
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
  const { attributes, listeners, setNodeRef, transform, transition } =
      useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginLeft: level * 20,
  };

  return (
      <div ref={setNodeRef} style={style}>
        <div className="flex items-center gap-2 border rounded px-4 py-2 mb-1 shadow-sm bg-white">
        <span
            {...listeners}
            {...attributes}
            className="mr-2 cursor-grab select-none hover:bg-gray-100 rounded-md"
        >
          <svg viewBox="0 0 20 20" width="12">
            <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
          </svg>
        </span>

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

          {editingId === item.id ? (
              <input
                  autoFocus
                  defaultValue={item.title}
                  className="text-sm border px-1 rounded"
                  onBlur={(e) => onRename(item.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      onRename(item.id, (e.target as HTMLInputElement).value);
                    }
                  }}
              />
          ) : (
              <div
                  className="text-sm cursor-pointer"
                  onDoubleClick={() => onStartEdit(item.id)}
              >
                {item.title}
              </div>
          )}

          <div className="ml-auto flex gap-1 text-xs">
            <button
                onClick={() => onStartEdit(item.id)}
                className="px-1 hover:text-blue-500"
            >
              ✏️
            </button>
            <button
                onClick={() => onAdd(item.id)}
                className="px-1 hover:text-green-500"
            >
              ➕
            </button>
            <button
                onClick={() => onDelete(item.id)}
                className="px-1 hover:text-red-500"
            >
              🗑️
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

  // 서버에서 초기 데이터 로드
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
          const updated = { ...reorderedSiblings[idx], order: idx }; // <- order 재할당
          idx++;
          return updated;
        }
        return i;
      });

      // 서버 저장
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
    const siblings = items.filter(i => i.parentId === parentId);
    const newItem = await actions.addCategory(
        "새 항목",
        parentId,
        "posts"
    );

    // order 계산
    newItem.order = siblings.length;

    setItems((prev) => [...prev, newItem]);
    setEditingId(newItem.id);

    // 서버에 반영
    await actions.saveTree([...items, newItem], "posts");
  };

  const handleDelete = async (id: string) => {
    await actions.deleteCategory(id);
    setItems((prev) => prev.filter((i) => i.id !== id && i.parentId !== id));
  };

  const renderTree = (parentId: string | null, level = 0) => {
    const childrenNodes = items.filter((i) => i.parentId === parentId);

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
                      isCollapsed={isCollapsed}
                      editingId={editingId}
                      onStartEdit={(id) => setEditingId(id)}
                      onRename={handleRename}
                      onAdd={handleAdd}
                      onDelete={handleDelete}
                  />
                  {!isCollapsed && (
                      <motion.div
                          key={node.id}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                      >
                        {renderTree(node.id, level + 1)}
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
        {items.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              아직 항목이 없습니다.
              <button
                  onClick={() => handleAdd(null)}
                  className="ml-2 px-2 py-1 text-sm bg-green-100 rounded hover:bg-green-200"
              >
                ➕ 새 항목 추가
              </button>
            </div>
        ) : (
            renderTree(null)
        )}

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

export const Wrapper: React.FC<{ children: React.ReactNode }> = ({
                                                                   children,
                                                                 }) => (
    <div className="max-w-md mx-auto p-4 bg-gray-50 rounded">{children}</div>
);

const DashboardPostCategories = () => {
  return (
      <Wrapper>
        <SortableTree collapsible />
      </Wrapper>
  );
};

export default DashboardPostCategories;