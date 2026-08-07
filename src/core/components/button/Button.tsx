"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children?: React.ReactNode;
  isLoading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button = ({
                  isLoading = false,
                  icon,
                  fullWidth = false,
                  children,
                  className = "",
                  disabled,
                  type = "button",
                  ...props
                }: ButtonProps) => {

  const baseClasses = "relative inline-flex min-h-10 transform-gpu items-center justify-center overflow-hidden rounded-xl border px-5 py-2 text-xs font-medium outline-none transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-gray-100/80 disabled:cursor-not-allowed disabled:ring-0 dark:focus-visible:ring-dark-800/45 cursor-pointer";
  const themeClasses = "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-950 hover:ring-4 hover:ring-gray-100/70 disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400 dark:border-dark-700 dark:bg-dark-900 dark:text-dark-300 dark:hover:border-dark-600 dark:hover:bg-dark-800 dark:hover:text-dark-100 dark:hover:ring-dark-800/35 dark:disabled:border-dark-800 dark:disabled:bg-dark-900 dark:disabled:text-dark-600";
  const widthClass = fullWidth ? "w-full" : "w-auto";

  return (
    <motion.button
      type={type}
      disabled={isLoading || disabled}

      initial={{ scale: 1 }}
      whileHover={disabled || isLoading ? { scale: 1, y: 0 } : { scale: 1.01, y: -1 }}
      whileTap={disabled || isLoading ? { scale: 1, y: 0 } : { scale: 0.97, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 520,
        damping: 30,
        mass: 0.55,
      }}

      className={`${baseClasses} ${themeClasses} ${widthClass} ${className}`}
      {...props}
    >
      <div className="flex items-center justify-center gap-2">
        {isLoading ? (
          <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin"></span>
        ) : (
          <>
            {icon && <span className="flex items-center shrink-0">{icon}</span>}
            {children && <span className="truncate">{children}</span>}
          </>
        )}
      </div>
    </motion.button>
  );
};

export default Button;
