"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Bell, Check, FileText, LayoutDashboard, ShieldCheck, Users } from "lucide-react";
import { useState } from "react";

const workflows = [
  { key: "content", label: "콘텐츠", icon: FileText, eyebrow: "Content workflow", title: "아이디어부터 발행까지 한 흐름으로", description: "게시판, 카테고리, 첨부파일을 한곳에서 정리하고 필요한 권한만 간단하게 설정하세요.", stats: [{ label: "이번 주 발행", value: "24" }, { label: "검토 중", value: "08" }, { label: "완료율", value: "92%" }] },
  { key: "people", label: "사용자", icon: Users, eyebrow: "People & access", title: "사람과 권한을 명확하게 관리", description: "회원, 그룹, 관리자 권한을 서비스 운영 방식에 맞춰 유연하고 안전하게 구성하세요.", stats: [{ label: "활성 사용자", value: "1,284" }, { label: "신규 가입", value: "+48" }, { label: "승인 대기", value: "03" }] },
  { key: "notify", label: "알림", icon: Bell, eyebrow: "Smart notifications", title: "중요한 순간을 놓치지 않도록", description: "실시간 알림과 Web Push를 통해 필요한 소식을 적절한 사용자에게 빠르게 전달하세요.", stats: [{ label: "오늘 전송", value: "356" }, { label: "도달률", value: "98%" }, { label: "읽지 않음", value: "12" }] },
];

const benefits = [
  { icon: LayoutDashboard, title: "한눈에 보이는 운영", description: "복잡한 설정과 데이터를 명확한 화면에서 빠르게 파악합니다." },
  { icon: ShieldCheck, title: "기본부터 안전하게", description: "인증과 권한 검증을 서버 중심으로 처리해 운영 위험을 줄입니다." },
  { icon: Users, title: "성장에 맞춘 확장", description: "코어를 건드리지 않고 필요한 기능만 독립적으로 확장합니다." },
];

