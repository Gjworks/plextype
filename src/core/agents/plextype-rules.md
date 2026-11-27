# PROJECT KNOWLEDGE BASE

**Framework:** Next.js App Router, React, Prisma, TailwindCSS
**Base:** Plextype
**Goal:** 코어 업데이트를 유지하면서 프로젝트별 기능은 extensions에서 확장한다.

---

## 공통 원칙

- 프론트엔드 코드는 TypeScript(`.ts`, `.tsx`)로 작성한다.
- 기존 디자인, Tailwind 클래스, UI 레이아웃은 요청 범위 안에서만 수정한다.
- 새 npm 패키지는 명확한 이유가 있을 때만 추가한다.
- 프로젝트 전용 npm 패키지는 루트 `package.json`이 아니라 `src/extensions/package.json`에 추가한다(`npm install <패키지> -w src/extensions`).
- 루트 `package.json`의 `name`과 `version`은 프로젝트의 앱 이름과 버전이다. `src/core/plextype.json`과 `CHANGELOG.md`는 코어 소유이므로 고치지 않는다.
- `.env`, `.env.development`, `.env.production` 같은 환경 파일은 사용자가 명시적으로 요청하지 않으면 수정하지 않는다.
- `node_modules/`, `.next/`, `dist/`, `.git/`, `public/storage/`, `storage/` 같은 생성물과 업로드 폴더는 분석하거나 수정하지 않는다.
- Git 커밋, 푸시, 태그 생성, 배포는 사용자의 명시 요청 없이 하지 않는다.
- 하위 폴더에 별도의 `AGENTS.md`를 만들지 않고, 프로젝트 루트의 `AGENTS.md` 하나에서 규칙을 관리한다.
- 사용자가 만든 변경사항을 되돌리거나 삭제하지 않는다. 작업 중 발견한 기존 변경사항은 사용자 작업으로 간주하고 보존한다.
- 코드 수정 전에는 관련 파일 구조와 기존 패턴을 먼저 확인한다.
- 작업 결과는 수정 파일, 검증 결과, 남은 위험만 간결하게 보고한다.

---

## Plextype 코어 보호

- `src/core`, `src/modules`와 기본 모듈 라우트는 Plextype 코어 영역이다. 단, `src/app/(modules)` 안에도 확장 소유의 생성된 연결 파일이 있을 수 있으므로 `routes.json`에서 소유권을 먼저 확인한다.
- 코어 파일을 직접 수정하기 전에 `extensions`, trigger, registry, capability, action wrapper로 해결 가능한지 먼저 검토한다.
- 프로젝트별 화면, 기능, 라우트 구현, API, 스킨, 레이아웃은 해당 `src/extensions` 기능 폴더 안에 작성한다. `src/app`의 확장 연결 파일에는 비즈니스 로직을 넣지 않는다.
- `src/modules/posts`와 `src/extensions/posts`, `src/modules/user`와 `src/extensions/user`는 합치지 않는다. 확장은 코어에 없는 기능을 추가하거나 기존 동작·화면을 오버라이딩한다.
- 코어를 수정해야만 하는 경우에는 수정 이유와 업데이트 충돌 가능성을 먼저 설명한다.
- 코어 파일을 수정했다면 어떤 upstream 업데이트와 충돌할 수 있는지 함께 기록한다.
- 단순 사이트 커스텀, 전용 서비스, 전용 스토어, 전용 관리자 화면은 코어가 아니라 extension으로 둔다.
- 배포판에 포함하지 않을 프로젝트 전용 기능의 원본은 `src/extensions`에 둔다. 여러 기능이 함께 쓰는 공통 UI와 등록 장치는 공유 위치를 유지한다.

---

## 권장 작업 위치

