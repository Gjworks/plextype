# 쉬운 설치

Plextype 기본 관리자 모듈입니다. Store에 올라온 확장 패키지를 이 프로젝트의 `src/packages`에 내려받아 설치합니다.
직접 만드는 확장(`src/extensions`)과 섞이지 않으며, `src/packages` 안은 설치기만 고칩니다.
`extensions/store`를 설치하지 않은 사이트에서도 동작하며, Store의 구현이나 DB를 참조하지 않고 Store의 HTTP API만 씁니다.

쓰는 사람을 위한 안내는 문서 사이트의 `/docs/easy-install`, 패키지를 만드는 사람을 위한 안내는 `/docs/packages`에 있습니다
(`src/extensions/docs/_docs/`). 이 문서는 설치기의 동작과 유지보수를 다룹니다.

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
npm run plextype -- adopt <패키지ID>            # 내 확장으로 가져오기
npm run plextype -- reference <패키지ID>        # 가져온 패키지의 새 버전을 비교용으로 받기
npm run plextype -- mark <패키지ID> <버전>      # 새 버전을 반영한 뒤 기준 버전 올리기
npm run plextype -- discard <패키지ID>          # 가져오기 취소
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

## 설치 전 점검

패키지는 필요한 것을 `plextype.requires.json`에 적고, Store가 이를 서명된 정보에 넣습니다(형식은 `src/extensions/store/README.md`).
설치 버튼을 누르면 설치기가 아래를 점검해 한 화면에 보여 줍니다.

| 점검 | 맞지 않을 때 |
|---|---|
| Plextype 버전 | 설치하지 않습니다. |
| Node 버전 | 설치하지 않습니다. |
| 다른 Store 패키지 | 없거나 버전이 낮으면 목록을 보여 주고 함께 설치합니다. Store에 없거나 Store의 최신 버전이 모자라면 설치하지 않습니다. |
| npm 라이브러리 | 설치는 진행합니다. 프로젝트에 없는 것은 넣는 명령을 보여 주고, 버전이 맞지 않는 것은 경고합니다. |

- npm 라이브러리는 설치기가 넣지 않습니다. 외부 코드를 받아 실행하는 일이라 보여 준 명령을 사람이 실행합니다.
  프로젝트 전용 라이브러리를 두는 `src/extensions/package.json`이 있으면 명령에 `-w src/extensions`가 붙습니다.
- 필요한 패키지는 설치 순서대로(필요로 하는 쪽이 나중에) 설치합니다. 중간에 실패하면 이번에 새로 넣은 패키지는 다시 뺍니다.
- 점검한 뒤 Store의 버전이 바뀌었으면 설치하지 않고 다시 확인하게 합니다.
- 다른 설치된 패키지가 필요로 하는 패키지는 제거할 수 없습니다. 필요로 하는 쪽을 먼저 제거합니다.

## 자동 등록

패키지 루트에 `registry.ts` 또는 `registry.tsx`가 있으면, 그 파일이 `export default`로 내보낸 등록 내용
(`defineExtensionRegistry`와 같은 모양: modules, postSkins, postLayouts, adminLayouts, userSkins)을 설치와 함께 등록합니다.
설치기는 설치·제거 때마다 `src/packages/index.ts`를 다시 만들고, 코어(`src/core/registry/coreRegistry.tsx`)가 그 목록을 읽습니다.
같은 key를 `src/extensions/registry.tsx`에도 등록하면 그쪽이 이깁니다.

패키지 루트에 `triggers.ts`가 있으면, 그 파일이 `export default`로 내보낸 트리거도 같은 방식으로 연결됩니다.
설치기가 `src/packages/installedTriggers.ts`를 다시 만들고, 트리거 허브(`src/core/utils/trigger/triggerHub.ts`)가 그 목록을 읽습니다.
핸들러는 서버 코드라 화면 쪽에서도 불러오는 `index.ts`와 목록을 나눕니다.

