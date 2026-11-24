// 설치한 패키지의 DB 변경을 개발 DB에 적용한다.
//
// 설치기에서 명령을 실행하는 곳은 이 파일 하나다. 실행하는 명령은 이 프로젝트의 npm 스크립트 두 개로 고정되어 있고,
// 패키지에서 온 값은 인자로 넘기지 않는다. 패키지가 하는 일은 src/packages 아래에 스키마와 마이그레이션 파일을
// 놓는 것까지이며, 그 파일을 합쳐 적용하는 것은 프로젝트의 기존 절차(scripts/sync-prisma.mjs, prisma migrate deploy)다.
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
// 실패했을 때 보여 줄 출력의 끝부분 길이.
const OUTPUT_TAIL = 2_000;

export type DatabaseApplyResult = { applied: boolean; failedStep: "generate" | "migrate" | null; output: string };

function run(root: string, script: string) {
  return new Promise<{ code: number | null; output: string }>((resolve) => {
    const child = spawn("npm", ["run", "--silent", script], { cwd: root, env: process.env, stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    const collect = (chunk: Buffer) => { output = (output + chunk.toString("utf8")).slice(-OUTPUT_TAIL * 4); };
    child.stdout.on("data", collect);
    child.stderr.on("data", collect);
    const timer = setTimeout(() => child.kill(), STEP_TIMEOUT);
    child.on("error", () => { clearTimeout(timer); resolve({ code: null, output: output || "npm을 실행하지 못했습니다." }); });
    child.on("close", (code) => { clearTimeout(timer); resolve({ code, output }); });
  });
}

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
