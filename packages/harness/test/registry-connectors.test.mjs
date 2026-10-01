import { test } from "node:test";
import assert from "node:assert/strict";
import { loadConnectors, getConnector, allConnectors, maskConfig, effectiveConfig } from "../lib/registry.mjs";

test("loadConnectors loads all connectors in connectors directory", async () => {
  const connectors = await loadConnectors();
  assert.ok(connectors.size > 0, "Should load at least one connector");
  assert.ok(connectors.has("websearch"), "Must contain websearch connector");
  assert.ok(connectors.has("weather"), "Must contain weather connector");
  assert.ok(connectors.has("system-stats"), "Must contain system-stats connector");
});

test("all connectors have valid manifests and schemas", async () => {
  await loadConnectors();
  const list = allConnectors();
  assert.ok(list.length >= 10, `Expected at least 10 connectors, found ${list.length}`);

  for (const c of list) {
    assert.ok(c.id && typeof c.id === "string", `Connector must have an id`);
    assert.ok(c.name && typeof c.name === "string", `Connector ${c.id} must have a name`);
    assert.ok(Array.isArray(c.config), `Connector ${c.id} config must be an array`);
    assert.ok(Array.isArray(c.actions), `Connector ${c.id} actions must be an array`);

    for (const a of c.actions) {
      assert.ok(a.name && typeof a.name === "string", `Action must have a name in ${c.id}`);
      assert.ok(typeof a.handler === "function", `Action ${a.name} in ${c.id} must have a handler function`);
      if (a.parameters) {
        assert.equal(a.parameters.type, "object", `Action ${a.name} parameters must be an object schema`);
      }
    }
  }
});

test("maskConfig masks secret fields and leaves public fields untouched", () => {
  const manifest = {
    config: [
      { key: "provider", default: "duckduckgo" },
      { key: "apiKey", secret: true },
      { key: "timeout", default: 5000 },
    ],
  };

  const stored = {
    provider: "brave",
    apiKey: "my-secret-token-12345",
    timeout: 8000,
  };

  const masked = maskConfig(manifest, stored);
  assert.equal(masked.provider, "brave");
  assert.equal(masked.apiKey, "••••••••", "Secret field must be masked");
  assert.equal(masked.timeout, 8000);
});

test("effectiveConfig resolves stored values over defaults without masking", () => {
  const manifest = {
    config: [
      { key: "provider", default: "duckduckgo" },
      { key: "apiKey", default: "" },
      { key: "count", default: 3 },
    ],
  };

  const stored = {
    provider: "tavily",
    apiKey: "real-secret-key",
  };

  const effective = effectiveConfig(manifest, stored);
  assert.equal(effective.provider, "tavily");
  assert.equal(effective.apiKey, "real-secret-key", "Effective config must contain raw secret for execution");
  assert.equal(effective.count, 3, "Unset fields must take default value");
});
