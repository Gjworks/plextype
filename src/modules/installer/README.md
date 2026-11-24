# 쉬운 설치

Plextype 기본 관리자 모듈입니다. Store에 올라온 확장 패키지를 이 프로젝트의 `src/packages`에 내려받아 설치합니다.
직접 만드는 확장(`src/extensions`)과 섞이지 않으며, `src/packages` 안은 설치기만 고칩니다.
`extensions/store`를 설치하지 않은 사이트에서도 동작하며, Store의 구현이나 DB를 참조하지 않고 Store의 HTTP API만 씁니다.

## 설치는 개발 환경에서만

확장은 소스 코드입니다. 로컬 개발 환경에서 설치해 확인한 뒤 커밋하고, 운영 서버에는 평소의 배포(빌드)로 들어갑니다.
운영 환경(`NODE_ENV=production`)에서는 연결·설치·제거를 거절하고 목록 조회만 합니다.

## 쓰는 법

1. Store(기본 `https://gjworks.dev`)에 로그인해 계정 설정 > 액세스 토큰에서 `Store 자료 설치` 권한의 토큰을 만들어 복사합니다.
2. 관리자 > 쉬운 설치 > 연결 관리에 Store 주소와 토큰을 넣어 연결합니다.
3. Store 자료 탭에서 설치합니다. 이미 설치한 패키지는 같은 버튼으로 업데이트합니다.
   DB를 바꾸는 패키지는 적용될 SQL을 먼저 보여 주며, `설치하고 DB에 적용`을 누르면 테이블까지 만들어집니다.
4. 동작을 확인하고 커밋합니다.

관리자 화면 없이 명령 줄로도 같은 일을 합니다(Node 22.18 이상, 프로젝트 루트에서 실행).

```sh
npm run plextype -- connect [--store <주소>]    # 토큰은 PLEXTYPE_STORE_TOKEN 환경 변수 또는 입력
npm run plextype -- list
npm run plextype -- install <패키지ID>          # DB 변경이 있으면 SQL을 보여 주고 묻는다 (--yes로 묻지 않음)
npm run plextype -- migrate                     # 설치한 패키지의 DB 변경을 나중에 적용
npm run plextype -- remove <패키지ID>
npm run plextype -- status | keys | disconnect
```

## 설치할 때 확인하는 것

`lib/storeInstall.ts`가 아래를 모두 통과한 뒤에만 파일을 씁니다. 하나라도 어긋나면 아무것도 바꾸지 않습니다.

- **서명**: 패키지 정보(manifest, ZIP 해시, 크기)의 Ed25519 서명을, 연결할 때 Store에서 받아 보관한 공개 키로 확인합니다.
  내려받은 패키지에 함께 들어 있는 공개 키는 쓰지 않습니다. Store가 키를 바꾸면 연결 관리의 `서명 키 다시 받기`로 갱신합니다.
- **무결성**: 내려받은 ZIP의 크기와 SHA-256, 그리고 풀어낸 파일 하나하나의 크기와 SHA-256이 서명된 목록과 같아야 합니다.
- **호환 버전**: `src/core/plextype.json`의 버전이 패키지의 최소·최대 Plextype 버전 안에 있어야 합니다.
- **자리 충돌**: `src/packages/<패키지ID>`가 이미 있는데 쉬운 설치로 넣은 같은 자료가 아니면 덮어쓰지 않습니다.
  패키지의 라우트가 손으로 쓴 파일이나 다른 확장의 연결 파일과 겹쳐도 멈춥니다.
- **경로**: 프로젝트 밖을 가리키는 경로, 링크, `.env*`, `.git`, `node_modules` 등은 받지 않습니다.

통과하면 폴더를 통째로 바꾸고, 패키지의 `routes.json`대로 `src/app`에 연결 파일을 씁니다
(`npm run extensions:sync`가 만드는 것과 같은 내용). 이전 버전에만 있던 연결 파일은 지웁니다.
쓰는 도중 실패하면 설치 전 상태로 되돌립니다. 패키지에 들어 있는 스크립트는 실행하지 않습니다.

