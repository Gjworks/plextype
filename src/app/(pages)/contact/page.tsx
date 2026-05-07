'use client'

import React, { useState } from 'react'
import { useUserContext } from '@/core/providers/UserProvider'
import {
  Mail,
  Phone,
  Send,
  User,
  FileText,
  MessageSquareText,
  Clock,
  LockKeyhole
} from 'lucide-react'
import { z } from 'zod'
import { motion, Variants } from 'framer-motion'
import InputField from '@/core/components/form/InputField'
import Button from '@/core/components/button/Button'
import { saveDocument } from '@/modules/document/actions/document.action'

const containerVariants:Variants = {
  hidden: {
    opacity: 0,
  },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
}

const itemVariants:Variants = {
  hidden: {
    opacity: 0,
    y: 18,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 120,
      damping: 18,
    },
  },
}

const cardVariants:Variants = {
  hidden: {
    opacity: 0,
    y: 28,
    scale: 0.98,
  },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 110,
      damping: 20,
    },
  },
}

const ContactFormSchema = z.object({
  name: z.string().trim().min(1, '이름을 입력해주세요.'),
  email: z.string().trim().min(1, '이메일을 입력해주세요.').email('올바른 이메일을 입력해주세요.'),
  phone: z.string().trim().optional(),
  subject: z.string().trim().min(1, '문의 제목을 입력해주세요.'),
  message: z.string().trim().min(1, '문의 내용을 입력해주세요.'),
})

