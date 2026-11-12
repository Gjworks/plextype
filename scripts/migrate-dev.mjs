import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { pathToFileURL } from "url";
import { findNewMigrations, syncPrisma } from "./sync-prisma.mjs";

// 개발 DB에 마이그레이션을 만들고 적용한다. `prisma migrate dev`는 합친 결과 폴더(prisma/migrations)에 새 마이그레이션을 만들므로,
// 끝난 뒤 그 폴더를 --to로 지정한 원본 폴더로 옮긴다. 옮기지 않으면 다음 prisma:sync가 결과 폴더를 다시 만들 때 사라진다.
//
//   npm run migrate:dev -- --to core --name add_user_memo
//   npm run migrate:dev -- --to naver-ads --name add_naver_stats
//   npm run migrate:dev -- --to posts/issuetracker --name add_issue_label
//
// --to 뒤의 값은 core 또는 src/extensions 아래 기능 경로다. 나머지 인자는 prisma migrate dev에 그대로 넘긴다.

export const resolveTarget = (rootDir, target) => {
  if (target === "core") return path.join(rootDir, "src", "core", "prisma", "migrations");
  const extensionsDir = path.join(rootDir, "src", "extensions");
  const featureDir = path.resolve(extensionsDir, target);
  if (!featureDir.startsWith(extensionsDir + path.sep) || !fs.existsSync(featureDir)) {
    throw new Error(`--to 대상 기능 폴더가 없습니다: src/extensions/${target}`);
  }
  return path.join(featureDir, "prisma", "migrations");
};

// 결과 폴더에 새로 생긴 마이그레이션을 원본 폴더로 옮긴다.
export const moveNewMigrations = (rootDir, targetDir) => {
  const names = findNewMigrations(rootDir);
  if (names.length === 0) return [];
  fs.mkdirSync(targetDir, { recursive: true });
  for (const name of names) {
    const destination = path.join(targetDir, name);
    if (fs.existsSync(destination)) throw new Error(`이미 있는 마이그레이션입니다: ${path.relative(rootDir, destination)}`);
    fs.renameSync(path.join(rootDir, "prisma", "migrations", name), destination);
  }
  return names;
};

const parseArgs = (argv) => {
  const rest = [];
  let target = null;
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--to") {
      target = argv[index + 1];
      index += 1;
    } else if (argv[index].startsWith("--to=")) {
      target = argv[index].slice("--to=".length);
    } else {
      rest.push(argv[index]);
    }
  }
  return { target, rest };
};

const main = () => {
  const rootDir = process.cwd();
  const { target, rest } = parseArgs(process.argv.slice(2));
  const targetDir = target ? resolveTarget(rootDir, target) : null;
  const report = (names) => names.length && console.log(`Moved ${names.join(", ")} to ${path.relative(rootDir, targetDir)}`);

  // 지난번에 옮기지 못하고 남은 마이그레이션이 있으면 먼저 옮긴다.
  if (targetDir) report(moveNewMigrations(rootDir, targetDir));
  syncPrisma(rootDir);

  const result = spawnSync("npx", ["dotenv", "-e", ".env", "-e", ".env.development", "--", "npx", "prisma", "migrate", "dev", ...rest], {
    cwd: rootDir,
    stdio: "inherit",
  });

  const created = findNewMigrations(rootDir);
  if (created.length > 0) {
    if (!targetDir) {
      throw new Error(
        `새 마이그레이션 ${created.join(", ")}을 둘 곳을 정하지 않았습니다. npm run migrate:dev -- --to <core|기능 경로>로 다시 실행하면 옮깁니다.`,
      );
    }
    report(moveNewMigrations(rootDir, targetDir));
    syncPrisma(rootDir);
  }

  if (result.status !== 0) process.exit(result.status ?? 1);
};

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
