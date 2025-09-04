'use client'

import React, { useEffect, useRef, useState } from 'react'

interface Props {
  inputType: string
  inputName: string
  inputTitle: string
  getData: (message: string) => void
  value: any | null
  theme: string | null
  placeholder: string | null
}

const TextInput: React.FC<Props> = props => {
  const nameInput = useRef<HTMLInputElement | null>(null)
  const [nameInputText, setNameInputText] = useState<string>()
  useEffect(() => {
    setNameInputText(nameInput.current?.offsetWidth.toString())
  }, [])
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    props?.getData(event.target?.value)
  }

  return (
    <>
      <div className="w-full">
        <div className="relative flex">
          <input
            type={props?.inputType}
            name={props?.inputName}
            id={props?.inputName}
            className={
              'flex-1 text-sm py-4 focus:outline-none w-full px-3 appearance-none focus:ring-0 peer order-1 rounded-r-lg border-t border-b border-r bg-white text-gray-500 border-gray-500 focus:border-gray-500 placeholder-shown:border-slate-300 placeholder-shown:text-slate-400 dark:bg-dark-950 dark:text-dark-500 dark:border-dark-500 dark:focus:border-dark-500 dark:placeholder-shown:border-dark-600 dark:placeholder-shown:text-slate-400' +
              (props.theme === 'light' ? '' : '  ')
            }
            placeholder=" "
            defaultValue={props?.value}
            onChange={handleChange}
          />
          <div
            ref={nameInput}
            className={
              `flex items-center px-3 w-auto min-w-[${nameInputText}px] max-w-32 text-sm order-0 rounded-l-lg border-t border-b border-l  bg-white text-gray-500 peer-focus:text-gray-500 border-gray-500 peer-focus:border-gray-500 peer-placeholder-shown:text-slate-400 peer-placeholder-shown:border-slate-300 dark:bg-dark-950 dark:text-dark-500 dark:peer-focus:text-dark-500 dark:border-dark-500 dark:peer-focus:border-dark-500 dark:peer-placeholder-shown:text-dark-500 dark:peer-placeholder-shown:border-dark-600` +
              (props.theme === 'light' ? ' ' : '  ')
            }
          >
            {props?.inputTitle}
          </div>
          <label
            htmlFor={props.inputName}
            className={`absolute text-sm top-0 px-3 left-4 scale-75 -translate-y-3 duration-300 transform peer-placeholder-shown:top-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-0 peer-placeholder-shown:left-20 origin-[0] peer-focus:top-0 peer-focus:scale-75 peer-focus:-translate-y-3 cursor-text bg-white backdrop-blur-3xl text-gray-500 peer-placeholder-shown:text-slate-400 peer-focus:text-gray-900 dark:bg-dark-950 dark:text-dark-500 dark:peer-placeholder-shown:text-dark-600 dark:peer-focus:text-dark-500`}
          >
            {props?.placeholder}
          </label>
        </div>
      </div>
    </>
  )
}

export default TextInput
