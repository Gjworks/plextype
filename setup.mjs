import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import readline from 'readline/promises';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const run = (cmd) => {
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (e) {
    console.error(`❌ 실행 실패: ${cmd}`);
    process.exit(1);
  }
};

async function setup() {
  console.log("🚀 Plextype 맞춤형 설치를 시작합니다...");

  // 1. 관리자 정보 입력
  console.log("\n👤 [1/2] 관리자(Admin) 계정 설정");
  const adminId = await rl.question('관리자 ID (admin): ') || 'admin';
  const adminPw = await rl.question('관리자 비밀번호 (password123): ') || 'password123';
  const adminEmail = await rl.question('관리자 이메일 (admin@example.com): ') || 'admin@example.com';
  const adminNickname = await rl.question('관리자 닉네임 (관리자): ') || '관리자';

  // 2. 데이터베이스 정보 분할 입력
  console.log("\n🗄️  [2/2] 데이터베이스(PostgreSQL) 연결 설정");
  const dbUser = await rl.question('DB 사용자명 (postgres): ') || 'postgres';
  const dbPw = await rl.question('DB 비밀번호 (password): ') || 'password';
  const dbHost = await rl.question('DB 호스트 주소 (localhost): ') || 'localhost';
  const dbPort = await rl.question('DB 포트 번호 (5432): ') || '5432';
  const dbName = await rl.question('데이터베이스 이름 (plextype): ') || 'plextype';

  const dbUrl = `postgresql://${dbUser}:${dbPw}@${dbHost}:${dbPort}/${dbName}?schema=public`;

  rl.close();

  // 3. 환경 변수 파일(.env) 생성
  console.log("\n🔑 셋업: .env 파일 및 보안 토큰 생성 중...");
  if (!fs.existsSync('.env')) {
    const generateToken = () => crypto.randomBytes(32).toString('base64');
    const envContent = `PROJECT_NAME=Plextype
NEXT_PUBLIC_DEFAULT_URL=http://localhost:3000
NEXT_PUBLIC_SECRET="${generateToken()}"

JWT_SECRET="${generateToken()}"
SECRET_KEY="${generateToken()}"
ACCESSTOKEN_EXPIRES_IN=1h
REFRESHTOKEN_EXPIRES_IN=4h

ADMIN_ACCOUNT_ID=${adminId}
ADMIN_PASSWORD=${adminPw}
ADMIN_EMAIL=${adminEmail}
ADMIN_NICKNAME="${adminNickname}"

DATABASE_URL="${dbUrl}"
`;
    fs.writeFileSync('.env', envContent);
    console.log("✅ .env 파일 생성 완료!");
  }

  // 3-2. 초기 페이지(app/page.tsx) 생성
  console.log("\n🏠 셋업: 진단 대시보드 페이지 설정 중...");
  const appDirPath = path.join('src', 'app');
  const pagePath = path.join(appDirPath, 'page.tsx');

  if (!fs.existsSync(appDirPath)) {
    fs.mkdirSync(appDirPath, { recursive: true });
  }

  if (!fs.existsSync(pagePath)) {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const getVer = (dep) => pkg.dependencies?.[dep]?.replace(/[^0-9.]/g, '') || pkg.devDependencies?.[dep]?.replace(/[^0-9.]/g, '') || 'unknown';

    const coreVersion = pkg.version || '0.8.1';
    const nextVersion = getVer('next');
    const prismaVersion = getVer('@prisma/client') || getVer('prisma');
    const reactVersion = getVer('react');
    const nodeVersion = process.version;

    const defaultPageContent = `"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function Page() {
  const [checks, setChecks] = useState({ db: null, storage: null, env: null });

  useEffect(() => {
    fetch('/api/system/setup-check')
      .then(res => res.json())
      .then(data => setChecks(data))
      .catch(() => setChecks({ db: false, storage: false, env: false }));
  }, []);

  const systemEnv = [
    { name: 'Plextype Core', version: 'v${coreVersion}' },
    { name: 'Next.js Runtime', version: 'v${nextVersion}' },
    { name: 'Prisma ORM', version: 'v${prismaVersion}' },
    { name: 'React Ecosystem', version: 'v${reactVersion}' },
    { name: 'Node.js (Env)', version: '${nodeVersion}' },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-black selection:text-white overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />
      </div>

      <div className="max-w-5xl w-full px-6 py-12">
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-16"
        >
          <header className="space-y-8">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-1 border-t-4 border-black" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Stable Release</span>
              </div>
              <h1 className="text-7xl md:text-9xl font-black tracking-tighter uppercase leading-[0.8]">
                PLEXTYPE <br />
                <span className="text-slate-200 italic">STARTED.</span>
              </h1>
            </div>

            {/* 📡 시스템 진단 배지 */}
            <div className="flex flex-wrap gap-3 pt-2">
              <StatusBadge label="Database" isOk={checks.db} />
              <StatusBadge label="Storage" isOk={checks.storage} />
              <StatusBadge label="ENV" isOk={checks.env} />
            </div>

            {/* 🛠️ Troubleshooting Section (에러 발생 시에만 노출) */}
            {(checks.db === false || checks.storage === false || checks.env === false) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-red-50 border border-red-100 rounded-2xl p-6 mt-4 overflow-hidden"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <h3 className="text-sm font-black text-red-900 uppercase tracking-tighter">System Diagnostic Report</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-900">
                  {checks.db === false && (
                    <div className="space-y-2">
                      <p className="text-[12px] font-black text-red-800 uppercase text-xs">Database Error</p>
                      <ul className="text-[11px] text-red-700/80 leading-relaxed space-y-1 font-medium italic">
                        <li>• .env의 DATABASE_URL 확인</li>
                        <li>• DB 서비스 실행 상태 확인</li>
                        <li>• npx prisma migrate dev 실행 여부</li>
                      </ul>
                    </div>
                  )}
                  {checks.storage === false && (
                    <div className="space-y-2 border-t md:border-t-0 md:border-l border-red-200/50 pt-4 md:pt-0 md:pl-6">
                      <p className="text-[12px] font-black text-red-800 uppercase text-xs">Storage Error</p>
                      <ul className="text-[11px] text-red-700/80 leading-relaxed space-y-1 font-medium italic">
                        <li>• storage 폴더 존재 확인</li>
                        <li>• chmod 775 storage 권한 설정</li>
                      </ul>
                    </div>
                  )}
                  {checks.env === false && (
                    <div className="space-y-2 border-t md:border-t-0 md:border-l border-red-200/50 pt-4 md:pt-0 md:pl-6">
                      <p className="text-[12px] font-black text-red-800 uppercase text-xs">Config Missing</p>
                      <ul className="text-[11px] text-red-700/80 leading-relaxed space-y-1 font-medium italic">
                        <li>• .env 파일이 존재하지 않음</li>
                        <li>• npm run setup 재실행</li>
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            <p className="text-lg md:text-xl text-slate-500 max-w-2xl leading-relaxed font-medium">
              축하합니다! 새로운 아키텍처 엔진이 성공적으로 준비되었습니다. <br className="hidden md:block" />
              이제 <code className="bg-slate-100 text-black px-1 rounded font-mono text-sm">src/app/page.tsx</code>를 수정하여 개발을 시작하세요.
            </p>

            <div className="flex flex-wrap gap-2 pt-4">
              {systemEnv.map((env, i) => (
                <div key={i} className="flex items-center border border-slate-200 rounded-md overflow-hidden font-mono group hover:border-gray-400 transition-all">
                  <span className="bg-slate-50 px-3 py-1.5 text-[9px] font-black text-slate-400 border-r border-slate-200 group-hover:text-blue-600 transition-all uppercase tracking-tighter">
                    {env.name}
                  </span>
                  <span className="px-3 py-1.5 text-[11px] font-black text-black italic tracking-tighter bg-white font-mono">
                    {env.version}
                  </span>
                </div>
              ))}
            </div>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <LinkCard title="Documentation" desc="프레임워크 가이드 및 API 레퍼런스" url="/docs" />
            <LinkCard title="GitHub Archive" desc="소스 코드 확인 및 이슈 리포트" url="https://github.com/Gjworks/plextype" />
            <LinkCard title="Changelog" desc="버전별 업데이트 내역 확인" url="/changelog" />
          </section>

          <footer className="pt-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold text-slate-400 tracking-[-0.03em] uppercase">
            <p>© GJWORKS ARCHIVE. POWERED BY PLEXTYPE</p>
            <div className="flex gap-6 items-center italic text-black tracking-widest">
              <span>SYSTEM_OPTIMAL</span>
              <div className="w-8 h-[1px] bg-slate-200" />
              <span>VER ${coreVersion}</span>
            </div>
          </footer>
        </motion.main>
      </div>
    </div>
  );
}

function StatusBadge({ label, isOk }) {
  const color = isOk === null ? 'bg-slate-50 text-slate-400' : isOk ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-red-50 text-red-600 border-red-100';
  const text = isOk === null ? 'Checking...' : isOk ? 'Connected' : 'Error';
  return (
    <div className={\`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-tight transition-all \${color}\`}>
      <div className={\`w-1.5 h-1.5 rounded-full \${isOk ? 'bg-blue-600 animate-pulse' : isOk === false ? 'bg-red-600' : 'bg-slate-300'}\`} />
      <span>\${label}: \${text}</span>
    </div>
  );
}

function LinkCard({ title, desc, url }) {
  return (
    <a href={url} target="_blank" className="group p-8 border border-slate-200 rounded-3xl bg-white hover:border-black transition-all duration-300 flex flex-col justify-between h-48 hover:shadow-2xl">
      <div>
        <h3 className="text-lg font-black uppercase tracking-tight group-hover:text-blue-600 transition-colors font-bold">{title}</h3>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed font-medium">{desc}</p>
      </div>
      <div className="flex justify-end text-[10px] font-black italic opacity-20 group-hover:opacity-100 transition-all uppercase tracking-widest">
        View Details →
      </div>
    </a>
  );
}
`;
    fs.writeFileSync(pagePath, defaultPageContent);
    console.log("✅ src/app/page.tsx 생성 완료! (진단 가이드 포함)");
  } else {
    console.log("ℹ️  src/app/page.tsx가 이미 존재하여 건너뜁니다.");
  }

  // Layout 및 하단 로직 (동일)
  const layoutPath = path.join(appDirPath, 'layout.tsx');
  if (!fs.existsSync(layoutPath)) {
    const defaultLayoutContent = `import "./globals.css";
import ReactQueryProvider from "@/core/providers/ReactQueryProvider";
import { UserProvider } from "@/core/providers/UserProvider";
export const dynamic = 'force-dynamic';
import { ToastContainer } from "@/core/components/toast/toast";
import RealtimeNotificationListener from "@/core/components/toast/RealtimeNotificationListener";

export default function RootLayout({ children }) {
  return (
    <html className="break-keep selection:bg-black selection:text-white dark:selection:bg-primary-400 dark:selection:text-white">
      <body>
        <ReactQueryProvider>
          <UserProvider>
            <RealtimeNotificationListener />
            {children}
            <ToastContainer position="top-right" />
            <div id="left"></div><div id="right"></div><div id="bottom"></div><div id="modal"></div>
          </UserProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
`;
    fs.writeFileSync(layoutPath, defaultLayoutContent);
    console.log("✅ src/app/layout.tsx 생성 완료!");
  }

  // Storage 및 의존성 설치 로직
  console.log("\n📁 셋업: Storage 폴더 설정 중...");
  if (!fs.existsSync('storage')) fs.mkdirSync('storage');
  if (!fs.existsSync('public')) fs.mkdirSync('public');
  const linkPath = path.join('public', 'storage');
  if (!fs.existsSync(linkPath)) {
    const target = path.join('..', 'storage');
    const type = process.platform === 'win32' ? 'junction' : 'dir';
    try {
      fs.symlinkSync(target, linkPath, type);
      console.log("✅ 심볼릭 링크 생성 완료!");
    } catch (e) {
      console.log("⚠️  링크 생성 실패.");
    }
  }

  console.log("\n📦 셋업: 패키지 설치 및 DB 초기화 중...");
  run('npm install');
  run('npx prisma migrate dev --name init');
  run('npx prisma generate');
  run('npx prisma db seed');

  console.log("\n" + "=".repeat(50));
  console.log("🎉 Plextype 시스템 설치가 모두 끝났습니다!");
  console.log("이제 'npm run dev'를 입력하여 개발을 시작하세요.");
  console.log("=".repeat(50));
}

setup();