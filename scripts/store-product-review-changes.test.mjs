import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const compiled = ts.transpileModule(read("../src/extensions/store/productReviewChanges.ts"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const exports = {};
new Function("exports", compiled)(exports);
const { getProductReviewChanges } = exports;

test("new products have no fabricated previous approval", () => {
  assert.deepEqual(getProductReviewChanges({ name: "New", publishedData: null }), []);
});
test("unchanged values and empty optional fields produce no changes", () => {
  assert.deepEqual(getProductReviewChanges({ name: "Same", summary: "", publishedData: { name: "Same", summary: null } }), []);
});
test("changed and removed fields retain both values, including markup", () => {
  const changes = getProductReviewChanges({ name: "After", description: "<script>text</script>", publishedData: { name: "Before", summary: "Removed" } });
  assert.deepEqual(changes.map(({ key }) => key), ["name", "summary", "description"]);
  assert.equal(changes[1].after, "");
  assert.equal(changes[2].after, "<script>text</script>");
});
test("license changes are reported as a product field", () => {
  const changes = getProductReviewChanges({ licenseType: "mit", publishedData: { licenseType: "gpl-v2" } });
  assert.deepEqual(changes.map(({ key, before, after }) => [key, before, after]), [["licenseType", "gpl-v2", "mit"]]);
});
test("seller and server permit review requests only for drafts", () => {
  for (const [path, name] of [
    ["../src/extensions/store/ServiceStoreProductCards.tsx", "canRequestProductReview"],
    ["../src/extensions/store/actions/market.action.ts", "canRequestStoreProductReview"],
  ]) {
    assert.match(read(path), new RegExp(`const ${name} = \\(status: \\w+\\) => status === "draft";`));
  }
  assert.match(read("../src/extensions/store/actions/market.query.ts"), /"reviewStatus" = CASE WHEN "reviewStatus" IN \('approved', 'rejected'\) THEN 'draft'/);
});
