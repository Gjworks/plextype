# Gjworks Web

Next.js 15 기반으로 개발된 웹 애플리케이션입니다.  
게시판, 사용자 관리, 권한 시스템 등을 포함하며 Prisma ORM과 PostgreSQL을 사용합니다.

## Plextype 배포 의존성 제외 목록

`scripts/plextype-distribution.json`의 `gjworksOnly`에 gjworks 전용 패키지를 기능별로 기록합니다. 현재 목록은 비어 있으므로 기존 의존성을 모두 Plextype에 전달합니다.

향후 전용 기능을 추가할 때의 작성 예시입니다. 아래 패키지명은 설명용입니다.

```json
{
  "gjworksOnly": {
    "sitePlugin": {
      "dependencies": ["some-site-sdk"],
      "devDependencies": ["@types/some-site-sdk"]
    }
  }
}
```

- 공통 패키지는 원본 `package.json`에 추가하고 제외 목록에는 넣지 않습니다.
- gjworks 전용 패키지는 원본 `package.json`과 해당 기능의 제외 목록에 함께 추가합니다. 코어에서 사용하기 시작하면 제외 목록에서 제거합니다.
- `Sync to Plextype` 작업이 전용 코드를 필터링한 뒤 `prepare-plextype.mjs`를 실행합니다. 이때 배포본의 패키지 선언만 제거하고, 변경된 경우 lockfile을 갱신한 뒤 `npm ci`와 빌드를 검사합니다. 성공한 파일을 Plextype에 함께 전달합니다.
- 제외 대상이 공통 패키지의 간접 의존성이기도 하면 설치될 수 있습니다. 목록은 직접 의존성 선언을 제거하며, 공유 의존성까지 강제로 삭제하지 않습니다.
- `prepare-plextype.mjs`는 원본 gjworks 체크아웃에서 실행하지 않습니다. `src/extensions`가 남아 있으면 변경 전에 중단하도록 보호되어 있습니다.

검증: `node --test scripts/prepare-plextype.test.mjs`

## 주요 기술 스택

- **Framework**: [Next.js 15](https://nextjs.org/)
- **Language**: TypeScript
- **Database ORM**: [Prisma](https://www.prisma.io/)
- **Database**: PostgreSQL (Docker 기반)
- **UI**: React, TailwindCSS
- **State/Data Fetching**: React Query
- **Authentication**: JWT 기반 토큰 방식 (Access / Refresh)
- **Deployment**: Docker, Nginx Reverse Proxy

## 프로젝트 구조
```
src/
├── app/                  # Next.js App Router
│   └── (extentions)/     # 확장 기능 (예: 게시판 posts)
│       └── posts/        # 게시판 관련 라우트
├── components/           # 공통 UI 컴포넌트
├── extentions/           # 서버 액션, 데이터 로직
│   └── posts/            # 게시판 관련 스크립트
└── lib/                  # 헬퍼 함수 및 라이브러리
```

## 데이터베이스 모델 (Prisma)

대표적인 모델은 아래와 같습니다.

- **User**: 회원 정보
- **Profile**: 사용자 프로필
- **UserGroup / UserGroupUser**: 그룹 및 회원 소속 관계
- **Document**: 게시판 글
- **Category**: 게시판 카테고리
- **Comment**: 댓글
- **Permission**: 권한 관리

## 실행 방법

### 1. 의존성 설치
```bash
npm install

npx prisma migrate dev

npm run dev

npm run build
npm run start

DATABASE_URL="postgresql://user:password@localhost:5432/id"
JWT_SECRET="your-secret-key"
NEXTAUTH_SECRET="your-nextauth-secret"
