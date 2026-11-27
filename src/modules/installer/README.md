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
npm run plextype -- core                        # 코어를 Store의 새 배포본으로 올리기 (--yes, --overwrite, --install)
npm run plextype -- agents                      # AGENTS.md를 만들거나 그 안의 Plextype 규칙 구역 갱신
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

설치기에서 명령을 실행하는 곳은 이 파일뿐이며, 프로젝트의 npm 스크립트와 코어 업데이트의 `npm install`만 실행하고 패키지나 배포본에서 온 값을 인자로 넘기지 않습니다.

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

패키지 루트에 `socialProviders.ts`가 있으면, 그 파일이 `export default`로 내보낸 소셜 로그인 제공자도 연결됩니다.
설치기가 `src/packages/installedSocialProviders.ts`를 다시 만들고, 소셜 로그인(`src/modules/user/social/registry.ts`)이 그 목록을 읽습니다.

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

## 코어 업데이트

`lib/coreUpdate.ts`가 Store의 코어 배포본으로 코어 파일을 새 버전으로 올립니다. `git merge upstream/main`을 대신하는 길이며,
원본 저장소(`.github/workflows/sync-to-plextype.yml`이 있는 곳)에서는 거절합니다. 쓰는 사람을 위한 안내는 `/docs/easy-install`에 있습니다.

배포본은 코어 파일 전체의 ZIP과 서명된 정보(파일별 SHA-256이 든 manifest, ZIP 해시, 크기)입니다. 확장 패키지와 같은 키로 서명되고
같은 방식으로 검증하며, manifest의 `type`이 `plextype-core`라 패키지의 서명을 코어로 쓸 수 없습니다.

- **넣을 수 없는 경로**: `isExcludedFromCore`가 정합니다(확장, 설치된 패키지, `public`, 합쳐 만드는 Prisma 결과물 등).
  만드는 쪽(`scripts/publish-core.mjs`), 등록받는 쪽(Store), 받는 쪽(설치기)이 이 규칙 하나를 함께 씁니다.
- **바꿀 파일 정하기**: 지금 버전의 배포본(기준), 새 버전의 배포본, 프로젝트의 파일을 파일 단위로 견줍니다.
  프로젝트의 파일이 기준과 같으면 새 버전대로 쓰거나 지우고, 기준과 다르지만 새 버전이 건드리지 않았으면 그대로 두며,
  양쪽이 다 바꿨으면 충돌로 알립니다. 충돌은 사람이 `keep`(내 파일을 두고 새 버전의 내용을 `.plextype/reference/core-<버전>`에 받음)과
  `overwrite` 가운데 정합니다.
- **기준이 없을 때**: 지금 버전의 배포본이 Store에 없으면 내용이 다른 파일이 모두 충돌로 잡히고 `overwrite`만 받습니다.
  새 버전에서 없어진 파일은 알 수 없어 남습니다.
- **package.json**: `name`과 `version`을 뺀 내용의 해시(`packageJsonCoreSha256`)로 견주고, 쓸 때 프로젝트의 두 값을 남깁니다.
- **되돌리기**: 바뀌거나 지워지는 파일을 `.plextype/backup/core-<이전 버전>-…`으로 옮긴 뒤 새 파일을 놓습니다. 지우기를 먼저 해서,
  파일이 같은 이름의 폴더로 바뀌거나 이름의 대소문자만 바뀐 경우에도 새 파일을 놓을 수 있습니다. 쓰는 도중 실패하면 적용 전으로
  되돌리고, 되돌리지 못한 파일이 있으면 백업 폴더를 남겨 그 위치를 알립니다.
- **대소문자**: 대소문자를 구분하지 않는 파일 시스템에서 이름의 대소문자만 다른 파일을 같은 파일로 잘못 보지 않도록, 폴더에 실제로 적힌 이름으로
  파일이 있는지 판단합니다. 폴더 이름의 대소문자만 바뀐 경우는 다루지 않습니다.
