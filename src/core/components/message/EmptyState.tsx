import React from "react";
import { Inbox } from "lucide-react";

interface Props {
  title: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  // 버튼이나 링크. 목록이 비었을 때 바로 할 수 있는 다음 행동(등록하기, 필터 초기화)을 넣는다.
  action?: React.ReactNode;
  // compact는 표·카드 안처럼 좁은 자리, default는 페이지 한가운데에 쓴다.
  size?: "default" | "compact";
  // false면 점선 테두리 없이 내용만 보여준다. 이미 테두리가 있는 카드 안에 넣을 때 쓴다.
  bordered?: boolean;
  className?: string;
}

/**
 * 목록·검색 결과가 비었을 때 보여주는 안내. 서버 컴포넌트에서도 쓸 수 있다.
 */
const EmptyState = ({ title, description, icon, action, size = "default", bordered = true, className = "" }: Props) => {
  const compact = size === "compact";
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${compact ? "gap-2 px-4 py-8" : "gap-3 px-6 py-14"} ${
        bordered ? "rounded-lg border border-dashed border-gray-200 dark:border-dark-700" : ""
      } ${className}`}
    >
      <div
        className={`flex items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-dark-800 dark:text-dark-400 ${
          compact ? "h-9 w-9" : "h-12 w-12"
        }`}
      >
        {icon ?? <Inbox size={compact ? 16 : 20} />}
      </div>
      <div className={`font-semibold text-gray-900 dark:text-white ${compact ? "text-sm" : "text-base"}`}>{title}</div>
      {description && (
        <div className={`max-w-md leading-6 text-gray-500 dark:text-dark-300 ${compact ? "text-xs" : "text-sm"}`}>{description}</div>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};

export default EmptyState;
