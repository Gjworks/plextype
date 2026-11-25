import type { LoginProviderSource } from "@/core/registry/defineLoginProviders";

// src/extensions/loginProviders.ts가 없는 프로젝트에서 @extensions/loginProviders가 가리키는 기본값.
export const loginProviders: LoginProviderSource[] = [];