- **알려진 한계**: 폴더였던 자리가 새 버전에서 파일이 되면 적용을 막습니다. 동시에 두 번 적용하는 것을 막는 잠금은 없습니다.
- **마무리**: 고른 경우에만 `lib/applyDatabase.ts`의 `finishCoreUpdate`가 `npm install`(라이브러리 버전이 달라질 때),
  `npm run prisma:generate`, `npm run migrate:deploy`(새 코어 마이그레이션이 있을 때)를 차례로 실행합니다. 한 단계가 실패하면 멈추고
  남은 명령을 알리며, 파일은 새 버전으로 둡니다. 고르지 않으면 할 일로만 알립니다(`coreUpdateNextSteps`).
  확장 패키지의 npm 라이브러리는 제3자가 정한 것이라 넣지 않지만, 코어의 `package.json`은 Store가 서명한 공식 배포본의 것이라 실행합니다.
- **하지 않는 것**: 개발 서버 다시 시작, 빌드 확인, 운영 DB 적용.

### AGENTS.md

`lib/agentsFile.ts`가 프로젝트 루트의 `AGENTS.md`에 Plextype의 공통 규칙을 넣고 최신으로 유지합니다. 코어 업데이트를 적용할 때와
`npm run plextype -- agents`에서 부릅니다.

- **원본**: 코어 파일 `src/core/agents/plextype-rules.md` 하나입니다. 문서 사이트의 예시도 이 파일에서 만들어집니다(`src/extensions/docs/markdown.tsx`의 `{{AGENTS.md}}`).
  규칙을 고칠 때는 이 파일만 고칩니다.
- **바꾸는 범위**: `<!-- plextype:rules:begin -->`과 `<!-- plextype:rules:end -->` 사이뿐입니다. `AGENTS.md`는 프로젝트의 파일이라
  코어 업데이트의 파일 견주기에 넣지 않고, 표시 밖의 내용(첫 줄의 언어 규칙 포함)은 건드리지 않습니다.
- **파일이 없으면** 언어 규칙, 구역, 프로젝트 규칙을 쓸 자리로 된 파일을 만듭니다.
- **표시가 없거나 짝이 맞지 않으면** 어디까지가 공통 규칙인지 알 수 없어 그대로 두고, 최신 내용의 파일을 `.plextype/reference/…/AGENTS.md`에 받아 둔 뒤 위치를 알립니다.
- 구역을 바꾸기 전의 파일은 `.plextype/backup`에 남깁니다.

## 프로젝트에 남는 것

- `src/packages/<패키지ID>/`: 설치된 소스. `plextype.package.json`이 설치된 패키지 목록의 근거입니다.
- `src/packages/index.ts`: 설치기가 다시 만드는 등록 목록.
- `.plextype/store.json`: Store 주소, 액세스 토큰, 서명 검증 키. 소유자만 읽을 수 있게 저장하며 `.gitignore`에 들어 있습니다.
- `.plextype/reference/`: 가져온 시점의 사본과, 비교용으로 받은 새 버전. 코어 업데이트에서 그대로 둔 파일의 새 버전 내용(`core-<버전>`)도 여기에 둡니다.
- `.plextype/backup/`: 업데이트·제거·가져오기 취소 전의 폴더와, 코어 업데이트로 바뀌거나 지워진 파일. 자동으로 지우지 않으므로 필요 없으면 직접 지웁니다.

설치된 패키지 목록의 `서명 미검증`은 설치 이후 파일이 바뀌었는지는 검사하지 않는다는 뜻입니다. 서명과 무결성은 설치하는 순간에만 확인합니다.

## 아직 없는 것

- 패키지를 제거할 때 그 패키지의 테이블을 지우는 일
- 설치된 파일이 이후에 바뀌었는지 검사
- 코어 배포본의 보안 패치 표시

## 검증

```sh
node --test scripts/installer.test.mjs scripts/store-install.test.mjs scripts/core-update.test.mjs
npx tsc --noEmit --incremental false
```
