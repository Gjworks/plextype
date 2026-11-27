// 쉬운 설치가 만드는 파일. 직접 고치지 않는다. 패키지를 설치·제거하거나 내 확장으로 가져올 때마다 다시 만든다.
import type { ExtensionRegistryConfig } from "@/core/registry/define";

export const installedPackages: ExtensionRegistryConfig[] = [];
