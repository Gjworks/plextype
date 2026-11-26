'use client'

import React, { forwardRef } from 'react'

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  inputTitle: string
  icon?: React.ReactNode
  getData?: (value: string) => void
  hideLabel?: boolean
  error?: string
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
    readOnly,
    hideLabel = false,
    error,
    ...rest
  } = props

  const inputId = id || name
  const hasError = !!error
  const isLocked = Boolean(disabled || readOnly)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (getData) getData(event.target.value)
    if (props.onChange) props.onChange(event)
  }

  const inputContainerClass =
    'group flex w-full items-center rounded-lg border transition-colors duration-200 ' +
    (disabled
      ? 'cursor-not-allowed border-gray-200 bg-gray-100 opacity-70 dark:border-white/10 dark:bg-white/[0.03] '
      : readOnly
        ? 'cursor-default border-gray-200 bg-gray-100/80 dark:border-white/10 dark:bg-white/[0.03] '
        : hasError
          ? 'border-red-400 bg-white hover:border-red-500 focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-500/15 dark:border-red-400/70 dark:bg-white/[0.09] dark:focus-within:border-red-400 dark:focus-within:ring-red-500/20 '
          : 'border-gray-300 bg-white hover:border-gray-400 focus-within:border-gray-950 focus-within:ring-4 focus-within:ring-gray-950/10 dark:border-white/25 dark:bg-white/[0.09] dark:hover:border-white/40 dark:focus-within:border-white/80 dark:focus-within:ring-white/10 ')

  return (
    <div className="w-full">
      {!hideLabel && (
        <label
          htmlFor={inputId}
          className={`mb-2 block text-sm font-medium ${
            isLocked
              ? 'text-gray-400 dark:text-dark-500'
              : 'text-black dark:text-dark-200'
          }`}
        >
          {inputTitle}
        </label>
      )}

      <div className={inputContainerClass}>
        {icon && (
          <div
            className={`pl-3 pr-2 transition-colors ${
              isLocked
                ? 'text-gray-300 dark:text-dark-500'
                : 'text-gray-400 group-focus-within:text-gray-950 dark:text-dark-400 dark:group-focus-within:text-white'
            }`}
          >
            {icon}
          </div>
        )}

        <input
          {...rest}
          ref={ref}
          type={type}
          id={inputId}
          name={name}
          disabled={disabled}
          readOnly={readOnly}
          onChange={handleChange}
          aria-invalid={hasError}
          aria-describedby={hasError && inputId ? `${inputId}-error` : undefined}
	          className="w-full bg-transparent px-3 py-2.5 text-sm text-black outline-none placeholder:text-gray-400 read-only:cursor-default read-only:text-gray-500 disabled:cursor-not-allowed disabled:text-gray-400 disabled:placeholder:text-gray-300 dark:text-dark-100 dark:placeholder:text-dark-400 dark:read-only:text-dark-400 dark:disabled:text-dark-500"
          placeholder={placeholder || ''}
        />
      </div>

      {error && (
        <div id={inputId ? `${inputId}-error` : undefined} className="mt-1.5 text-xs leading-5 text-red-500">
          {error}
        </div>
      )}
    </div>
  )
})

InputField.displayName = 'InputField'

export default InputField
