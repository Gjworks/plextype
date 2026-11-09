import React from "react";

interface Props {
  className?: string;
  // circle은 아바타 자리처럼 둥글게, text는 글줄 높이로 그린다.
  variant?: "block" | "text" | "circle";
  // text일 때 그릴 줄 수. 마지막 줄은 짧게 그려 문단처럼 보이게 한다.
  lines?: number;
}

/**
 * 내용이 들어올 자리를 미리 회색 블록으로 보여준다. 크기는 className(h-, w-)으로 정한다.
 * 깜빡임 애니메이션은 prefers-reduced-motion일 때 끈다.
 */
const Skeleton = ({ className = "", variant = "block", lines = 3 }: Props) => {
  const base = "animate-pulse bg-gray-200/80 motion-reduce:animate-none dark:bg-dark-800";

  if (variant === "text") {
    return (
      <div className={`grid gap-2 ${className}`} aria-hidden="true">
        {Array.from({ length: lines }, (_, index) => (
          <div key={index} className={`h-3.5 rounded ${base} ${index === lines - 1 && lines > 1 ? "w-3/5" : "w-full"}`} />
        ))}
      </div>
    );
  }

  return <div aria-hidden="true" className={`${base} ${variant === "circle" ? "rounded-full" : "rounded-md"} ${className}`} />;
};

export default Skeleton;
