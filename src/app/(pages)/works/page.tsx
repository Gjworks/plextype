'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Box, Globe, Monitor, Construction, ArrowUpRight, Lock } from 'lucide-react';
import Link from 'next/link';

const StatusBadge = ({ status }: { status: 'RELEASED' | 'PREPARING' }) => {
  const isReleased = status === 'RELEASED';
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-tighter ${
      isReleased ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-500'
    }`}>
      {status}
    </span>
  );
};

export default function WorksPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="min-h-screen bg-white dark:bg-dark-950" />;

  const works = [
    {
      id: "plextype",
      title: "Plextype",
      category: "Framework",
      description: "정교한 모듈형 구조를 지향하는 Next.js 기반 풀스택 프레임워크입니다. 모든 gjworks 서비스의 근간이 됩니다.",
      status: "RELEASED" as const,
      tags: ["Next.js", "Prisma", "Modular"],
      icon: <Box className="w-6 h-6" />,
      href: "https://plextype.com"
    },
    {
      id: "community",
      title: "GJ Community",
      category: "Platform",
      description: "Plextype 엔진을 기반으로 구축 중인 차세대 커뮤니티 플랫폼입니다. 곧 공개될 예정입니다.",
      status: "PREPARING" as const,
      tags: ["Community", "Real-time", "Interaction"],
      icon: <Globe className="w-6 h-6" />,
      href: "#"
    },
    {
      id: "service-x",
      title: "Secret Project",
      category: "Service App",
      description: "일상의 생산성을 높여줄 gjworks만의 독창적인 서비스 앱을 기획하고 있습니다.",
      status: "PREPARING" as const,
      tags: ["Mobile", "Efficiency", "Planning"],
      icon: <Monitor className="w-6 h-6" />,
      href: "#"
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-primary-600 selection:text-white dark:bg-dark-950 dark:text-dark-100">
      <div className="max-w-4xl mx-auto pt-12 px-6">

        <header className="mb-24">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-black tracking-tighter mb-4 italic"
          >
            WORKS<span className="text-primary-600 text-sm align-top ml-1">●</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-500 font-medium tracking-tight dark:text-dark-400"
          >
            우리가 설계하고 현실로 만들어가는 프로젝트들입니다.
          </motion.p>
        </header>

        <div className="flex flex-col gap-6">
          {works.map((work, i) => {
            const isReleased = work.status === 'RELEASED';

            return (
              <motion.div
                key={work.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                {/* 🌟 릴리즈 상태일 때만 카드 전체를 외부 링크로 감쌈 */}
                {isReleased ? (
                  <Link
                    href={work.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                  >
                    <div className="relative p-8 rounded-3xl border border-slate-200 bg-white transition-all duration-500 hover:border-primary-600 hover:shadow-2xl hover:shadow-primary-100/50 cursor-pointer dark:border-dark-800 dark:bg-dark-900 dark:hover:border-dark-600 dark:hover:shadow-black/30">
                      <WorkContent work={work} isReleased={isReleased} />
                    </div>
                  </Link>
                ) : (
                  <div className="relative p-8 rounded-3xl border border-slate-100 bg-slate-50/50 opacity-70 dark:border-dark-800 dark:bg-dark-900/50">
                    <WorkContent work={work} isReleased={isReleased} />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        <footer className="mt-32 text-center">
          <p className="text-[10px] font-mono text-slate-400 tracking-[0.2em] uppercase">
            Designed & Built by GJWORKS with Plextype
          </p>
        </footer>
      </div>
    </div>
  );
}

// 중복 코드를 방지하기 위한 내부 컴포넌트
function WorkContent({ work, isReleased }: { work: any, isReleased: boolean }) {
  return (
    <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-6">
          <StatusBadge status={work.status} />
          <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest">{work.category}</span>
        </div>

        <h2 className={`text-3xl font-black tracking-tight mb-4 ${isReleased ? 'text-slate-900 dark:text-dark-100' : 'text-slate-400 dark:text-dark-500'}`}>
          {work.title}
        </h2>

        <p className={`text-sm leading-relaxed mb-8 max-w-xl ${isReleased ? 'text-slate-600 dark:text-dark-300' : 'text-slate-400 dark:text-dark-500'}`}>
          {work.description}
        </p>

        <div className="flex flex-wrap gap-2">
          {work.tags.map((tag: string) => (
            <span key={tag} className={`text-[10px] px-2 py-0.5 rounded border font-bold ${
              isReleased ? 'border-slate-200 text-slate-500 dark:border-dark-700 dark:text-dark-400' : 'border-slate-100 text-slate-300 dark:border-dark-800 dark:text-dark-600'
            }`}>
              #{tag.toUpperCase()}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-end justify-between self-stretch">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${
          isReleased
            ? 'bg-primary-600 text-white shadow-lg shadow-primary-200 group-hover:scale-110'
            : 'bg-slate-200 text-slate-400'
        }`}>
          {isReleased ? work.icon : <Construction className="w-6 h-6 animate-pulse" />}
        </div>

        {isReleased ? (
          <div className="mt-8 flex items-center gap-1 text-[11px] font-black text-primary-600 group-hover:underline">
            VIEW PROJECT <ArrowUpRight className="w-3 h-3" />
          </div>
        ) : (
          <div className="mt-8 flex items-center gap-1 text-[11px] font-black text-slate-300">
            <Lock className="w-3 h-3" /> COMING SOON
          </div>
        )}
      </div>
    </div>
  );
}