- 새 독립 기능: `src/extensions/[feature]/` (예: `store`, `service`, `partners`)
- 새 페이지·레이아웃 진입점: `src/extensions/[feature]/routes/.../page.tsx`, `layout.tsx`
- 새 기능 전용 API: `src/extensions/[feature]/api/.../route.ts`
- Next.js 연결 목록: `src/extensions/[feature]/routes.json`
- 새 레이아웃: `src/extensions/layouts/[name]/Layout.tsx`
- 새 홈/특수 페이지 컴포넌트: `src/extensions/pages/[name]`
- 새 게시판 확장: `src/extensions/posts/[feature]/` 아래 `actions/`, `tpl/`, `registry.tsx`, `capabilities.ts` (예: `issuetracker`)
- 회원 스킨·오버라이딩: `src/extensions/user/[skin]/`
- 새 DB 모델 조각: 해당 기능의 `prisma/schema.prisma` 또는 `prisma/schema/*.prisma`
- 기능 전용 Trigger 구현: 해당 기능의 `triggers/` (공통 등록점에서 명시적으로 연결)
- 프로젝트 공용 seed: `src/extensions/prisma/seed.js` (기능별 seed 자동 탐색은 지원하지 않음)
- 프로젝트별 스타일: `src/extensions/styles/style.css`
- 프로젝트별 proxy 확장: `src/extensions/proxy.ts`
- 프로젝트별 trigger 등록: `src/extensions/triggerRegistry.ts`
- 게시판 기능 선언: 해당 게시판 확장의 `capabilities.ts`, 공통 `src/extensions/postCapabilities.ts`에서는 조립만 수행
- Store에 올릴 패키지 개발: `src/packages/[모듈 ID]/` (규칙은 패키지 만들기 문서)
- Store에 올릴 패키지의 회원용 화면: 기능 패키지와 나눈 화면 패키지 `src/packages/[모듈 ID]-screens/`. 기능 패키지에는 로직·DB·API·관리자 화면만 둔다.
- 설치한 패키지의 회원용 화면을 이 프로젝트에 맞게 고칠 때: 화면 패키지만 쉬운 설치의 `내 확장으로 가져오기`로 `src/extensions`에 옮겨 고친다. 화면 패키지가 없으면 기능 패키지의 `index.ts`가 내보내는 것으로 `src/extensions`에 화면을 직접 만든다.

---

## 확장 폴더와 라우트 연결

- 기능의 원본은 한 폴더로 모으되, 인증·권한·공용 UI 등 공유 기능을 복제해서 넣지 않는다.
- `routes.json`에는 `route`, `implementation`, `configs`, 필요한 경우 `exports`를 작성한다. 경로는 프로젝트 루트 기준이며 `implementation`은 해당 확장 폴더 내부여야 한다.
- `route`는 Next.js가 읽는 `src/app` 연결 파일 경로다. 기존 URL과 상위 layout 적용 관계를 보존한다.
- `configs`에는 `dynamic`, `runtime` 등 Next.js가 정적으로 읽는 설정을 둔다. 설정은 생성된 연결 파일에 남기고 실제 구현에서는 제거한다.
- 페이지·레이아웃은 `default`, API는 `GET`, `POST` 등 실제 메서드를 연결한다. `generateStaticParams` 같은 추가 export도 목록에 포함한다.
- 예시:

```json
[
  {
    "route": "src/app/(extensions)/example/page.tsx",
    "implementation": "src/extensions/example/routes/example/page.tsx",
    "configs": ["export const dynamic = \"force-dynamic\";"],
    "exports": ["default"]
  }
]
```

- 라우트를 추가하거나 변경하면 `npm run extensions:sync`로 연결 파일을 생성·갱신하고 `npm run extensions:check`로 검사한다.
- 현재 개발 서버 시작·빌드 전에 자동 실행되는 명령은 아니다. 필요한 경우 실행 전에 명시적으로 동기화한다.
- 생성된 연결 파일을 직접 고치지 말고 원본 구현과 `routes.json`을 수정한다. 일반 수작업 라우트 덮어쓰기가 거부되면 소유권과 기존 구현부터 확인한다.
- 확장이나 라우트를 제거해도 기존 연결 파일은 자동 삭제되지 않는다. 참조와 URL 영향 범위를 확인하고 명시적으로 정리한다.
- 이 명령은 라우트 연결만 처리한다. 패키지 설치, registry·Trigger 등록, DB 설치, 구매 인증, 원격 설치를 자동 처리한다고 가정하지 않는다.
- 다른 확장에 의존한다면 의존 대상과 필요한 공통 등록 절차를 해당 기능 문서에 기록한다.

---

## 피해야 할 작업 위치