const ContactUsPage = () => {
  const { user, isLoading } = useUserContext()
  const isGuest = !isLoading && !user
  const formDisabled = isLoading || isGuest
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target

    setForm(prev => ({
      ...prev,
      [name]: value,
    }))

    setErrors(prev => {
      if (!prev[name]) return prev

      const next = { ...prev }
      delete next[name]
      return next
    })
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      alert('로그인 후 문의를 남길 수 있습니다.')
      return
    }

    const validation = ContactFormSchema.safeParse(form)

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {}

      validation.error.issues.forEach(issue => {
        const field = issue.path[0]

        if (typeof field === 'string' && !fieldErrors[field]) {
          fieldErrors[field] = issue.message
        }
      })

      setErrors(fieldErrors)
      return
    }

    setErrors({})

    const values = validation.data

    const formData = new FormData()

    formData.append('title', values.subject)
    formData.append('content', values.message)

    formData.append('isNotice', 'false')
    formData.append('isSecrets', 'true')

    formData.append('extraData__name', values.name)
    formData.append('extraData__email', values.email)
    formData.append('extraData__phone', values.phone || '')
    formData.append('extraData__subject', values.subject)

    const result = await saveDocument('contact', formData, '/contact')

    if (!result.success) {
      alert(result.message || '문의 접수에 실패했습니다.')
      return
    }

    alert('문의가 접수되었습니다.')

    setForm({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
    })
  }


  return (
    <div className="min-h-screen overflow-hidden bg-white px-4 py-16 text-gray-950 md:px-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-4xl"
      >
        <section className="text-center">
          <motion.div
            variants={itemVariants}
            whileHover={{
              rotate: -4,
              scale: 1.05,
            }}
            whileTap={{
              scale: 0.96,
            }}
            className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-950 text-white shadow-xl shadow-gray-200"
          >
            <MessageSquareText size={24} />
          </motion.div>

          <motion.p
            variants={itemVariants}
            className="mb-4 text-[11px] font-black uppercase tracking-[0.28em] text-primary-600"
          >
            Contact Us
          </motion.p>

          <motion.h1
            variants={itemVariants}
            className="text-4xl font-black tracking-tight text-gray-950 md:text-6xl"
          >
            무엇을 도와드릴까요?
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-gray-500 md:text-base"
          >
            서비스 이용, 기술 지원, 제휴 문의, 기타 요청사항을 남겨주세요.
            확인 후 순차적으로 답변드리겠습니다.
          </motion.p>
        </section>

        <motion.section
          variants={cardVariants}
          className="mt-12 rounded-[32px] border border-gray-200 bg-[#fafafa] p-4 shadow-[0_30px_80px_rgba(15,23,42,0.08)] md:p-6"
        >

          <motion.form
            onSubmit={handleSubmit}
            variants={containerVariants}
            className="rounded-[26px] border border-gray-200 bg-white p-5 md:p-8"
          >
            <motion.div
              variants={itemVariants}
              className="mb-8 flex flex-col gap-3 border-b border-gray-100 pb-6 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <h2 className="text-xl font-black text-gray-950">
                  문의 작성
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  답변을 받을 수 있는 정보를 함께 입력해주세요.
                </p>

                {isGuest && (
                  <motion.div
                    variants={itemVariants}
                    className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-2 text-[12px] font-medium text-rose-700"
                  >
                    <LockKeyhole size={16} />
                    문의 작성은 로그인한 회원만 가능합니다.
                  </motion.div>
                )}
              </div>

              <motion.div
                whileHover={{
                  y: -2,
                  scale: 1.02,
                }}
                className="inline-flex w-fit items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-xs font-bold text-orange-600"
              >
                <Clock size={14} />
                평일 1~2일 이내 답변
              </motion.div>
            </motion.div>

            <motion.div
              variants={containerVariants}
              className="grid gap-5 md:grid-cols-2"
            >
              <motion.div variants={itemVariants}>
                <InputField
                  inputTitle="이름"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="이름을 입력해주세요"
                  icon={<User size={16} />}
                  disabled={formDisabled}
                />
                {errors.name && (
                  <p className="mt-1.5 text-xs font-medium text-red-500">
                    {errors.name}
                  </p>
                )}
              </motion.div>

              <motion.div variants={itemVariants}>
                <InputField
                  inputTitle="이메일"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="email@example.com"
                  icon={<Mail size={16} />}
                  disabled={formDisabled}
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs font-medium text-red-500">
                    {errors.email}
                  </p>
                )}
              </motion.div>

              <motion.div variants={itemVariants}>
                <InputField
                  inputTitle="연락처"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="010-0000-0000"
                  icon={<Phone size={16} />}
                  disabled={formDisabled}
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <InputField
                  inputTitle="문의 제목"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="문의 제목을 입력해주세요"
                  icon={<FileText size={16} />}
                  disabled={formDisabled}
                />
              </motion.div>
            </motion.div>

            <motion.div variants={itemVariants} className="mt-5">
              <label className="mb-2 block text-sm font-medium text-black">
                문의 내용
              </label>

              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                rows={8}
                disabled={formDisabled}
                placeholder={
                  isGuest
                    ? '로그인 후 문의 내용을 입력할 수 있습니다.'
                    : '문의하실 내용을 자세히 입력해주세요.'
                }
                className="w-full resize-none rounded-md border border-gray-200 bg-white px-4 py-3 text-sm text-black shadow-md shadow-gray-100 outline-none transition-all duration-200 placeholder:text-gray-400 hover:border-gray-300 focus:border-gray-300 focus:ring-4 focus:ring-gray-200/75"
              />
              {errors.message && (
                <p className="mt-1.5 text-xs font-medium text-red-500">
                  {errors.message}
                </p>
              )}
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="mt-8 flex flex-col gap-4 border-t border-gray-100 pt-6 md:flex-row md:items-center md:justify-between"
            >
              <p className="text-xs leading-5 text-gray-400">
                입력하신 정보는 문의 답변 목적으로만 사용됩니다.
              </p>

              <Button
                type="submit"
                disabled={formDisabled}
                icon={
                  <motion.span
                    animate={
                      formDisabled
                        ? { x: 0 }
                        : {
                          x: [0, 3, 0],
                        }
                    }
                    transition={{
                      duration: 1.4,
                      repeat: formDisabled ? 0 : Infinity,
                      ease: 'easeInOut',
                    }}
                    className="flex items-center"
                  >
                    {isGuest ? <LockKeyhole size={15} /> : <Send size={15} />}
                  </motion.span>
                }
                className="rounded-2xl bg-gray-950 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-gray-300 hover:bg-black hover:text-white disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
              >
                {isLoading ? '확인 중...' : isGuest ? '로그인 후 문의 가능' : '문의 보내기'}
              </Button>
            </motion.div>
          </motion.form>
        </motion.section>
      </motion.div>
    </div>
  )
}

export default ContactUsPage