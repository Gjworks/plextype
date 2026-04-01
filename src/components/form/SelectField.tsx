'use client'

import React, { forwardRef } from 'react'

interface SelectOption {
  id: string | number;
  title: string;
}

interface Props extends React.SelectHTMLAttributes<HTMLSelectElement> {
  inputTitle: string;
  icon?: React.ReactNode;
  options: SelectOption[];
}

const SelectField = forwardRef<HTMLSelectElement, Props>((props, ref) => {
  const { inputTitle, icon, options, id, name, defaultValue, ...rest } = props;

  const containerClass =
    "group flex w-full items-center rounded-md border border-gray-200 bg-white shadow-md shadow-gray-100 transition-all duration-200 " +
    "hover:border-gray-300 focus-within:border-gray-300 focus-within:ring-4 focus-within:ring-gray-200/75 " +
    "dark:border-dark-700 dark:bg-dark-900 dark:hover:border-dark-500 dark:focus-within:border-dark-300 dark:focus-within:ring-dark-300";

  return (
    <div className="w-full">
      <label htmlFor={id || name} className="block text-sm text-black dark:text-dark-200 mb-2 font-medium">
        {inputTitle}
      </label>

      <div className={containerClass}>
        {/* 왼쪽 아이콘 (있을 경우) */}
        {icon && (
          <div className="pl-3 text-gray-400 group-focus-within:text-gray-800 dark:text-dark-400 dark:group-focus-within:text-dark-200 transition-colors">
            {icon}
          </div>
        )}

        <div className="relative flex-1">
          <select
            {...rest}
            ref={ref}
            id={id || name}
            name={name}
            defaultValue={defaultValue}
            className="w-full appearance-none bg-transparent py-2.5 pl-3 pr-10 text-sm text-black outline-none dark:text-white cursor-pointer"
          >
            <option value="" disabled className="dark:bg-dark-900">카테고리 선택</option>
            {options.map((opt) => (
              <option key={opt.id} value={opt.id} className="dark:bg-dark-900">
                {opt.title}
              </option>
            ))}
          </select>

          {/* 오른쪽 커스텀 화살표 아이콘 */}
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 group-focus-within:text-gray-800 dark:text-dark-400">
            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
})

SelectField.displayName = "SelectField"

export default SelectField