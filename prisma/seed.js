const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt'); // bcrypt로 교체

const prisma = new PrismaClient();

// 환경변수 로드
const adminIdFromEnv = process.env.ADMIN_ACCOUNT_ID || "admin";
const adminPwFromEnv = process.env.ADMIN_PASSWORD || "admin1234";
const adminEmailFromEnv = process.env.ADMIN_EMAIL || "admin@test.com";
const adminNicknameFromEnv = process.env.ADMIN_NICKNAME || "운영자";
const saltRounds = 10; // bcrypt 보안 강도

async function main() {
  console.log('🌱 Seeding database (Bcrypt version)...');

  // 1. bcrypt를 이용한 비밀번호 해싱
  const hashedAdminPassword = await bcrypt.hash(adminPwFromEnv, saltRounds);

  // 2. 기본 사용자 그룹 생성
  await prisma.userGroup.upsert({
    where: { groupName: 'regular' },
    update: {},
    create: {
      groupName: 'regular',
      groupTitle: '정회원',
      groupDesc: '정회원입니다.',
    },
  });

  // 3. 기본 관리자 계정 생성
  await prisma.user.upsert({
    where: { accountId: adminIdFromEnv },
    update: {},
    create: {
      accountId: adminIdFromEnv,
      email_address: adminEmailFromEnv,
      nickName: adminNicknameFromEnv,
      password: hashedAdminPassword, // 해싱된 비밀번호 저장
      isAdmin: true,
      isManagers: true,
    },
  });

  console.log(`✅ Seed completed. Admin ID: ${adminIdFromEnv}`);

  // 4. 'notice' 게시판 생성 로직 (동일)
  await prisma.modules.upsert({
    where: { postName: 'notice' },
    update: {},
    create: {
      mid: 'notice',
      postName: 'notice',
      postDesc: '공지사항 게시판입니다.',
      status: 'active',
    },
  });

  console.log('✅ Seed completed successfully with Bcrypt.');
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });