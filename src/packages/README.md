# 설치한 패키지

쉬운 설치(관리자 화면 또는 `npm run plextype`)가 Store에서 받은 패키지를 두는 곳입니다.
이 폴더 안의 내용은 설치기가 관리하므로 직접 고치지 않습니다. 업데이트하면 폴더가 통째로 바뀝니다.

- `<패키지ID>/`: 설치된 패키지의 소스. `plextype.package.json`에 버전과 파일 목록이 있습니다.
- `index.ts`: 설치된 패키지 가운데 `registry.ts(x)`를 가진 것의 등록 목록. 설치·제거 때마다 다시 만듭니다.
  코어(`src/core/registry/coreRegistry.tsx`)가 이 목록을 읽어, 패키지의 관리자 메뉴와 스킨을 따로 등록하지 않아도 쓰게 합니다.

직접 만드는 기능은 `src/extensions`에 둡니다. 패키지를 고쳐 쓰려면 여기서 고치지 말고 둘 중 하나를 씁니다.

- 등록된 단위(스킨의 화면, 레이아웃, 메뉴)만 바꿀 때: `src/extensions`에 만들어 같은 key로 등록합니다. 같은 key는 `src/extensions/registry.tsx` 쪽이 이깁니다.
- 안쪽까지 고칠 때: 쉬운 설치의 `내 확장으로 가져오기`로 패키지를 `src/extensions`로 옮깁니다.

설치와 검증의 자세한 내용은 `src/modules/installer/README.md`를 봅니다.
