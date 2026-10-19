"use client";
import React, { useState } from "react";

export const settingsPrimaryButtonClass =
  "border-primary-500/25 bg-white text-primary-600 ring-4 ring-primary-500/5 hover:border-primary-500/30 hover:bg-primary-500/5 hover:text-primary-600 hover:ring-primary-500/10 active:bg-primary-500/10 disabled:border-gray-200 disabled:bg-white disabled:text-gray-300 disabled:ring-transparent dark:border-primary-400/25 dark:bg-dark-900 dark:text-primary-300 dark:ring-primary-400/10 dark:hover:bg-primary-400/10 dark:active:bg-primary-400/15 dark:disabled:border-dark-800 dark:disabled:bg-dark-900 dark:disabled:text-dark-600";

export const settingsGhostButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-xs font-medium text-gray-600 transition-all duration-200 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-950 hover:ring-4 hover:ring-gray-100/70 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-700 dark:bg-dark-900 dark:text-dark-300 dark:hover:border-dark-600 dark:hover:bg-dark-800 dark:hover:text-dark-100 dark:hover:ring-dark-800/35";

export const settingsDarkButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-950 bg-gray-950 px-4 text-xs font-medium text-white ring-4 ring-gray-950/5 transition-all duration-200 hover:bg-gray-800 hover:ring-gray-950/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-100 dark:bg-dark-100 dark:text-gray-950 dark:ring-white/10 dark:hover:bg-white dark:hover:ring-white/15";

export const settingsIconButtonClass =
  "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-all duration-200 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-950 hover:ring-4 hover:ring-gray-100/70 dark:border-dark-700 dark:bg-dark-900 dark:text-dark-300 dark:hover:border-dark-600 dark:hover:bg-dark-800 dark:hover:text-dark-100 dark:hover:ring-dark-800/35";

export const selectClass =
  "w-full rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition-colors hover:border-gray-300 focus:border-gray-400 dark:border-dark-700 dark:bg-dark-900 dark:text-dark-100 dark:hover:border-dark-600";

export const textareaClass =
  "w-full resize-y rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm leading-6 text-gray-700 outline-none transition-colors placeholder:text-gray-400 hover:border-gray-300 focus:border-gray-400 dark:border-dark-700 dark:bg-dark-900 dark:text-dark-100 dark:placeholder:text-dark-500";

export const StatusPill = ({ ok, label }: { ok: boolean; label: string }) => {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${ok ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-gray-100 text-gray-500 dark:bg-dark-800 dark:text-dark-400"}`}
    >
      {label}
    </span>
  );
};

export const SectionShell = ({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) => {
  return (
    <section className="grid grid-cols-4 gap-8 border-t border-gray-200 py-10 first:border-t-0 dark:border-dark-800">
      <div className="col-span-4 lg:col-span-1">
        <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-gray-400">
          {icon}
          Settings
        </div>
        <div className="mt-3 text-lg font-semibold text-gray-600 dark:text-dark-100">
          {title}
        </div>
        {description && (
          <div className="mt-2 text-sm leading-6 text-gray-400">
            {description}
          </div>
        )}
      </div>
      <div className="col-span-4 lg:col-span-3">
        <div className="grid gap-4">{children}</div>
      </div>
    </section>
  );
};

export const FieldRow = ({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="rounded-md p-5 transition-colors hover:bg-gray-50 dark:hover:bg-dark-900">
      <div className="mb-4">
        <div className="text-sm font-medium text-black dark:text-dark-100">
          {label}
        </div>
        {description && (
          <div className="mt-1 text-[13px] leading-6 text-gray-400">
            {description}
          </div>
        )}
      </div>
      <div className="w-full">{children}</div>
    </div>
  );
};

export const InlineField = ({
  title,
  description,
  settingKey,
  children,
}: {
  title: string;
  description: string;
  settingKey?: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="rounded-md p-5 transition-colors hover:bg-gray-50 dark:hover:bg-dark-900">
      <div className="mb-3 min-h-[58px]">
        <div className="text-xs font-semibold text-gray-700 dark:text-dark-100">
          {title}
        </div>
        <div className="mt-1 text-[13px] leading-6 text-gray-400">
          {description}
        </div>
        {settingKey && (
          <div className="mt-2 inline-flex rounded bg-gray-100 px-2 py-0.5 font-mono text-[10px] font-medium text-gray-400 dark:bg-dark-800">
            {settingKey}
          </div>
        )}
      </div>
      {children}
    </div>
  );
};

export const Toggle = ({
  name,
  checked,
  defaultChecked = false,
  onChange,
}: {
  name?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
}) => {
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isControlled = typeof checked === "boolean";
  const active = isControlled ? checked : internalChecked;
  const handleClick = () => {
    const next = !active;
    if (!isControlled) setInternalChecked(next);
    onChange?.(next);
  };

  return (
    <>
      {name && active && <input type="hidden" name={name} value="true" />}
      <button
        type="button"
        onClick={handleClick}
        className="relative block h-6 w-11 min-w-11 shrink-0 cursor-pointer rounded-full bg-gray-200 transition-colors data-[checked=true]:bg-primary-500 dark:bg-dark-700 dark:data-[checked=true]:bg-primary-400"
        data-checked={active}
        aria-pressed={active}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform ${
            active ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </>
  );
};
