import test from "node:test";
import assert from "node:assert/strict";
import {
  PALETTES,
  PALETTE_ORDER,
  SKINS,
  SKIN_ORDER,
  DEFAULT_SKIN,
  DEFAULT_PALETTE,
  getSkin,
  getPalette,
  resolveSkin,
  resolvePalette,
  LAYOUTS,
  LAYOUT_ORDER,
  DEFAULT_LAYOUT,
  getLayout,
  resolveLayout,
  THEMES,
  THEME_ORDER,
  DEFAULT_THEME,
  getTheme,
  resolveTheme,
  DEFAULT_VOICE,
  ALL_GEMINI_VOICES,
  DEFAULT_LIVE_MODELS,
  DEFAULT_MODEL,
} from "../src/js/skins.js";

test("PALETTES contains streamlined palettes with valid RGB channels", () => {
  assert.ok(PALETTE_ORDER.includes("white"), "PALETTE_ORDER should include white");
  assert.ok(PALETTE_ORDER.includes("nord"), "PALETTE_ORDER should include nord");

  for (const id of PALETTE_ORDER) {
    const p = PALETTES[id];
    assert.ok(p, `Palette ${id} should exist in PALETTES`);
    assert.equal(p.id, id, `Palette id should match key`);
    assert.ok(p.name && typeof p.name === "string", `Palette ${id} must have a name`);

    for (const key of ["core", "accent", "hot", "deep", "line", "white"]) {
      const arr = p[key];
      assert.ok(Array.isArray(arr) && arr.length === 3, `${id}.${key} must be [r,g,b] array`);
      for (const c of arr) {
        assert.ok(Number.isInteger(c) && c >= 0 && c <= 255, `${id}.${key} channel ${c} must be int 0-255`);
      }
    }
  }
});

test("Pure White palette has expected monochrome channels", () => {
  const p = PALETTES.white;
  assert.ok(p, "white palette must exist");
  assert.equal(p.name, "Pure White");
  assert.deepEqual(p.core, [255, 255, 255]);
  assert.deepEqual(p.white, [255, 255, 255]);
});

test("Nord palette has authentic Arctic colors", () => {
  const p = PALETTES.nord;
  assert.ok(p, "nord palette must exist");
  assert.equal(p.name, "Nord Blue");
  assert.deepEqual(p.core, [136, 192, 208]);
  assert.deepEqual(p.deep, [46, 52, 64]);
});

test("resolvePalette resolves queries", () => {
  assert.equal(resolvePalette("white"), "white");
  assert.equal(resolvePalette("nord"), "nord");
  assert.equal(resolvePalette("arctic theme"), "nord");
  assert.equal(resolvePalette("frost blue"), "nord");
});

test("getPalette and getSkin return defaults on unknown id", () => {
  assert.equal(getPalette("nonexistent").id, DEFAULT_PALETTE);
  assert.equal(getSkin("nonexistent").id, DEFAULT_SKIN);
});

test("Taskbar layout has expected compact dimensions and resolvers", () => {
  const tb = LAYOUTS.taskbar;
  assert.ok(tb, "taskbar layout must exist");
  assert.equal(tb.id, "taskbar");
  assert.equal(tb.collapsed.w, 56);
  assert.equal(tb.collapsed.h, 56);
  assert.equal(tb.peek?.w, 380);
  assert.equal(tb.peek?.h, 140);
  assert.equal(tb.expanded.w, 380);
  assert.equal(tb.expanded.h, 500);

  assert.equal(resolveLayout("taskbar"), "taskbar");
  assert.equal(getLayout("unknown").id, DEFAULT_LAYOUT);
});

test("THEMES contains Black and Nord with valid definitions", () => {
  assert.deepEqual(THEME_ORDER, ["black", "nord"]);
  for (const id of THEME_ORDER) {
    const t = THEMES[id];
    assert.ok(t, `Theme ${id} must exist in THEMES`);
    assert.equal(t.id, id);
    assert.ok(t.name && typeof t.name === "string");
    assert.ok(t.blurb && typeof t.blurb === "string");
  }
  assert.equal(getTheme("nonexistent").id, DEFAULT_THEME);
  assert.equal(getTheme("black").name, "Black");
  assert.equal(getTheme("nord").name, "Nord");
});

test("resolveTheme correctly matches user queries", () => {
  assert.equal(resolveTheme("nord"), "nord");
  assert.equal(resolveTheme("arctic frost"), "nord");
  assert.equal(resolveTheme("black"), "black");
  assert.equal(resolveTheme("white accent"), "black");
});

test("SKINS defaults to minimal orb", () => {
  assert.equal(DEFAULT_SKIN, "minimal");
  assert.deepEqual(SKIN_ORDER, ["minimal"]);
  assert.ok(SKINS.minimal);
  assert.equal(resolveSkin("anything"), "minimal");
});

test("Voices and Models catalogs are intact", () => {
  assert.ok(ALL_GEMINI_VOICES.length >= 20);
  assert.equal(DEFAULT_VOICE, "Aoede");
  assert.ok(DEFAULT_LIVE_MODELS.length >= 2);
  assert.equal(DEFAULT_MODEL, "gemini-3.1-flash-live-preview");
});
