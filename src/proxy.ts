import { createProxy } from "@core/proxy/defaultProxy";
import { proxyExtension } from "@extensions/proxy";

// @extensions/proxy는 src/extensions/proxy.ts가 있으면 그 파일을, 없으면 코어 기본값(확장 없음)을 가리킨다.
// matcher처럼 Next.js가 정적으로 읽는 설정은 다른 파일에서 가져오지 않고 이 파일에 직접 적는다.
export const proxy = createProxy(proxyExtension);
