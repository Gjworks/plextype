import "server-only";

import { socialProviders as extensionProviders } from "@extensions/socialProviders";
import { installedSocialProviders } from "@packages/installedSocialProviders";

import { BUILT_IN_PROVIDERS, mergeProviders } from "./providers";

// 이 사이트에서 쓸 수 있는 제공자. 코어의 기본 제공자 뒤에 쉬운 설치 패키지(루트의 socialProviders.ts)와
// 프로젝트 확장(src/extensions/socialProviders.ts)이 등록한 것을 잇는다. 같은 key는 뒤쪽이 대신한다.
// 제공자 정의는 시크릿을 다루는 서버 코드라 화면 쪽 묶음에 들어가지 않도록 이 파일은 서버에서만 가져온다.
export const PROVIDERS = mergeProviders(BUILT_IN_PROVIDERS, ...installedSocialProviders, extensionProviders);

const byKey = new Map(PROVIDERS.map((provider) => [provider.key, provider]));

export const findProvider = (key: string) => byKey.get(key) ?? null;
