import test from "node:test";
import assert from "node:assert/strict";
import websearch from "../connectors/websearch/index.mjs";

test("websearch_query returns real search results for real-world queries", async () => {
  const handler = websearch.actions.find((a) => a.name === "websearch_query").handler;
  const out = await handler({ query: "Windows 11 compact taskbar", count: 3 }, {});
  
  assert.ok(out, "Handler should return an output");
  assert.ok(!out.error, `Search should not return error: ${out.error}`);
  assert.ok(out.result, "Search should return result string");
  assert.ok(
    !out.result.startsWith("No results for"),
    `Search should find real results instead of saying 'No results for': got '${out.result}'`
  );
  assert.ok(out.result.includes("http"), "Results should contain real web URLs");
});

test("websearch test() passes", async () => {
  const r = await websearch.test({});
  assert.equal(r.ok, true, `Test should pass: ${r.message}`);
});
