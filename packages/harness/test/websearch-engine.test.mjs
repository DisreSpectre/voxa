import test from "node:test";
import assert from "node:assert/strict";
import websearch from "../connectors/websearch/index.mjs";

test("websearch connector manifest is well-formed", () => {
  assert.equal(websearch.id, "websearch");
  assert.ok(websearch.name);
  assert.ok(websearch.description);
  assert.equal(websearch.icon, "⌕");
  assert.ok(Array.isArray(websearch.config));
  assert.ok(Array.isArray(websearch.actions));

  const names = websearch.actions.map((a) => a.name);
  assert.ok(names.includes("websearch_query"));
  assert.ok(names.includes("websearch_images"));
  assert.ok(names.includes("websearch_news"));
});

test("websearch_query rejects empty or blank queries", async () => {
  const handler = websearch.actions.find((a) => a.name === "websearch_query").handler;
  const res1 = await handler({ query: "" }, {});
  assert.equal(res1.error, "Empty query.");

  const res2 = await handler({ query: "   " }, {});
  assert.equal(res2.error, "Empty query.");

  const res3 = await handler({}, {});
  assert.equal(res3.error, "Empty query.");
});

test("websearch_images enforces provider requirement (brave or serpapi)", async () => {
  const handler = websearch.actions.find((a) => a.name === "websearch_images").handler;
  const res = await handler({ query: "red panda" }, { provider: "duckduckgo" });
  assert.ok(res.error && res.error.includes("needs the serpapi or brave provider"), `Expected provider error, got: ${res.error}`);
});

test("websearch_query clamps count between 1 and 5", async () => {
  const handler = websearch.actions.find((a) => a.name === "websearch_query").handler;
  
  // Test count = 1
  const res1 = await handler({ query: "node js", count: 1 }, {});
  assert.ok(!res1.error);
  assert.ok(res1.result);

  // Test count = 10 (should clamp to max 5)
  const resMax = await handler({ query: "python programming", count: 10 }, {});
  assert.ok(!resMax.error);
  // Lines are numbered like "1. ... 2. ..."
  const matches = resMax.result.match(/\b\d+\.\s/g) || [];
  assert.ok(matches.length <= 5, `Results should not exceed 5, got ${matches.length}`);
});

test("websearch_query returns clean decoded URLs and unescaped HTML entities", async () => {
  const handler = websearch.actions.find((a) => a.name === "websearch_query").handler;
  const res = await handler({ query: "typescript programming language", count: 3 }, {});
  
  assert.ok(!res.error);
  assert.ok(!res.result.includes("&quot;"), "Should not contain raw &quot; entities");
  assert.ok(!res.result.includes("&#x27;"), "Should not contain raw &#x27; entities");
  assert.ok(!res.result.includes("&amp;"), "Should not contain raw &amp; entities");
  assert.ok(!res.result.includes("uddg="), "Should not contain raw uddg redirect links, must be decoded");
  assert.ok(res.result.includes("https://"), "Must contain clean direct https links");
});

test("websearch_news retrieves live headlines", async () => {
  const handler = websearch.actions.find((a) => a.name === "websearch_news").handler;
  const res = await handler({ topic: "technology news", count: 3 }, {});
  assert.ok(!res.error);
  assert.ok(res.result && !res.result.startsWith("No results for"), `Should return news headlines, got: ${res.result}`);
});
