// 프로젝트 루트의 AGENTS.md(코딩 에이전트가 읽는 규칙 파일)에 Plextype의 공통 규칙을 넣고 최신으로 유지한다.
//
// AGENTS.md는 프로젝트의 파일이다. 설치기가 바꾸는 것은 두 표시 사이의 구역뿐이고, 표시 밖에 쓴 프로젝트의 규칙은 건드리지 않는다.
// 구역에 들어갈 내용의 원본은 코어 파일(AGENTS_RULES_FILE) 하나이며, 코어 업데이트로 함께 올라온다.
// 문서 사이트의 "AGENTS.md 작성" 예시도 같은 파일에서 만든다(src/extensions/docs/markdown.tsx).
//
// storeInstall.ts와 같은 이유로 Node 내장 모듈만 import하고 지워지는 타입 문법만 쓴다.

import fs from "node:fs/promises";
import path from "node:path";

import { assertInstallAllowed, statePath } from "./storeInstall.ts";

export const AGENTS_FILE = "AGENTS.md";
export const AGENTS_RULES_FILE = "src/core/agents/plextype-rules.md";

const BEGIN = "<!-- plextype:rules:begin -->";
const END = "<!-- plextype:rules:end -->";
const NOTE = "<!-- 이 표시 사이는 Plextype 코어 업데이트가 최신 내용으로 바꾼다. 직접 고치지 않고, 프로젝트의 규칙은 표시 밖에 쓴다. -->";
// 에이전트가 가장 먼저 읽어야 하는 언어 규칙. 구역 밖의 첫 줄에 두어, 프로젝트가 다른 언어로 바꿔도 갱신 때 되돌아가지 않게 한다.
const LANGUAGE_RULE = "Think and work in English. Reply in Korean.";

const renderBlock = (rules: string) => [BEGIN, NOTE, "", rules.trim(), "", END].join("\n");

// 새로 만드는 AGENTS.md의 전체 내용.
export function renderAgentsFile(rules: string) {
  return [
    LANGUAGE_RULE,
    "",
    renderBlock(rules),
    "",
    "---",
    "",
    "## 이 프로젝트의 규칙",
    "",
    "- 프로젝트 이름, 배포 방식, 검증 명령처럼 이 프로젝트에만 해당하는 규칙을 여기에 쓴다.",
    "- 위 Plextype 규칙과 다르게 해야 하는 예외가 있으면 이유와 함께 여기에 적는다.",
    "",
  ].join("\n");
}

export type AgentsFileStatus =
  // 파일이 없어 새로 만든다.
  | "created"
  // 구역의 내용을 바꾼다.
  | "updated"
  // 구역이 이미 최신이다.
  | "unchanged"
  // 파일은 있는데 구역 표시가 없거나 짝이 맞지 않는다. 어디가 공통 규칙인지 알 수 없어 그대로 둔다.
  | "manual"
  // 그 자리에 파일이 아닌 것(폴더, 링크)이 있다.
  | "skipped";

// 지금의 AGENTS.md 내용으로 할 일과 쓸 내용을 정한다. current가 null이면 파일이 없는 것이다.
export function planAgentsFile(current: string | null, rules: string): { status: AgentsFileStatus; content: string | null } {
  if (current === null) return { status: "created", content: renderAgentsFile(rules) };
  const begin = current.indexOf(BEGIN);
  const end = current.indexOf(END);
  // 표시가 한 쌍이고 순서가 맞을 때만 그 사이를 설치기의 구역으로 본다.
  if (begin < 0 || end < begin || current.indexOf(BEGIN, begin + 1) >= 0 || current.indexOf(END, end + 1) >= 0) return { status: "manual", content: null };
  const next = current.slice(0, begin) + renderBlock(rules) + current.slice(end + END.length);
  return next === current ? { status: "unchanged", content: null } : { status: "updated", content: next };
}

async function readAgentsFile(root: string) {
  const stat = await fs.lstat(path.join(root, AGENTS_FILE)).catch(() => null);
  if (stat === null) return { blocked: false, current: null };
  if (!stat.isFile()) return { blocked: true, current: null };
  return { blocked: false, current: await fs.readFile(path.join(root, AGENTS_FILE), "utf8") };
}

// 적용하면 AGENTS.md가 어떻게 되는지. 아무것도 쓰지 않는다.
export async function previewAgentsFile(root: string, rules: string): Promise<AgentsFileStatus> {
  const { blocked, current } = await readAgentsFile(root);
  return blocked ? "skipped" : planAgentsFile(current, rules).status;
}

export type AgentsFileResult = {
  status: AgentsFileStatus;
  // 구역 표시가 없어 그대로 둔 경우, 최신 내용의 AGENTS.md를 받아 둔 곳.
  referencePath: string | null;
};

// AGENTS.md를 만들거나 구역을 갱신한다. reference는 .plextype/reference 아래의 폴더 이름이고,
// backup을 주면 구역을 바꾸기 전의 파일을 그 폴더(프로젝트 루트 기준)에 남긴다.
export async function syncAgentsFile(root: string, rules: string, options: { reference: string; backup?: string }): Promise<AgentsFileResult> {
  assertInstallAllowed();
  const { blocked, current } = await readAgentsFile(root);
  if (blocked) return { status: "skipped", referencePath: null };
  const { status, content } = planAgentsFile(current, rules);
  if (status === "manual") {
    const reference = statePath(root, "reference", options.reference, AGENTS_FILE);
    await fs.mkdir(path.dirname(reference), { recursive: true });
    await fs.writeFile(reference, renderAgentsFile(rules));
    return { status, referencePath: path.relative(root, reference).split(path.sep).join("/") };
  }
  if (content !== null) {
    if (status === "updated" && options.backup) {
      await fs.mkdir(path.join(root, options.backup), { recursive: true });
      await fs.copyFile(path.join(root, AGENTS_FILE), path.join(root, options.backup, AGENTS_FILE));
    }
    await fs.writeFile(path.join(root, AGENTS_FILE), content);
  }
  return { status, referencePath: null };
}

// 이 프로젝트의 코어에 든 공통 규칙. 그 파일이 없는 버전의 코어면 null.
export const readAgentsRules = (root: string) => fs.readFile(path.join(root, AGENTS_RULES_FILE), "utf8").catch(() => null);

// 결과를 사람에게 알리는 한 줄. 알릴 것이 없으면 빈 문자열.
export function describeAgentsFile(result: AgentsFileResult) {
  if (result.status === "created") return `${AGENTS_FILE}를 만들었습니다. 프로젝트의 규칙은 표시 밖에 씁니다.`;
  if (result.status === "updated") return `${AGENTS_FILE}의 Plextype 규칙 구역을 최신 내용으로 바꿨습니다.`;
  if (result.status === "manual") return `${AGENTS_FILE}에 Plextype 규칙 구역의 표시가 없어 그대로 두었습니다. 최신 내용은 ${result.referencePath}에 있습니다. 그 파일의 표시와 그 사이 내용을 ${AGENTS_FILE}로 옮기면 다음부터 자동으로 갱신됩니다.`;
  if (result.status === "skipped") return `${AGENTS_FILE} 자리에 폴더나 링크가 있어 건드리지 않았습니다.`;
  return "";
}
