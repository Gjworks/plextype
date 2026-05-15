/**
 * 🌟 [plextype] 커스텀 트리거 핸들러 등록 센터
 * * 사용법:
 * 1. 이 폴더에 새로운 핸들러 파일(예: slack.ts)을 만듭니다.
 * 2. 아래에 'export * from "./파일이름";'을 추가하세요.
 * * 예시:
 * export * from "./slackHandlers";
 * export * from "./logHandlers";
 */

// 💡 등록된 핸들러가 없을 때 엔진 오류를 방지하기 위한 기본 내보내기
export const test = "ok";