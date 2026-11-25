// 쉬운 설치 패키지가 코어 이벤트 뒤에 실행할 일을 등록하는 형식.
// 패키지는 루트의 triggers.ts에서 defineTriggers의 결과를 export default로 내보내고,
// 설치기가 그것을 src/packages/installedTriggers.ts에 모아 트리거 허브(triggerHub.ts)가 읽는다.

// 이벤트를 일으킨 쪽이 넘기는 값. withTrigger로 감싼 액션은 인자(args)와 결과(result)를 넘긴다.
export type TriggerContext = { args?: unknown[]; result?: any; [key: string]: any };

// data는 map을 result에 대어 만든 값이다. map이 없으면 빈 객체이므로 context.result를 직접 읽는다.
export type TriggerHandler = (data: Record<string, any>, context: TriggerContext) => Promise<void> | void;

export type TriggerRegistration = {
  // 이름 대신 함수를 직접 넘긴다. 이름으로 찾으면 여러 패키지의 핸들러 이름이 겹칠 수 있다.
  handler: TriggerHandler;
  // trigger.json의 map과 같은 규칙: result 안의 경로("data.content") 또는 "{{경로}}"가 든 문자열.
  map?: Record<string, unknown>;
};

// key는 이벤트 이름(예: "comment.saved").
export type PackageTriggers = Record<string, TriggerRegistration[]>;

export const defineTriggers = (config: PackageTriggers) => config;
