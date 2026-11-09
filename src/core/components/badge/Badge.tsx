import React from "react";

export type BadgeTone = "gray" | "blue" | "green" | "amber" | "red" | "violet";

interface Props {
  children: React.ReactNode;
  tone?: BadgeTone;
  // soft는 연한 배경, outline은 테두리만, solid는 진한 배경이다.
  variant?: "soft" | "outline" | "solid";
  size?: "sm" | "md";
  // 앞에 작은 점을 붙인다. 상태(진행 중, 실패)를 표시할 때 쓴다.
  dot?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

const TONES: Record<BadgeTone, { soft: string; outline: string; solid: string; dot: string }> = {
  gray: {
    soft: "bg-gray-100 text-gray-700 dark:bg-dark-800 dark:text-dark-200",
    outline: "border-gray-300 text-gray-700 dark:border-dark-600 dark:text-dark-200",
    solid: "bg-gray-900 text-white dark:bg-white dark:text-gray-950",
    dot: "bg-gray-400",
  },
  blue: {
    soft: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
    outline: "border-blue-300 text-blue-700 dark:border-blue-500/50 dark:text-blue-300",
    solid: "bg-blue-600 text-white",
    dot: "bg-blue-500",
  },
  green: {
    soft: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    outline: "border-emerald-300 text-emerald-700 dark:border-emerald-500/50 dark:text-emerald-300",
    solid: "bg-emerald-600 text-white",
    dot: "bg-emerald-500",
  },
  amber: {
    soft: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    outline: "border-amber-300 text-amber-700 dark:border-amber-500/50 dark:text-amber-300",
    solid: "bg-amber-500 text-white",
    dot: "bg-amber-500",
  },
  red: {
    soft: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
    outline: "border-red-300 text-red-700 dark:border-red-500/50 dark:text-red-300",
    solid: "bg-red-600 text-white",
    dot: "bg-red-500",
  },
  violet: {
    soft: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
    outline: "border-violet-300 text-violet-700 dark:border-violet-500/50 dark:text-violet-300",
    solid: "bg-violet-600 text-white",
    dot: "bg-violet-500",
  },
};

/**
 * 상태·분류를 짧게 표시하는 라벨. 상태별 색은 화면마다 정하지 말고 tone 규칙을 따른다.
 * gray: 대기·기본, blue: 진행 중, green: 완료·정상, amber: 주의·검토 필요, red: 실패·위험, violet: 강조·특수.
 */
const Badge = ({ children, tone = "gray", variant = "soft", size = "sm", dot = false, icon, className = "" }: Props) => {
  const toneClass = TONES[tone];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full font-medium ${
        size === "sm" ? "px-2 py-0.5 text-[11px] leading-4" : "px-2.5 py-1 text-xs"
      } ${variant === "outline" ? `border ${toneClass.outline}` : variant === "solid" ? toneClass.solid : toneClass.soft} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${variant === "solid" ? "bg-current" : toneClass.dot}`} />}
      {icon}
      {children}
    </span>
  );
};

export default Badge;
