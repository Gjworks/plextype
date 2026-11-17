import type { ProxyExtension } from "./defaultProxy";

// src/extensions/proxy.ts가 없는 프로젝트에서 @extensions/proxy가 가리키는 기본값.
// 확장이 없으면 코어 proxy만 동작한다.
export const proxyExtension: ProxyExtension | null = null;
