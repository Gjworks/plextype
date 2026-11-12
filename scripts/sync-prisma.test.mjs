import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { moveNewMigrations, resolveTarget } from "./migrate-dev.mjs";
import { syncPrisma } from "./sync-prisma.mjs";

const write = (root, file, content) => {
  const target = path.join(root, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
};

const fixture = (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sync-prisma-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  write(root, "src/core/prisma/schema.prisma", "model User {\n  id Int @id\n}");
  write(root, "src/core/prisma/migrations/migration_lock.toml", 'provider = "postgresql"\n');
  write(root, "src/core/prisma/migrations/20250101000000_init/migration.sql", 'CREATE TABLE "User" ();');
  write(root, "src/extensions/naver-ads/prisma/schema.prisma", "model NaverAdAccount {\n  id Int @id\n}");
  write(root, "src/extensions/naver-ads/prisma/migrations/20261110090000_add_naver_ad_account/migration.sql", 'CREATE TABLE "NaverAdAccount" ();');
  write(root, "src/extensions/posts/issuetracker/prisma/schema/issue.prisma", "model Issue {\n  id Int @id\n}");
  write(root, "src/extensions/posts/issuetracker/prisma/migrations/20260301000000_add_issue/migration.sql", 'CREATE TABLE "Issue" ();');
  return root;
};

const outputNames = (root) => fs.readdirSync(path.join(root, "prisma/migrations")).sort();

test("core and extension schemas and migrations merge into the root prisma folder", (t) => {
  const root = fixture(t);
  syncPrisma(root);

  const schema = fs.readFileSync(path.join(root, "prisma/schema.prisma"), "utf8");
  assert.match(schema, /model User/);
  assert.match(schema, /model NaverAdAccount/);
  assert.match(schema, /model Issue/);
  assert.deepEqual(outputNames(root), [
    ".sources.json",
    "20250101000000_init",
    "20260301000000_add_issue",
    "20261110090000_add_naver_ad_account",
    "migration_lock.toml",
  ]);
  assert.equal(
    fs.readFileSync(path.join(root, "prisma/migrations/20261110090000_add_naver_ad_account/migration.sql"), "utf8"),
    'CREATE TABLE "NaverAdAccount" ();',
  );
});

test("duplicate names, bad names and missing SQL stop the sync", (t) => {
  const root = fixture(t);
  write(root, "src/extensions/naver-ads/prisma/migrations/20250101000000_init/migration.sql", "SELECT 1;");
  assert.throws(() => syncPrisma(root), /같은 이름의 마이그레이션/);
  fs.rmSync(path.join(root, "src/extensions/naver-ads/prisma/migrations/20250101000000_init"), { recursive: true });

  write(root, "src/extensions/naver-ads/prisma/migrations/add_without_time/migration.sql", "SELECT 1;");
  assert.throws(() => syncPrisma(root), /14자리 시각/);
  fs.rmSync(path.join(root, "src/extensions/naver-ads/prisma/migrations/add_without_time"), { recursive: true });

  fs.mkdirSync(path.join(root, "src/extensions/naver-ads/prisma/migrations/20261201000000_empty"));
  assert.throws(() => syncPrisma(root), /migration.sql이 없습니다/);
});

test("a migration created by prisma migrate dev is kept until it moves to its source folder", (t) => {
  const root = fixture(t);
  syncPrisma(root);
  write(root, "prisma/migrations/20261112000000_add_naver_rules/migration.sql", 'CREATE TABLE "NaverRule" ();');

  assert.throws(() => syncPrisma(root), /원본 폴더에 없는 마이그레이션/);
  assert.ok(fs.existsSync(path.join(root, "prisma/migrations/20261112000000_add_naver_rules")));

  const moved = moveNewMigrations(root, resolveTarget(root, "naver-ads"));
  assert.deepEqual(moved, ["20261112000000_add_naver_rules"]);
  assert.ok(fs.existsSync(path.join(root, "src/extensions/naver-ads/prisma/migrations/20261112000000_add_naver_rules/migration.sql")));
  syncPrisma(root);
  assert.ok(outputNames(root).includes("20261112000000_add_naver_rules"));
});

test("migrations of a removed extension leave the merged folder", (t) => {
  const root = fixture(t);
  syncPrisma(root);
  fs.rmSync(path.join(root, "src/extensions/posts"), { recursive: true });
  syncPrisma(root);
  assert.ok(!outputNames(root).includes("20260301000000_add_issue"));
});

test("--to accepts core or an existing feature folder only", (t) => {
  const root = fixture(t);
  assert.equal(resolveTarget(root, "core"), path.join(root, "src/core/prisma/migrations"));
  assert.equal(resolveTarget(root, "posts/issuetracker"), path.join(root, "src/extensions/posts/issuetracker/prisma/migrations"));
  assert.throws(() => resolveTarget(root, "missing"), /기능 폴더가 없습니다/);
  assert.throws(() => resolveTarget(root, "../core"), /기능 폴더가 없습니다/);
});