- `src/core`: 공통 컴포넌트, registry, trigger, utility 코어 영역
- `src/modules`: 회원, 게시판, 인증 등 기본 모듈 영역
- `src/app`의 기본 모듈 라우트: 코어 흐름을 유지한다. 확장 소유 연결 파일은 `routes.json`과 동기화 명령으로 관리한다.
- `prisma/schema.prisma`: 직접 수정하지 않고 해당 기능의 `prisma/schema.prisma` 또는 `prisma/schema/*.prisma`를 사용한다.
- `src/app/globals.css`: 전역 리셋이나 typography 변경은 영향 범위가 크므로 먼저 extension style로 가능한지 확인한다.
- `src/packages`의 설치된 패키지(`plextype.package.json`이 있는 폴더)와 `src/packages/index.ts`: 쉬운 설치가 관리하며 업데이트할 때 통째로 바뀐다. 고치려면 같은 key로 `src/extensions`에 등록하거나 쉬운 설치의 `내 확장으로 가져오기`를 쓴다. 화면을 고치려는 것이면 기능 패키지가 아니라 화면 패키지를 가져온다. 기능 패키지를 가져오면 로직의 업데이트를 받지 못한다.
- 패키지의 안쪽 파일(`@/packages/[모듈 ID]/actions/...` 등): 패키지 밖에서는 `@/packages/[모듈 ID]`(`index.ts`)가 내보내는 것만 가져온다. 안쪽 구조는 버전마다 바뀔 수 있다.
- `.plextype/`: 쉬운 설치의 Store 토큰과 백업이 들어 있다. 읽거나 커밋하지 않는다.

---

## Action Layer 규칙

- UI 컴포넌트나 page에서 Prisma query를 직접 호출하지 않는다.
- 데이터 흐름은 `Component/Page` → `*.action.ts` → `*.query.ts` 순서로 유지한다.
- 서버 액션 함수 이름은 `Action`으로 끝낸다.
- 관리자 전용 액션은 이름에 `Admin`을 포함한다.
- DB 조회와 raw query는 `*.query.ts`에 둔다.
- UI에서 필요한 데이터는 action을 통해 가져온다.
- action은 인증, 권한, 입력 검증, revalidate 처리를 담당한다.
- query는 DB 접근만 담당하고 UI 상태나 redirect를 처리하지 않는다.
- raw SQL을 쓸 때는 사용자 입력을 문자열로 직접 이어붙이지 않는다.
- 파일 업로드, 결제, 알림, 권한 변경처럼 사이드 이펙트가 있는 작업은 action에 모아둔다.

---

## Registry 규칙

- 새 모듈은 자기 폴더 안에 `registry.tsx`를 두고 `defineModule()`로 관리자 메뉴, breadcrumb, 관련 스킨을 함께 등록한다.
- 게시판 스킨은 `definePostSkin()`으로 등록한다.
- 게시판 레이아웃은 `definePostLayout()`으로 등록한다.
- 관리자 레이아웃은 `defineAdminLayout()`으로 등록한다.
- 사용자 레이아웃/스킨은 `defineUserSkin()`으로 등록한다. 패키지가 내놓는 로그인 수단 버튼을 직접 그리려면 `placesLoginProviders`를, 패키지의 회원 화면을 마이페이지 틀 안에 넣으려면 `pageFrame`을 함께 등록한다.
- 설치한 패키지가 그리는 화면 하나를 바꿀 때는 그 패키지의 README에 적힌 key로 `defineView()`를 `views`에 등록한다.
- 패키지는 회원 메뉴에 항목을 넣지 못한다. 패키지의 회원 화면으로 가는 링크는 회원 스킨의 메뉴에 직접 넣는다.
- `src/extensions/registry.tsx`는 각 모듈/스킨 registry를 import해서 조립만 한다.
- 다른 프로젝트로 넘길 모듈이나 스킨은 컴포넌트, action/query, prisma 조각, registry를 같은 폴더 단위로 유지한다.
- 폴더 추가나 `extensions:sync`만으로 registry가 자동 등록되지는 않는다. 공통 registry에서 명시적으로 연결한다.
- 기능 전용 Trigger는 기능 폴더에 두되, `src/extensions/triggerRegistry.ts`를 통해 공통 실행 장치에 연결한다. 코어 Trigger 엔진 자체를 기능 폴더로 옮기지 않는다.

---

## Prisma 확장 규칙

