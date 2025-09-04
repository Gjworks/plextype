'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { OutputData } from '@editorjs/editorjs'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'

import TextInput from '@plextype/components/form/TextInput'

// const loadDocumentEdit = async () => {
//   const result = fetch
//     .post('/api/posts/Edit', {
//       method: 'POST',
//       body: {
//         // mid : query.mid,
//         userId: 1,
//         title: '23',
//         description: 'ddd',
//       },
//       headers: {
//         'Content-Type': 'application/json',
//       },
//     })
//     .then(res => {
//       console.log(res)
//     })
//     .catch(error => {
//       return error.response
//     })
//   console.log(result)
//   return result
// }
const Editorjs = dynamic(() => import('@plextype/components/editor/Editorjs'), {
  ssr: false,
})
const Edit = props => {
  const router = usePathname()
  const [data, setData] = useState<OutputData>()
  const [inputs, setInputs] = useState<{ [key: string]: any }>()
  const [editorInstance, setEditorInstance] = useState({})
  // const  query  = router.query;
  // console.log(query)
  useEffect(() => {
    async function fetchEdit() {
      console.log(data)
      // setEditInfo(data);
    }
    fetchEdit()
  }, [])
  const onChange = e => {
    const { value, name } = e.target // 우선 e.target 에서 name 과 value 를 추출
    setInputs({
      ...inputs, // 기존의 input 객체를 복사한 뒤
      [name]: value, // name 키를 가진 값을 value 로 설정
    })
  }

  const getData = () => {}
  // 에디터에 있는 글을 가져오기 위함

  const handleDocumentSubmit = e => {
    e.preventDefault()
    console.log(data)
  }

  return (
    <>
      <div className="">
        <div className="max-w-screen-lg mx-auto px-3 py-16 lg:py-20">
          <div className="flex justify-center">
            <div className="w-full mx-auto">
              <motion.div
                className="mb-8 max-w-5xl"
                initial={{ opacity: 0, y: '20%' }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
              >
                <div className="space-y-4">
                  <div className="flex text-primary-400">
                    <div className="flex items-center pr-3">
                      <select className="bg-dark-700 border border-dark-500 text-dark-400 outline-none focus:border-primary-400 mb-3 w-full">
                        <option value="">분류</option>
                        <option value="">Developer</option>
                        <option value="">분류</option>
                        <option value="">분류</option>
                      </select>
                    </div>
                  </div>
                  <h1 className="">
                    {/* <input
                      type="text"
                      name="title"
                      defaultValue=""
                      placeholder="제목을 입력해주세요."
                      className="text-white dark:bg-transparent font-light text-3xl w-full bg-transparent border-b border-dark-700 focus:border-dark-500 outline-none p-3"
                      onChange={onChange}
                      required
                    /> */}
                  </h1>
                  <div>
                    <TextInput
                      inputType="text"
                      inputName="title"
                      inputTitle="제목"
                      placeholder="제목을 입력하세요."
                      getData={getData}
                      theme="dark"
                      value=""
                    ></TextInput>
                  </div>
                </div>
              </motion.div>
              <div className="grid grid-cols-12 lg:gap-16 xl:gap-8 max-w-5xl">
                <motion.div
                  className="col-span-12 lg:col-span-12 xl:col-span-12 text-gray-600 text-base leading-7"
                  initial={{ opacity: 0, y: '20%' }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.8 } }}
                >
                  <Editorjs
                    data={data}
                    onChange={setData}
                    holder="editorjs-container"
                  />
                  <div className="pt-8 border-t border-dark-700">
                    <div className="col-span-2 flex justify-end gap-2">
                      <button
                        onClick={event => console.log(event)}
                        className="bg-gray-50 rounded-sm px-8 py-2 border border-gray-300 text-gray-400 text-sm hover:text-gray-600 hover:bg-gray-100 w-full lg:w-auto"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleDocumentSubmit}
                        className="rounded-sm px-8 py-2 border border-primary-600 bg-primary-600 text-primary-100 text-sm hover:text-white hover:bg-primary-500 w-full lg:w-auto"
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Edit
