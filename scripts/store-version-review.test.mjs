import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../src/extensions/store/actions/market.query.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

// Execute the query layer with a recording client; never connect to a database.
function harness() {
  const calls = [];
  const record = async (sql, ...values) => {
    calls.push({ sql: typeof sql === "string" ? sql : sql.join("?"), values });
    return [];
  };
  const prisma = {
    $executeRaw: record, $executeRawUnsafe: record,
    $queryRaw: record, $queryRawUnsafe: record,
  };
  prisma.$transaction = (callback) => callback(prisma);
  const exports = {};
  new Function("require", "exports", compiled)((name) => {
    assert.equal(name, "@/core/utils/db/prisma");
    return { default: prisma };
  }, exports);
  return { query: exports, calls };
}

test("file review queue is independent of product review status", async () => {
  const { query, calls } = harness();
  await query.findReviewVersions();
  const select = calls.find(({ sql }) => sql.includes('AS "productUuid"'));
  assert.match(select.sql, /v\."reviewStatus" IN \('requested', 'reviewing'\)/);
  assert.doesNotMatch(select.sql, /p\."reviewStatus"/);
});

test("review history is scoped to the product and its own versions", async () => {
  const { query, calls } = harness();
  await query.findStoreReviewHistory(17);
  const select = calls.find(({ sql }) => sql.includes('SELECT l.*'));
  assert.deepEqual(select.values, [17, 17]);
  assert.match(select.sql, /"targetType" = 'product'/);
  assert.match(select.sql, /"targetType" = 'version'/);
});

test("both review transitions persist a historical snapshot with the note", async () => {
  const { query, calls } = harness();
  await query.updateProductReviewStatus({ productId: 1, fromStatus: 'draft', toStatus: 'requested', actorId: 2, note: 'check' });
  await query.updateVersionReviewStatus({ versionId: 3, fromStatus: 'requested', toStatus: 'approved', actorId: 2, note: 'approved' });
  const logs = calls.filter(({ sql }) => sql.includes('INSERT INTO "StoreReviewLog"'));
  assert.equal(logs.length, 2);
  for (const log of logs) {
    assert.match(log.sql, /'snapshot'/);
    assert.match(log.sql, /to_jsonb\(p\)/);
  }
  assert.match(logs[0].sql, /'licenseOptions'/);
  assert.match(logs[1].sql, /to_jsonb\(v\)/);
});

test("new versions require review and cannot request immediate publication", async () => {
  const { query, calls } = harness();
  await query.createStoreProductVersion({
    uuid: "version", productId: 1, versionName: "0.1.1",
    isPublic: true, isRequiredUpdate: false,
  });
  const insert = calls.find(({ sql }) => sql.includes('INSERT INTO "StoreProductVersion"'));
  assert.ok(insert);
  assert.match(insert.sql, /false, \?, \?, 'requested'/);
});

test("initialization and product approval never publish versions", async () => {
  const { query, calls } = harness();
  await query.ensureStoreMarketTables();
  await query.publishStoreProductSnapshot(1);
  assert.equal(calls.some(({ sql }) => /UPDATE "StoreProductVersion"/.test(sql)), false);
});

test("version approval controls publication, including revocation", async () => {
  for (const status of ["approved", "rejected", "reviewing", "requested", "draft"]) {
    const { query, calls } = harness();
    await query.updateVersionReviewStatus({
      versionId: 2, fromStatus: "approved", toStatus: status, actorId: 1, note: "review",
    });
    const update = calls.find(({ sql }) => sql.includes('UPDATE "StoreProductVersion"'));
    assert.match(update.sql, /"isPublic" = \(\? = 'approved'\)/);
    assert.ok(update.values.includes(status));
    assert.ok(calls.some(({ sql }) => sql.includes('INSERT INTO "StoreReviewLog"')));
  }
});

test("seller publication remains guarded at the database update", async () => {
  const { query, calls } = harness();
  await query.updateStoreProductVersionPublic({ versionId: 2, productId: 1, isPublic: true });
  const update = calls.find(({ sql }) => sql.includes('UPDATE "StoreProductVersion"'));
  assert.match(update.sql, /"isPublic" = \(\? AND "reviewStatus" = 'approved'\)/);
  assert.match(update.sql, /AND "productId" = \?/);
});

test("all public catalog and purchase version queries require approval", async () => {
  const names = [
    "findPublishedStoreProducts", "findPublishedStoreProductByUuid",
    "findPublishedStoreProductVersions", "findAllStoreOrders", "findStoreOrdersBySeller",
    "findStoreOrderByUuidForSeller", "findMyStorePurchases",
    "findMyStorePurchaseByOrderUuid", "findMyStorePurchasesBySeller",
  ];
  for (const name of names) {
    const { query, calls } = harness();
    await query[name](1, 2);
    const selects = calls.filter(({ sql }) => sql.includes('"isPublic" = true'));
    assert.ok(selects.length > 0, name);
    for (const { sql } of selects) {
      assert.match(sql, /"isPublic" = true\s+AND "reviewStatus" = 'approved'/, name);
    }
  }
});