패키지 루트에 `loginProviders.ts` 또는 `loginProviders.tsx`가 있으면, 그 파일이 `export default`로 내보낸 로그인 수단도 연결됩니다.
설치기가 `src/packages/installedLoginProviders.ts`를 다시 만들고, 로그인·가입 화면(`src/core/utils/auth/loginProviders.ts`)이 그 목록을 읽습니다.

## 패키지를 고쳐 쓸 때

`src/packages` 안은 업데이트할 때 통째로 바뀌므로 직접 고치는 곳이 아닙니다. 고쳐 쓰는 길은 둘입니다.

| 원하는 것 | 방법 | 업데이트 |
|---|---|---|
| 스킨의 화면, 레이아웃, 메뉴처럼 등록된 단위만 교체 | `src/extensions`에 만들어 같은 key로 등록합니다. | 버튼으로 계속 받습니다. |
| 패키지 안쪽까지 자유롭게 수정 | 설치된 패키지에서 `내 확장으로 가져오기`를 누릅니다. | 알림만 받고 직접 반영합니다. |

**가져오기**는 패키지를 `src/extensions/<패키지ID>`로 옮기고, 패키지 안에서 자기 위치를 가리키던 경로와 `src/app`의 연결 파일을
새 위치로 고칩니다. 폴더에 `plextype.adopted.json`(어느 Store 패키지의 몇 버전에서 왔는지)을 남기며, 이 파일이 있는 동안 설치기는

- 그 패키지를 설치하거나 업데이트하지 않고,
- 다른 패키지가 필요로 할 때는 기록된 버전으로 설치된 것과 같이 보며,
- `registry` 파일이 있으면 계속 자동으로 등록하고,
- Store에 새 버전이나 보안 패치가 나오면 알립니다.

새 버전은 `새 버전 받아 두기`로 `.plextype/reference/<패키지ID>-<버전>`에 받습니다. 가져온 시점의 사본도 같은 곳에 있어
두 폴더를 비교하면(`git diff --no-index`) 새 버전에서 바뀐 것만 볼 수 있습니다. 변경을 내 확장에 반영한 뒤 `반영 완료`로 기준 버전을 올립니다.
보안 패치도 자동으로 들어오지 않습니다. 쉬운 설치의 모든 탭 맨 위에 알림이 뜨며, 같은 방법으로 직접 반영해야 합니다.

`가져오기 취소`는 고쳐 쓰던 폴더를 `.plextype/backup`으로 옮기고 Store의 패키지를 다시 설치할 수 있는 상태로 돌립니다.

**직접 고친 파일 감지**: `src/packages` 안의 파일을 고친 채로 업데이트하려 하면, 설치 전 점검이 고친·지운·추가한 파일을 보여 주고
덮어쓸지 묻습니다. 덮어쓰면 이전 폴더는 `.plextype/backup`에 남습니다.

## 프로젝트에 남는 것

- `src/packages/<패키지ID>/`: 설치된 소스. `plextype.package.json`이 설치된 패키지 목록의 근거입니다.
- `src/packages/index.ts`: 설치기가 다시 만드는 등록 목록.
- `.plextype/store.json`: Store 주소, 액세스 토큰, 서명 검증 키. 소유자만 읽을 수 있게 저장하며 `.gitignore`에 들어 있습니다.
- `.plextype/reference/`: 가져온 시점의 사본과, 비교용으로 받은 새 버전.
- `.plextype/backup/`: 업데이트·제거·가져오기 취소 전의 폴더. 자동으로 지우지 않으므로 필요 없으면 직접 지웁니다.

설치된 패키지 목록의 `서명 미검증`은 설치 이후 파일이 바뀌었는지는 검사하지 않는다는 뜻입니다. 서명과 무결성은 설치하는 순간에만 확인합니다.

## 아직 없는 것

- 패키지를 제거할 때 그 패키지의 테이블을 지우는 일
- 설치된 파일이 이후에 바뀌었는지 검사

## 검증

```sh
node --test scripts/installer.test.mjs scripts/store-install.test.mjs
npx tsc --noEmit --incremental false
```
