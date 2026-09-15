import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const compiled = ts.transpileModule(readFileSync(new URL("../src/extensions/store/reviewHistory.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const exports = {};
new Function("exports", compiled)(exports);
const { parseReviewHistory } = exports;
test("legacy reasons remain visible without invented snapshots", () => {
  for (const note of [null, "Approved", '{"type":"field-review","items":[]}', '{broken']) {
    assert.deepEqual(parseReviewHistory(note), { note: note || "", snapshot: null });
  }
});
test("stored review contents survive later product changes", () => {
  const product = { name: "Original" };
  const stored = JSON.stringify({ schemaVersion: 1, note: "Reviewed", snapshot: { product, version: { versionName: "0.1.0" } } });
  product.name = "Changed";
  const result = parseReviewHistory(stored);
  assert.equal(result.note, "Reviewed");
  assert.equal(result.snapshot.product.name, "Original");
  assert.equal(result.snapshot.version.versionName, "0.1.0");
});
