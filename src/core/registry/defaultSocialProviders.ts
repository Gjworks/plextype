import type { ProviderDefinition } from "@/modules/user/social/providers";

// src/extensions/socialProviders.ts가 없는 프로젝트에서 @extensions/socialProviders가 가리키는 기본값.
export const socialProviders: ProviderDefinition[] = [];

// src/packages/installedSocialProviders.ts가 없는 프로젝트에서 @packages/installedSocialProviders가 가리키는 기본값.
// 그 파일은 쉬운 설치가 패키지를 설치·제거할 때 만들고 코어 배포본에는 들지 않으므로,
// 코어 업데이트로 이 버전을 받은 프로젝트에는 다음 설치·제거 전까지 없다.
export const installedSocialProviders: ProviderDefinition[][] = [];
