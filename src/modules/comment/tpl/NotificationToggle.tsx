"use client";

import { motion } from "framer-motion";

interface NotificationToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

const NotificationToggle = ({ checked, onChange, label }: NotificationToggleProps) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="group inline-flex items-center gap-2 rounded-full text-[11px] font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-dark-400 dark:hover:text-dark-100"
    >
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-all duration-200 ${
          checked
            ? "bg-primary-500 shadow-sm shadow-primary-500/20 dark:bg-primary-400"
            : "bg-gray-200 group-hover:bg-gray-300 dark:bg-dark-700 dark:group-hover:bg-dark-600"
        }`}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 520, damping: 34 }}
          className={`h-4 w-4 rounded-full bg-white shadow-sm ${
            checked ? "translate-x-4 dark:bg-dark-950" : "translate-x-0"
          }`}
        />
      </span>
      <span>{label}</span>
    </button>
  );
};

export default NotificationToggle;
