"use client";
import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";

interface DropdownProps {
  state: boolean;
  close: (val: boolean) => void;
  children: React.ReactNode;
  className?: string; // 🌟 외부에서 위치(top, right 등)를 미세조정할 수 있게 추가
}

const Dropdown = ({ state, close, children, className = "right-0 top-[calc(100%+8px)]" }: DropdownProps) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        close(false);
      }
    };
    if (state) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [state, close]);

  const variants: Variants = {
    open: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.2, ease: [0.21, 0.47, 0.32, 0.98] },
    },
    close: {
      opacity: 0,
      y: 8,
      scale: 0.98, // 살짝만 작아지게 변경
      transition: { duration: 0.15 },
    },
  };

  return (
    <AnimatePresence>
      {state && (
        <motion.div
          ref={dropdownRef}
          initial="close"
          animate="open"
          exit="close"
          variants={variants}
          // 🌟 스타일을 최소화했습니다. 'absolute'와 'z-index'만 유지합니다.
          className={`absolute z-[101] ${className}`}
        >
          {/* 이제 여기서 children이 모든 스타일(배경색, 테두리, 그림자 등)을 가집니다. */}
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Dropdown;