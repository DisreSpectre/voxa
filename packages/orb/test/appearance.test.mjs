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
  extendAppearance,
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
  QUICK_VOICES,
  DEFAULT_VOICE,
  ALL_GEMINI_VOICES,
  DEFAULT_LIVE_MODELS,
  DEFAULT_MODEL,
} from "../src/js/skins.js";

test("PALETTES contains all ordered palettes with valid RGB channels", () => {
  assert.ok(PALETTE_ORDER.includes("white"), "PALETTE_ORDER should include white");
  assert.ok(PALETTE_ORDER.includes("nord"), "PALETTE_ORDER should include nord");

  for (const id of PALETTE_ORDER) {
    const p = PALETTES[id];
    assert.ok(p, `Palette ${id} should exist in PALETTES`);
    assert.equal(p.id, id, `Palette id should match key`);
    assert.ok(p.name && typeof p.name === "string", `Palette ${id} must have a name`);

    // Verify RGB channel arrays [0-255]
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
  assert.equal(p.name, "Nord");
  // Frost cyan #88c0d0 = [136, 192, 208]
  assert.deepEqual(p.core, [136, 192, 208]);
  // Polar night #2e3440 = [46, 52, 64]
  assert.deepEqual(p.deep, [46, 52, 64]);
});

test("resolvePalette resolves exact and natural language queries", () => {
  assert.equal(resolvePalette("white"), "white");
  assert.equal(resolvePalette("pure white"), "white");
  assert.equal(resolvePalette("make it pearl"), "white");
  assert.equal(resolvePalette("monochrome"), "white");

  assert.equal(resolvePalette("nord"), "nord");
  assert.equal(resolvePalette("arctic theme"), "nord");
  assert.equal(resolvePalette("frost blue"), "nord");
  assert.equal(resolvePalette("polar"), "nord");

  assert.equal(resolvePalette("ember"), "ember");
  assert.equal(resolvePalette("ice blue"), "ice");
  assert.equal(resolvePalette("violet"), "violet");
  assert.equal(resolvePalette("emerald green"), "emerald");
  assert.equal(resolvePalette("unknown-nonexistent-palette"), null);
});

test("getPalette and getSkin return defaults on unknown id", () => {
  assert.equal(getPalette("nonexistent").id, DEFAULT_PALETTE);
  assert.equal(getSkin("nonexistent").id, DEFAULT_SKIN);
});

test("LAYOUTS has valid dimensions and layout resolver works", () => {
  for (const id of LAYOUT_ORDER) {
    const l = LAYOUTS[id];
    assert.ok(l, `Layout ${id} must exist in LAYOUTS`);
    assert.ok(l.collapsed.w > 0 && l.collapsed.h > 0, `${id} collapsed w/h must be > 0`);
    assert.ok(l.expanded.w > 0 && l.expanded.h > 0, `${id} expanded w/h must be > 0`);
  }
  assert.equal(resolveLayout("capsule"), "capsule");
  assert.equal(resolveLayout("floating pill"), "capsule");
  assert.equal(resolveLayout("arc reactor"), "reactor");
  assert.equal(resolveLayout("holodock"), "holodock");
  assert.equal(getLayout("unknown").id, DEFAULT_LAYOUT);
});

test("extendAppearance adds custom palettes safely", () => {
  const customId = "test_custom_" + Date.now().toString(36);
  const changed = extendAppearance({
    palettes: [
      {
        id: customId,
        name: "Test Custom",
        core: [100, 150, 200],
        accent: [200, 150, 100],
        hot: [255, 255, 255],
        deep: [10, 20, 30],
        line: [120, 160, 210],
        white: [250, 250, 250],
      },
    ],
  });
  assert.equal(changed, true);
  assert.ok(PALETTES[customId], "Custom palette should be registered");
  assert.equal(getPalette(customId).name, "Test Custom");
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
  assert.equal(resolveLayout("minimal orb"), "taskbar");
  assert.equal(resolveLayout("compact taskbar"), "taskbar");
  assert.equal(resolveLayout("tray orb"), "taskbar");
});

test("THEMES contains all ordered themes with valid blur & style definitions", () => {
  assert.deepEqual(THEME_ORDER, ["glass", "liquid", "nord", "white"]);
  for (const id of THEME_ORDER) {
    const t = THEMES[id];
    assert.ok(t, `Theme ${id} must exist in THEMES`);
    assert.equal(t.id, id);
    assert.ok(t.name && typeof t.name === "string");
    assert.ok(t.blurb && typeof t.blurb === "string");
  }
  assert.equal(getTheme("nonexistent").id, DEFAULT_THEME);
  assert.equal(getTheme("liquid").name, "Liquid Glass");
  assert.equal(getTheme("nord").name, "Nord Arctic");
  assert.equal(getTheme("white").name, "Pure White");
});

test("resolveTheme correctly matches user queries", () => {
  assert.equal(resolveTheme("liquid"), "liquid");
  assert.equal(resolveTheme("show my wallpaper"), "liquid");
  assert.equal(resolveTheme("acrylic blur"), "liquid");
  assert.equal(resolveTheme("liquid glass"), "liquid");

  assert.equal(resolveTheme("nord"), "nord");
  assert.equal(resolveTheme("arctic frost"), "nord");
  assert.equal(resolveTheme("polar"), "nord");

  assert.equal(resolveTheme("white"), "white");
  assert.equal(resolveTheme("pure white"), "white");
  assert.equal(resolveTheme("monochrome"), "white");

  assert.equal(resolveTheme("glass"), "glass");
  assert.equal(resolveTheme("dark glass"), "glass");
  assert.equal(resolveTheme("classic dark"), "glass");

  assert.equal(resolveTheme("some-completely-unknown-theme-xyz"), null);
});

test("QUICK_VOICES contains ordered Gemini voices and defaults to Aoede", () => {
  assert.equal(DEFAULT_VOICE, "Aoede");
  assert.ok(Array.isArray(QUICK_VOICES));
  assert.ok(QUICK_VOICES.length >= 7);

  const ids = QUICK_VOICES.map((v) => v.id);
  assert.ok(ids.includes("Aoede"), "Should include Aoede");
  assert.ok(ids.includes("Leda"), "Should include Leda");
  assert.ok(ids.includes("Kore"), "Should include Kore");
  assert.ok(ids.includes("Zephyr"), "Should include Zephyr");
  assert.ok(ids.includes("Puck"), "Should include Puck");
  assert.ok(ids.includes("Charon"), "Should include Charon");
  assert.ok(ids.includes("Fenrir"), "Should include Fenrir");

  const aoede = QUICK_VOICES.find((v) => v.id === "Aoede");
  assert.equal(aoede.gender, "female");
  assert.ok(aoede.blurb.includes("Default"));
});

test("ALL_GEMINI_VOICES contains full catalog of 30 Google Gemini voices", () => {
  assert.equal(ALL_GEMINI_VOICES.length, 30);
  for (const v of ALL_GEMINI_VOICES) {
    assert.ok(v.id && typeof v.id === "string", "Each voice must have an id");
    assert.ok(v.name && typeof v.name === "string", "Each voice must have a name");
    assert.ok(["female", "male"].includes(v.gender), "Gender must be female or male");
    assert.ok(v.tone && typeof v.tone === "string", "Each voice must have a tone");
  }
  const femaleVoices = ALL_GEMINI_VOICES.filter((v) => v.gender === "female");
  const maleVoices = ALL_GEMINI_VOICES.filter((v) => v.gender === "male");
  assert.ok(femaleVoices.length >= 12, "Should contain female voice options");
  assert.ok(maleVoices.length >= 12, "Should contain male voice options");
  assert.ok(ALL_GEMINI_VOICES.some((v) => v.id === "Aoede"), "Aoede should be in full catalog");
});

test("DEFAULT_LIVE_MODELS contains real-time Gemini streaming audio models", () => {
  assert.ok(Array.isArray(DEFAULT_LIVE_MODELS));
  assert.ok(DEFAULT_LIVE_MODELS.length >= 3);
  assert.equal(DEFAULT_MODEL, "gemini-3.1-flash-live-preview");
  assert.ok(DEFAULT_LIVE_MODELS.some((m) => m.id === DEFAULT_MODEL));
  for (const m of DEFAULT_LIVE_MODELS) {
    assert.ok(m.id && typeof m.id === "string", "Model must have an id");
    assert.ok(m.name && typeof m.name === "string", "Model must have a display name");
  }
});

test("SKINS contains ordered skins including minimal aura and glyph matrix", () => {
  assert.ok(SKIN_ORDER.includes("minimal"), "SKIN_ORDER should include minimal");
  assert.ok(SKIN_ORDER.includes("glyph"), "SKIN_ORDER should include glyph");
  const glyph = SKINS.glyph;
  assert.ok(glyph, "glyph skin must exist in SKINS");
  assert.equal(glyph.name, "Glyph");
  assert.equal(glyph.sphere, "glyph");
  assert.equal(glyph.ring, "none");
});

test("resolveSkin correctly matches user queries including glyph and minimal aura", () => {
  assert.equal(resolveSkin("glyph"), "glyph");
  assert.equal(resolveSkin("nothing"), "glyph");
  assert.equal(resolveSkin("dot matrix"), "glyph");
  assert.equal(resolveSkin("led matrix"), "glyph");
  assert.equal(resolveSkin("minimal"), "minimal");
  assert.equal(resolveSkin("aura"), "minimal");
});



