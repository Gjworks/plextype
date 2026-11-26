// 설치한 패키지의 DB 변경을 개발 DB에 적용하고, 코어 업데이트를 받은 뒤의 마무리(npm install, DB 적용)를 실행한다.
//
// 설치기에서 명령을 실행하는 곳은 이 파일 하나다. 실행하는 명령은 이 프로젝트의 npm 스크립트 두 개와 `npm install`로
// 고정되어 있고, 패키지나 배포본에서 온 값은 인자로 넘기지 않는다. 패키지가 하는 일은 src/packages 아래에 스키마와
// 마이그레이션 파일을 놓는 것까지이며, 그 파일을 합쳐 적용하는 것은 프로젝트의 기존 절차(scripts/sync-prisma.mjs, prisma migrate deploy)다.
//
// `npm install`은 코어 업데이트에서만, 사람이 고른 경우에만 실행한다. 코어의 package.json은 Store가 서명한 공식 배포본에서
// 온 것이라 코어 코드와 신뢰 수준이 같다. 확장 패키지가 요구하는 라이브러리는 제3자가 정한 것이라 여기서 넣지 않는다.
//
// storeInstall.ts와 같은 이유로 Node 내장 모듈만 import하고 지워지는 타입 문법만 쓴다.

import { spawn } from "node:child_process";

import { InstallerError, assertInstallAllowed } from "./storeInstall.ts";

// 스키마를 합쳐 클라이언트를 만들고(DB는 건드리지 않음), 이어서 아직 적용되지 않은 마이그레이션을 적용한다.
const STEPS = [
  { script: "prisma:generate", label: "스키마를 합치고 Prisma 클라이언트를 만드는" },
  { script: "migrate:deploy", label: "마이그레이션을 DB에 적용하는" },
];
const STEP_TIMEOUT = 180_000;
// 라이브러리를 새로 내려받는 시간. 느린 네트워크에서도 끝나도록 npm 스크립트보다 길게 잡는다.
const INSTALL_TIMEOUT = 600_000;
const INSTALL_ARGS = ["install", "--no-audit", "--no-fund"];
// 실패했을 때 보여 줄 출력의 끝부분 길이.
const OUTPUT_TAIL = 2_000;

export type DatabaseApplyResult = { applied: boolean; failedStep: "generate" | "migrate" | null; output: string };

function npm(root: string, args: string[], timeout: number) {
  return new Promise<{ code: number | null; output: string }>((resolve) => {
    const child = spawn("npm", args, { cwd: root, env: process.env, stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    const collect = (chunk: Buffer) => { output = (output + chunk.toString("utf8")).slice(-OUTPUT_TAIL * 4); };
    child.stdout.on("data", collect);
    child.stderr.on("data", collect);
    const timer = setTimeout(() => child.kill(), timeout);
    child.on("error", () => { clearTimeout(timer); resolve({ code: null, output: output || "npm을 실행하지 못했습니다." }); });
    child.on("close", (code) => { clearTimeout(timer); resolve({ code, output }); });
  });
}

const run = (root: string, script: string) => npm(root, ["run", "--silent", script], STEP_TIMEOUT);

// 접속 주소 등 민감한 값이 화면에 나가지 않게 가린다.
const redact = (text: string) => text.replace(/\b[a-z][a-z0-9+.-]*:\/\/[^\s"'@]+@/gi, "***://***@").slice(-OUTPUT_TAIL).trim();

export async function applyPackageDatabase(root: string): Promise<DatabaseApplyResult> {
  assertInstallAllowed();
  const [generate, migrate] = STEPS;
  const first = await run(root, generate.script);
  if (first.code !== 0) return { applied: false, failedStep: "generate", output: redact(first.output) };
  const second = await run(root, migrate.script);
  if (second.code !== 0) return { applied: false, failedStep: "migrate", output: redact(second.output) };
  return { applied: true, failedStep: null, output: redact(second.output) };
}

// 패키지를 뺀 뒤, 합쳐 둔 스키마와 클라이언트에서 그 패키지의 모델을 덜어 낸다. DB는 건드리지 않는다.
export async function syncPackageSchema(root: string) {
  assertInstallAllowed();
  const result = await run(root, STEPS[0].script);
  return result.code === 0;
}

export function describeDatabaseFailure(result: DatabaseApplyResult) {
  const step = STEPS[result.failedStep === "generate" ? 0 : 1];
  return new InstallerError(`${step.label} 중 실패했습니다.\n${result.output}`);
}

export type CoreFinishResult = {
  completed: boolean;
  // 실행을 마친 명령과, 실패했거나 아직 실행하지 않은 명령. 사람이 이어서 실행할 수 있게 그대로 보여 준다.
  ran: string[];
  remaining: string[];
  output: string;
};

// 코어 업데이트로 파일을 바꾼 뒤의 마무리. 라이브러리 버전이 달라졌으면 npm install을, 이어서 스키마를 합쳐 클라이언트를 만들고,
// 새 코어 마이그레이션이 있으면 개발 DB에 적용한다. 한 단계가 실패하면 거기서 멈춘다: 뒤의 단계는 앞 단계의 결과가 있어야 한다.
// 개발 서버는 다시 시작하지 않는다. 실행 중인 서버는 이전 라이브러리와 Prisma 클라이언트를 쥐고 있으므로 사람이 다시 시작한다.
export async function finishCoreUpdate(root: string, changes: { dependencies: string[]; migrations: string[] }): Promise<CoreFinishResult> {
  assertInstallAllowed();
  const [generate, migrate] = STEPS;
  const steps = [
    ...(changes.dependencies.length > 0 ? [{ command: "npm install", start: () => npm(root, INSTALL_ARGS, INSTALL_TIMEOUT) }] : []),
    { command: `npm run ${generate.script}`, start: () => run(root, generate.script) },
    ...(changes.migrations.length > 0 ? [{ command: `npm run ${migrate.script}`, start: () => run(root, migrate.script) }] : []),
  ];
  const ran: string[] = [];
  for (const [index, step] of steps.entries()) {
    const result = await step.start();
    if (result.code !== 0) return { completed: false, ran, remaining: steps.slice(index).map((item) => item.command), output: redact(result.output) };
    ran.push(step.command);
  }
  return { completed: true, ran, remaining: [], output: "" };
}
