'use client'

import React, { forwardRef } from 'react'

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  inputTitle: string;
  icon?: React.ReactNode; // 아이콘을 JSX로 직접 받음
  // 기존 props 유지
  getData?: (value: string) => void;
}

// 💡 forwardRef를 사용하여 부모의 useRef와 연결합니다.
const InputField = forwardRef<HTMLInputElement, Props>((props, ref) => {
  const { inputTitle, icon, getData, id, name, type = "text", placeholder, ...rest } = props;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (getData) getData(event.target.value);
    if (props.onChange) props.onChange(event);
  };

  const inputContainerClass =
    "group flex w-full items-center rounded-md border border-gray-200 bg-white shadow-md shadow-gray-100 transition-all duration-200 " +
    "hover:border-gray-300 focus-within:border-gray-300 focus-within:ring-4 focus-within:ring-gray-200/75 " +
    "dark:border-dark-700 dark:bg-dark-900 dark:hover:border-dark-500 dark:focus-within:border-dark-300 dark:focus-within:ring-dark-300";

  return (
    <>
      <label htmlFor={id || name} className="block text-sm text-black dark:text-dark-200 mb-2 font-medium">
        {inputTitle}
      </label>
      <div className={inputContainerClass}>
        {/* 아이콘이 있을 경우에만 렌더링 */}
        {icon && (
          <div className="pl-3 pr-2 text-gray-400 group-focus-within:text-gray-800 dark:text-dark-400 dark:group-focus-within:text-dark-200 transition-colors">
            {icon}
          </div>
        )}
        <input
          {...rest}
          ref={ref} // 💡 전달받은 ref를 실제 input에 연결
          type={type}
          id={id || name}
          name={name}
          onChange={handleChange}
          className="w-full bg-transparent py-2.5 px-3 text-sm text-black outline-none placeholder:text-gray-400 dark:text-white dark:placeholder:text-dark-500"
          placeholder={placeholder || ""}
        />
      </div>
    </>
  )
})

InputField.displayName = "InputField" // 빌드 시 에러 방지용 이름 설정

export default InputField