## DB 변경

패키지는 `prisma/` 폴더에 스키마와 마이그레이션을 담아 옵니다. 프로젝트의 `scripts/sync-prisma.mjs`가 코어·확장의 것과 함께
`src/packages`의 것도 한 스키마와 한 마이그레이션 폴더로 합치므로, 운영 서버에는 평소의 배포 절차로 적용됩니다.

개발 DB에는 확인을 받은 뒤 `lib/applyDatabase.ts`가 두 단계를 실행합니다.

1. `npm run prisma:generate`: 스키마를 합치고 Prisma 클라이언트를 다시 만듭니다. DB는 건드리지 않습니다.
2. `npm run migrate:deploy`: 아직 적용되지 않은 마이그레이션을 적용합니다.

설치기에서 명령을 실행하는 곳은 이 파일뿐이며, 프로젝트의 npm 스크립트만 실행하고 패키지에서 온 값을 인자로 넘기지 않습니다.

- 1단계에서 실패하면(예: 마이그레이션 이름이 다른 것과 겹침) DB는 그대로이므로, 새로 설치한 패키지는 다시 빼서 설치 전으로 되돌립니다.
- 2단계에서 실패하면 일부가 적용됐을 수 있어 되돌리지 않습니다. 원인을 고친 뒤 `npm run plextype -- migrate`로 다시 적용하거나 패키지를 제거합니다.
- 패키지가 새 Prisma 모델을 쓴다면 적용 후 개발 서버를 다시 시작해야 합니다. 실행 중인 서버는 이전에 만든 클라이언트를 계속 쥐고 있습니다.
- 패키지를 제거해도 그 패키지가 만든 테이블과 마이그레이션 적용 이력은 DB에 남습니다. 폴더에서는 사라지므로
  `prisma migrate dev`가 이력이 어긋났다고 알릴 수 있습니다. 필요 없으면 테이블을 직접 정리합니다.

## 자동 등록

패키지 루트에 `registry.ts` 또는 `registry.tsx`가 있으면, 그 파일이 `export default`로 내보낸 등록 내용
(`defineExtensionRegistry`와 같은 모양: modules, postSkins, postLayouts, adminLayouts, userSkins)을 설치와 함께 등록합니다.
설치기는 설치·제거 때마다 `src/packages/index.ts`를 다시 만들고, 코어(`src/core/registry/coreRegistry.tsx`)가 그 목록을 읽습니다.
같은 key를 `src/extensions/registry.tsx`에도 등록하면 그쪽이 이깁니다.

## 프로젝트에 남는 것

- `src/packages/<패키지ID>/`: 설치된 소스. `plextype.package.json`이 설치된 패키지 목록의 근거입니다.
- `src/packages/index.ts`: 설치기가 다시 만드는 등록 목록.
- `.plextype/store.json`: Store 주소, 액세스 토큰, 서명 검증 키. 소유자만 읽을 수 있게 저장하며 `.gitignore`에 들어 있습니다.
- `.plextype/backup/`: 업데이트·제거 전의 폴더. 자동으로 지우지 않으므로 필요 없으면 직접 지웁니다.

설치된 패키지 목록의 `서명 미검증`은 설치 이후 파일이 바뀌었는지는 검사하지 않는다는 뜻입니다. 서명과 무결성은 설치하는 순간에만 확인합니다.

## 아직 없는 것

- 패키지를 제거할 때 그 패키지의 테이블을 지우는 일
- 패키지 사이의 의존 관계 확인
- 설치된 파일이 이후에 바뀌었는지 검사

## 검증

```sh
node --test scripts/installer.test.mjs scripts/store-install.test.mjs
npx tsc --noEmit --incremental false
```