const DefaultHomePage = () => {
  const [activeWorkflow, setActiveWorkflow] = useState(workflows[0]);

  return (
    <>
      <section className="relative overflow-hidden bg-white px-5 pb-20 pt-20 dark:bg-[#07120e] lg:px-8 lg:pb-28 lg:pt-28">
        <div className="relative mx-auto max-w-7xl text-center">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto inline-flex items-center gap-2 rounded-full border border-[#0a3d2d]/12 bg-[#f3f9f6] px-4 py-2 text-xs font-semibold text-[#0a3d2d] dark:border-white/10 dark:bg-white/5 dark:text-[#a9e8c9]">
            <span className="studio-status-dot h-2 w-2 rounded-full bg-[#19a873]" />새로운 디지털 운영 경험
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.6 }} className="mx-auto !mb-0 mt-7 max-w-4xl !text-[clamp(2.8rem,6.2vw,5.6rem)] font-semibold !leading-[1.02] tracking-[-0.07em] text-[#0a3d2d] dark:text-white">운영은 단순하게,<br />경험은 더 선명하게.</motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.6 }} className="mx-auto mt-7 max-w-2xl text-base leading-7 text-[#60756c] dark:text-[#a9b9b1] sm:text-lg">콘텐츠, 회원, 알림과 관리 기능을 하나의 안정적인 플랫폼에서 운영하세요. 프로젝트에 필요한 기능은 자유롭게 확장할 수 있습니다.</motion.p>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/auth/register" className="group flex items-center gap-2 rounded-xl bg-[#0a3d2d] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(10,61,45,0.2)] transition-all hover:-translate-y-1 hover:bg-[#125841] hover:shadow-[0_18px_40px_rgba(10,61,45,0.28)]">무료로 시작하기 <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></Link>
            <Link href="/posts/notice" className="rounded-xl border border-[#0a3d2d]/15 bg-white px-6 py-3.5 text-sm font-semibold text-[#0a3d2d] transition-colors hover:bg-[#f0f7f3] dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">둘러보기</Link>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 45 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.75, ease: [0.22, 1, 0.36, 1] }} className="relative mx-auto mt-16 max-w-6xl rounded-[2rem] border border-[#0a3d2d]/10 bg-[#f7faf8] p-3 shadow-[0_35px_90px_rgba(10,61,45,0.13)] dark:border-white/10 dark:bg-[#0c1c15] sm:p-5">
          <div className="overflow-hidden rounded-[1.35rem] border border-[#0a3d2d]/10 bg-white dark:border-white/10 dark:bg-[#0a1711]">
            <div className="flex flex-col border-b border-[#0a3d2d]/10 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
              <div className="flex items-center gap-2 px-2 py-2 text-sm font-semibold"><LayoutDashboard size={17} /> Workspace</div>
              <div className="flex gap-1 rounded-xl bg-[#edf5f1] p-1 dark:bg-white/5">
                {workflows.map((workflow) => {
                  const Icon = workflow.icon;
                  const isActive = activeWorkflow.key === workflow.key;
                  return <button key={workflow.key} type="button" onClick={() => setActiveWorkflow(workflow)} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all sm:px-4 ${isActive ? "bg-white text-[#0a3d2d] shadow-sm dark:bg-[#17392b] dark:text-white" : "text-[#71847b] hover:text-[#0a3d2d] dark:hover:text-white"}`}><Icon size={14} /> {workflow.label}</button>;
                })}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={activeWorkflow.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }} className="grid gap-8 p-6 text-left lg:grid-cols-[0.85fr_1.15fr] lg:p-10">
                <div className="flex flex-col justify-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#17805c]">{activeWorkflow.eyebrow}</p>
                  <h2 className="!mb-0 mt-4 !text-3xl font-semibold !leading-tight tracking-[-0.05em] sm:!text-4xl">{activeWorkflow.title}</h2>
                  <p className="mt-5 max-w-lg text-sm leading-7 text-[#60756c] dark:text-[#a9b9b1]">{activeWorkflow.description}</p>
                  <ul className="mt-7 grid gap-3 text-sm text-[#395248] dark:text-[#cad7d1]">
                    {["간단한 설정과 빠른 적용", "역할에 맞는 접근 권한", "확장 가능한 모듈 구조"].map((item) => <li key={item} className="flex items-center gap-2"><span className="grid h-5 w-5 place-items-center rounded-full bg-[#dff4e9] text-[#0a6b4c] dark:bg-[#174532]"><Check size={12} /></span>{item}</li>)}
                  </ul>
                </div>
                <div className="rounded-2xl bg-[#0a3d2d] p-5 text-white sm:p-7">
                  <div className="flex items-center justify-between border-b border-white/15 pb-5"><div><p className="text-xs text-white/55">Live overview</p><p className="mt-1 font-semibold">오늘의 워크스페이스</p></div><span className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-[#b8f3d5]">실시간</span></div>
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    {activeWorkflow.stats.map((stat) => <div key={stat.label} className="rounded-xl bg-white/8 p-4 transition-colors hover:bg-white/14"><p className="text-[11px] text-white/55">{stat.label}</p><p className="mt-2 text-xl font-semibold tracking-[-0.04em] sm:text-2xl">{stat.value}</p></div>)}
                  </div>
                  <div className="mt-5 space-y-3">
                    {[82, 63, 94].map((width, index) => <div key={width} className="rounded-xl border border-white/10 p-4"><div className="flex items-center justify-between text-xs"><span>진행 중인 작업 {index + 1}</span><span className="text-white/55">{width}%</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><motion.div initial={{ width: 0 }} animate={{ width: `${width}%` }} transition={{ delay: 0.15 + index * 0.08, duration: 0.5 }} className="h-full rounded-full bg-[#70d5ab]" /></div></div>)}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </section>

      <section className="bg-[#f3f8f5] px-5 py-24 dark:bg-[#091711] lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl"><p className="text-sm font-semibold text-[#17805c]">Built for clarity</p><h2 className="!mb-0 mt-4 !text-4xl font-semibold !leading-tight tracking-[-0.055em] sm:!text-5xl">복잡함을 덜어낸<br />운영의 새로운 기준</h2></div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {benefits.map(({ icon: Icon, title, description }, index) => <motion.article key={title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }} transition={{ delay: index * 0.08 }} whileHover={{ y: -7 }} className="rounded-2xl border border-[#0a3d2d]/10 bg-white p-7 shadow-[0_10px_30px_rgba(10,61,45,0.04)] dark:border-white/10 dark:bg-white/5"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#e6f5ed] text-[#0a6b4c] dark:bg-[#164432] dark:text-[#8be0bc]"><Icon size={21} /></span><h3 className="!mb-0 mt-7 !text-xl font-semibold tracking-[-0.035em]">{title}</h3><p className="mt-3 text-sm leading-6 text-[#60756c] dark:text-[#a9b9b1]">{description}</p></motion.article>)}
          </div>
        </div>
      </section>

      <section className="border-t border-[#0a3d2d]/10 bg-white px-5 dark:border-white/10 dark:bg-[#07120e] lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 py-20 lg:grid-cols-[1fr_auto] lg:items-end lg:py-28">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }}>
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#17805c]"><span className="h-px w-8 bg-[#17805c]" />Start your workspace</p>
            <h2 className="!mb-0 mt-6 max-w-3xl !text-[clamp(2.6rem,5vw,4.8rem)] font-semibold !leading-[1.03] tracking-[-0.065em] text-[#0a3d2d] dark:text-white">복잡한 운영을,<br />하나의 흐름으로.</h2>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#60756c] dark:text-[#a9b9b1]">콘텐츠와 사용자를 관리하는 더 간결한 방법을 지금 확인해보세요.</p>
          </motion.div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link href="/auth/register" className="group flex min-w-52 items-center justify-between gap-5 rounded-xl bg-[#0a3d2d] px-5 py-4 text-sm font-semibold text-white transition-all hover:-translate-y-1 hover:bg-[#125841] hover:shadow-xl">워크스페이스 만들기 <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></Link>
            <Link href="/auth/signin" className="flex min-w-52 items-center justify-center rounded-xl border border-[#0a3d2d]/15 px-5 py-4 text-sm font-semibold text-[#0a3d2d] transition-colors hover:bg-[#f0f7f3] dark:border-white/15 dark:text-white dark:hover:bg-white/10">기존 계정으로 로그인</Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default DefaultHomePage;
