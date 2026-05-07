'use client'

import React, { forwardRef } from 'react'

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  inputTitle: string
  icon?: React.ReactNode
  getData?: (value: string) => void
}

const InputField = forwardRef<HTMLInputElement, Props>((props, ref) => {
  const {
    inputTitle,
    icon,
    getData,
    id,
    name,
    type = 'text',
    placeholder,
    disabled,
    ...rest
  } = props

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (getData) getData(event.target.value)
    if (props.onChange) props.onChange(event)
  }

  const inputContainerClass =
    'group flex w-full items-center rounded-md border shadow-md transition-all duration-200 ' +
    (disabled
      ? 'cursor-not-allowed border-gray-200 bg-gray-50 shadow-none opacity-70 dark:border-dark-700 dark:bg-dark-800 '
      : 'border-gray-200 bg-white shadow-gray-100 hover:border-gray-300 focus-within:border-gray-300 focus-within:ring-4 focus-within:ring-gray-200/75 dark:border-dark-700 dark:bg-dark-900 dark:hover:border-dark-500 dark:focus-within:border-dark-300 dark:focus-within:ring-dark-300 ')

  return (
    <>
      <label
        htmlFor={id || name}
        className={`mb-2 block text-sm font-medium ${
          disabled
            ? 'text-gray-400 dark:text-dark-500'
            : 'text-black dark:text-dark-200'
        }`}
      >
        {inputTitle}
      </label>

      <div className={inputContainerClass}>
        {icon && (
          <div
            className={`pl-3 pr-2 transition-colors ${
              disabled
                ? 'text-gray-300 dark:text-dark-500'
                : 'text-gray-400 group-focus-within:text-gray-800 dark:text-dark-400 dark:group-focus-within:text-dark-200'
            }`}
          >
            {icon}
          </div>
        )}

        <input
          {...rest}
          ref={ref}
          type={type}
          id={id || name}
          name={name}
          disabled={disabled}
          onChange={handleChange}
          className="w-full bg-transparent px-3 py-2.5 text-sm text-black outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:text-gray-400 disabled:placeholder:text-gray-300 dark:text-white dark:placeholder:text-dark-500 dark:disabled:text-dark-500"
          placeholder={placeholder || ''}
        />
      </div>
    </>
  )
})

InputField.displayName = 'InputField'

export default InputField