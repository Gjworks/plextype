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

  // DB URL 조합
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

  // 4. 폴더 및 심볼릭 링크 설정
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
      console.log("⚠️  링크 생성 실패 (권한 문제일 수 있습니다).");
    }
  }

  // 5. 의존성 설치 및 DB 마이그레이션
  console.log("\n📦 셋업: 패키지 설치 및 DB 초기화 중...");
  run('npm install');
  run('npx prisma migrate dev --name init');
  run('npx prisma generate'); // 👈 확실히 한 번 더 실행
  run('npx prisma db seed');

  console.log("\n" + "=".repeat(50));
  console.log("🎉 Plextype 시스템 설치가 모두 끝났습니다!");
  console.log("이제 'npm run dev'를 입력하여 개발을 시작하세요.");
  console.log("=".repeat(50));
}

setup();