- 새 모델은 `src/extensions/[feature]/prisma/schema.prisma` 또는 `src/extensions/[feature]/prisma/schema/*.prisma`에 추가한다. 게시판 확장처럼 중첩된 기능 폴더도 같은 규칙을 사용한다.
- 모델을 추가·변경하면 같은 기능의 `prisma/migrations/<14자리 시각>_<이름>/migration.sql`도 함께 둔다. `npm run migrate:dev -- --to [feature] --name <이름>`으로 만든다. 코어는 `src/core/prisma/migrations`이고 `--to core`를 쓴다.
- 기존 `src/extensions/prisma` 위치는 호환용으로 지원하지만, 동일 모델을 기존 위치와 기능 폴더에 중복 정의하지 않는다.
- 루트 `prisma/schema.prisma`와 `prisma/migrations/`는 `npm run prisma:sync`가 코어와 기능 폴더를 합쳐 만드는 결과물로 취급한다. 직접 고치지 않는다.
- `prisma:sync`와 client generate는 DB 테이블을 생성하지 않는다. 모델 변경에 필요한 마이그레이션과 배포 적용 절차를 함께 준비한다.
- 적용된 마이그레이션은 폴더 정리 목적으로 이름을 바꾸거나 삭제·재실행하지 않는다. 코어와 기능 마이그레이션 이름이 겹치지 않게 한다.
- 코어 모델에 back relation을 추가하기보다 `userId`, `documentId` 같은 scalar 컬럼으로 연결하고 query에서 조합하는 방식을 우선한다.
- migration이 필요한 변경은 적용 전 영향 범위를 설명한다.
- 운영 DB에 destructive migration이나 reset을 실행하지 않는다.
- DB migration, push, seed는 사용자의 명시 요청 없이 실행하지 않는다.

---

## UI 작업 규칙

- 반복되는 버튼, input, select, modal, tab, bottom panel은 `src/core/components`의 공통 컴포넌트를 우선 사용한다.
- 기존 페이지의 spacing, border radius, font weight, dark mode 톤을 먼저 확인하고 맞춘다.
- `font-bold`, `font-extrabold`는 꼭 필요한 강조에만 사용한다.
- 다크모드가 있는 프로젝트라면 라이트/다크 양쪽 상태를 함께 확인한다.
- 모바일에서 가로 스크롤이 생기지 않도록 grid, min-width, overflow를 확인한다.

---

## 보안과 운영

- 관리자, 회원, 결제, 주문, 알림, 파일 다운로드 권한은 서버 액션 또는 API에서 다시 검증한다.
- 클라이언트 UI에서 버튼을 숨기는 것만으로 권한 처리를 끝내지 않는다.
- 업로드 파일 경로와 다운로드 권한은 사용자 입력을 신뢰하지 않는다.
- Web Push, FCM, 결제 키 같은 비밀값은 `.env` 또는 서버 secret으로 관리한다. 관리자 화면에서 입력받아야 하는 키는 `encryptSecret`(`@/core/utils/crypto/secret`)으로 암호화해 저장한다.
- 로그에 토큰, 비밀번호, service account JSON을 출력하지 않는다.

---

## 작업 전 체크

- 같은 기능이 이미 `src/core`, `src/modules`, `src/extensions`에 있는지 검색한다.
- 공통 컴포넌트로 해결 가능한지 확인한다.
- 새 기능이 코어 기능인지 프로젝트 전용 기능인지 먼저 구분한다.
- 독립 기능인지 코어 모듈의 확장·스킨인지 구분하고, 해당 기능 폴더의 소유권과 다른 확장 의존성을 확인한다.
- DB가 필요한 경우 Prisma extension schema 조각으로 가능한지 검토한다.
- 웹 UI와 관리자 UI, 모바일 API가 함께 영향을 받는지 확인한다.

---

## 검증

- 코드 수정 후 가능한 범위에서 빌드, 타입 검사, 테스트 중 적절한 검증을 실행한다.
- 확장 라우트 변경 시 `npm run extensions:sync`, `npm run extensions:check`, `npm run extensions:test`를 실행한다.
- TypeScript는 `npx tsc --noEmit --incremental false`, 프로덕션 빌드는 `npm run build`로 확인한다. 환경 문제로 Webpack 대체 검증을 했다면 `npm run build -- --webpack` 사용 여부를 보고한다.
- Prisma schema를 변경했다면 schema sync와 client generate가 필요한지 확인한다.
- 검증을 실행하지 못했다면 이유를 결과 보고에 남긴다.
