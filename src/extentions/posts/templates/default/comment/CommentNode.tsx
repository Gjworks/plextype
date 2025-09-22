"use client";

import { CommentType } from "./list"; // 타입 import 경로 맞게 수정
import React from "react";

interface CommentNodeProps {
  comment: CommentType & { children?: CommentType[] };
}

export default function CommentNode({ comment }: CommentNodeProps) {
  return (
    <div className="border-l pl-4 mb-2">
      <div className="p-2 bg-gray-50 rounded">
        <strong>{comment.user?.nickName ?? "익명"}</strong>
        <p>{comment.content}</p>
        <small>{new Date(comment.createdAt).toLocaleString()}</small>
      </div>

      {comment.children && comment.children.length > 0 && (
        <div className="ml-4 mt-2">
          {comment.children.map((child) => (
            <CommentNode key={child.id} comment={child} />
          ))}
        </div>
      )}
    </div>
  );
}