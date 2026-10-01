// Voxa orb skins + palettes — the single source of truth for the orb's looks.
//
// A SKIN is the orb's shape/ornament style (rendered procedurally in orb.js).
// A PALETTE is the colour set, switchable INDEPENDENTLY of skin ("make it violet").
// Both persist in localStorage and apply live — no restart. The desktop concept
// sheets (Docked Halo, Reactor Frame, Split Lens, …) are the design references.

// Palette = semantic colour roles as [r,g,b]. orb.js maps these onto every layer
// (glow, sphere body, wireframe, core, rings, waveform). `white` is the hot center.
export const PALETTES = {
  // Duotone palettes: `core` and `accent` are deliberately contrasting hues (like
  // ember's orange+cyan) so the orb reads as multi-colour, not a single tint.
  ember:   { id: "ember",   name: "Ember",   core: [255, 138, 43],  accent: [0, 229, 255],   hot: [255, 214, 158], deep: [150, 56, 14],  line: [255, 190, 120], white: [255, 248, 235] },
  ice:     { id: "ice",     name: "Ice",     core: [56, 170, 255],  accent: [180, 140, 255], hot: [200, 232, 255], deep: [18, 58, 120],  line: [160, 208, 255], white: [240, 250, 255] },
  violet:  { id: "violet",  name: "Violet",  core: [176, 92, 255],  accent: [120, 255, 220], hot: [226, 196, 255], deep: [72, 28, 132],  line: [206, 162, 255], white: [248, 240, 255] },
  emerald: { id: "emerald", name: "Emerald", core: [38, 212, 140],  accent: [255, 180, 70],  hot: [198, 255, 224], deep: [14, 92, 60],   line: [150, 236, 190], white: [240, 255, 248] },
  sunset:  { id: "sunset",  name: "Sunset",  core: [255, 92, 140],  accent: [255, 200, 60],  hot: [255, 200, 210], deep: [120, 22, 64],  line: [255, 158, 180], white: [255, 244, 246] },
  aurora:  { id: "aurora",  name: "Aurora",  core: [56, 224, 180],  accent: [150, 110, 255], hot: [200, 255, 236], deep: [16, 92, 82],   line: [150, 236, 212], white: [240, 255, 250] },
  plasma:  { id: "plasma",  name: "Plasma",  core: [78, 130, 255],  accent: [255, 84, 200],  hot: [200, 214, 255], deep: [28, 40, 132],  line: [160, 182, 255], white: [242, 244, 255] },
  solar:   { id: "solar",   name: "Solar",   core: [255, 176, 40],  accent: [255, 70, 96],   hot: [255, 226, 168], deep: [140, 62, 8],   line: [255, 202, 130], white: [255, 250, 238] },
  white:   { id: "white",   name: "Pure White", core: [255, 255, 255], accent: [225, 235, 250], hot: [255, 255, 255], deep: [42, 48, 60], line: [210, 220, 240], white: [255, 255, 255] },
  nord:    { id: "nord",    name: "Nord",    core: [136, 192, 208], accent: [129, 161, 193], hot: [236, 239, 244], deep: [46, 52, 64],  line: [143, 188, 187], white: [245, 250, 255] },
};
export const PALETTE_ORDER = ["ember", "ice", "violet", "emerald", "sunset", "aurora", "plasma", "solar", "white", "nord"];

// Skin = how the orb is drawn. `sphere` picks the body renderer; the flags toggle
// ornament layers. `defaultPalette` is just the suggested pairing — palette is
// independent. `image` (for the hybrid art skin) names an asset drawn clipped to
// the core disc.
export const SKINS = {
  orbit:   { id: "orbit",   name: "Orbit",     sphere: "wire", ring: "orbit",   flare: true,  scan: true,  defaultPalette: "ember",
             blurb: "Orb with tilted orbital rings + travelling glints (the classic)." },
  halo:    { id: "halo",    name: "Halo",      sphere: "wire", ring: "halo",    flare: true,  scan: true,  defaultPalette: "ember",
             blurb: "A single bold docked halo ring — Concept 1, Docked Halo." },
  reactor: { id: "reactor", name: "Reactor",   sphere: "wire", ring: "reactor", flare: true,  scan: false, defaultPalette: "ember",
             blurb: "Concentric segmented arc-reactor rings — Concept 7." },
  lens:    { id: "lens",    name: "Lens",      sphere: "lens", ring: "none",    flare: true,  scan: true,  defaultPalette: "ice",
             blurb: "A camera-lens iris over the core — Concept 2, Split Lens." },
  holo:    { id: "holo",    name: "Holo Dock", sphere: "wire", ring: "none",    flare: false, scan: true,  brackets: true, defaultPalette: "ice",
             blurb: "Angular HUD corner brackets + scanline — Concept 10." },
  minimal: { id: "minimal", name: "Minimal",   sphere: "soft", ring: "none",    flare: false, scan: false, defaultPalette: "ember",
             blurb: "Clean, quiet orb — waveform-forward. Concept 6." },
  nebula:  { id: "nebula",  name: "Nebula",    sphere: "soft", ring: "halo",    flare: false, scan: false, defaultPalette: "violet",
             blurb: "Soft, dreamy bloom — calm and atmospheric." },
  handoff: { id: "handoff", name: "Desktop Handoff", sphere: "wire", ring: "handoff", flare: true, scan: true, defaultPalette: "ember",
             blurb: "Reference-style luminous core with technical rings, ember particles, and side waveforms." },
  spectrum: { id: "spectrum", name: "Spectrum Grid", sphere: "wire", ring: "spectrum", flare: true, scan: true, defaultPalette: "aurora",
              blurb: "Reference-style network orb with spectral glow, constellation nodes, and soft panel-friendly depth." },
  crystal: { id: "crystal", name: "Crystal Cage", sphere: "crystal", ring: "none", flare: false, scan: false, defaultPalette: "ice",
             blurb: "Metallic wireframe icosahedron caging a glowing crystal core — palette-driven; the core heats to orange-red while speaking." },
  glyph:   { id: "glyph",   name: "Glyph",     sphere: "glyph", ring: "none",    flare: false, scan: false, defaultPalette: "white",
             blurb: "Nothing OS inspired dot-matrix glyph cluster with stark white LEDs and signature red indicator." },
  // ── Minimal 2D skins ──────────────────────────────────────────────────────
  dot:     { id: "dot",     name: "Dot",       sphere: "soft",  ring: "none",    flare: false, scan: false, defaultPalette: "white",
             blurb: "Ultra-minimal: a single soft pulsing dot with state-reactive glow." },
  ring:    { id: "ring",    name: "Ring",      sphere: "soft",  ring: "none",    flare: false, scan: false, defaultPalette: "ice",
             blurb: "One clean flat ring with a travelling arc that lights up on voice." },
  pulse:   { id: "pulse",   name: "Pulse",     sphere: "soft",  ring: "none",    flare: false, scan: false, defaultPalette: "aurora",
             blurb: "Radar-style concentric expanding rings that ripple out from center." },
  ghost:   { id: "ghost",   name: "Ghost",     sphere: "soft",  ring: "none",    flare: false, scan: false, defaultPalette: "nord",
             blurb: "Barely-there translucent outline with a soft fog fill — maximal restraint." },
};
export const SKIN_ORDER = ["orbit", "halo", "reactor", "lens", "holo", "minimal", "dot", "ring", "pulse", "ghost", "glyph", "nebula", "handoff", "spectrum", "crystal"];

export const DEFAULT_SKIN = "orbit";
export const DEFAULT_PALETTE = "ember";

const SAFE_SKIN_SPHERES = new Set(["wire", "soft", "lens", "glyph"]);
const SAFE_SKIN_RINGS = new Set(["none", "orbit", "halo", "reactor", "spectrum"]);
const safeId = (v) => String(v || "").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 32);
const safeColor = (v) => Array.isArray(v) && v.length === 3 ? v.map((n) => Math.max(0, Math.min(255, Number(n) || 0))) : null;

export function getSkin(id) { return SKINS[id] || SKINS[DEFAULT_SKIN]; }
export function getPalette(id) { return PALETTES[id] || PALETTES[DEFAULT_PALETTE]; }
export function extendAppearance(defs) {
  if (!defs || typeof defs !== "object") return false;
  let changed = false;
  for (const p of Array.isArray(defs.palettes) ? defs.palettes : []) {
    const id = safeId(p?.id);
    const core = safeColor(p?.core), accent = safeColor(p?.accent), hot = safeColor(p?.hot), deep = safeColor(p?.deep), line = safeColor(p?.line), white = safeColor(p?.white);
    if (!id || PALETTES[id] || !core || !accent || !hot || !deep || !line || !white) continue;
    PALETTES[id] = { id, name: String(p.name || id).slice(0, 40), core, accent, hot, deep, line, white };
    PALETTE_ORDER.push(id);
    changed = true;
  }
  for (const s of Array.isArray(defs.skins) ? defs.skins : []) {
    const id = safeId(s?.id);
    const sphere = SAFE_SKIN_SPHERES.has(s?.sphere) ? s.sphere : "wire";
    const ring = SAFE_SKIN_RINGS.has(s?.ring) ? s.ring : "orbit";
    const defaultPalette = PALETTES[s?.defaultPalette] ? s.defaultPalette : DEFAULT_PALETTE;
    if (!id || SKINS[id]) continue;
    SKINS[id] = {
      id,
      name: String(s.name || id).slice(0, 40),
      sphere,
      ring,
      flare: s.flare !== false,
      scan: s.scan !== false,
      brackets: !!s.brackets,
      defaultPalette,
      blurb: String(s.blurb || "Custom runtime skin from voxa-config.json.").slice(0, 160),
    };
    SKIN_ORDER.push(id);
    changed = true;
  }
  return changed;
}

// Resolve a loose spoken name ("the reactor one", "ice blue", "minimal") to an id.
export function resolveSkin(q) {
  const s = String(q || "").toLowerCase();
  // Run specific multi-word/phrase patterns FIRST so they aren't swallowed by
  // short single-word skin ids (e.g. "dot matrix" must go to "glyph", not "dot").
  if (/glyph|nothing|dot.*matrix|dot.grid|led/.test(s)) return "glyph";
  if (/halo|dock(?!.*holo)/.test(s)) return "halo";
  if (/reactor|arc|iron/.test(s)) return "reactor";
  if (/lens|iris|eye/.test(s)) return "lens";
  if (/holo|hud|bracket/.test(s)) return "holo";
  if (/pulse|radar|sonar|ripple/.test(s)) return "pulse";
  if (/ghost|outline|bare|invisible|translucent/.test(s)) return "ghost";
  if (/minimal|aura|clean|simple|plain|flat/.test(s)) return "minimal";
  if (/nebula|image|art|photo/.test(s)) return "nebula";
  if (/crystal|cage|gem|prism|icosa|diamond|geode/.test(s)) return "crystal";
  if (/spectrum|grid|scheme|network|constellation|gallery|card/.test(s)) return "spectrum";
  if (/handoff|desktop|reference|picture|glow|particle/.test(s)) return "handoff";
  if (/orbit|classic|default/.test(s)) return "orbit";
  // After the specific patterns, do generic id/name loop for remaining skins
  for (const id of SKIN_ORDER) {
    if (s.includes(id) || s.includes(SKINS[id].name.toLowerCase())) return id;
  }
  return null;
}
export function resolvePalette(q) {
  const s = String(q || "").toLowerCase();
  for (const id of PALETTE_ORDER) {
    if (s.includes(id) || s.includes(PALETTES[id].name.toLowerCase())) return id;
  }
  if (/white|pure|monochrome|pearl|clean/.test(s)) return "white";
  if (/nord|arctic|frost|polar/.test(s)) return "nord";
  if (/sunset|pink.*gold|rose/.test(s)) return "sunset";
  if (/aurora|teal.*violet|northern/.test(s)) return "aurora";
  if (/plasma|electric|blue.*pink/.test(s)) return "plasma";
  if (/solar|fire|red.*amber|lava/.test(s)) return "solar";
  if (/orange|amber|ember|gold|iron/.test(s)) return "ember";
  if (/ice|cyan|blue|aqua|voxa/.test(s)) return "ice";
  if (/violet|purple|magenta|lilac/.test(s)) return "violet";
  if (/emerald|green|mint/.test(s)) return "emerald";
  return null;
}

// Full window LAYOUTS — distinct UI arrangements (concept sheets), applied as a
// `lay-<id>` class on <body> and a per-layout window size. Switchable at runtime.
export const LAYOUTS = {
  // settingsH = window height used while settings is open (taller than collapsed).
  dock:     { id: "dock",     name: "Dock",     collapsed: { w: 460, h: 140 }, expanded: { w: 460, h: 520 }, settingsH: 540,
              blurb: "Compact capsule — orb beside a slim panel." },
  taskbar:  { id: "taskbar",  name: "Taskbar",  collapsed: { w: 56, h: 56 },   peek: { w: 380, h: 140 }, expanded: { w: 380, h: 500 }, settingsH: 520,
              blurb: "Minimalist 44px orb for Windows 11 compact taskbar with hover flyout." },
  capsule:  { id: "capsule",  name: "Capsule",  collapsed: { w: 470, h: 144 }, expanded: { w: 560, h: 440 }, settingsH: 540,
              blurb: "Sculpted floating pill — glass shell, orb inset (Concept 5)." },
  reactor:  { id: "reactor",  name: "Reactor",  collapsed: { w: 500, h: 196 }, expanded: { w: 600, h: 580 }, settingsH: 580,
              blurb: "Arc-reactor HUD frame + telemetry readouts (Concept 7)." },
  holodock: { id: "holodock", name: "Holo Dock", collapsed: { w: 510, h: 152 }, expanded: { w: 620, h: 560 }, settingsH: 560,
              blurb: "Angular holographic panels with notched corners (Concept 10)." },
};
export const LAYOUT_ORDER = ["dock", "taskbar", "capsule", "reactor", "holodock"];
export const DEFAULT_LAYOUT = "dock";
export function getLayout(id) { return LAYOUTS[id] || LAYOUTS[DEFAULT_LAYOUT]; }
export function resolveLayout(q) {
  const s = String(q || "").toLowerCase();
  for (const id of [...LAYOUT_ORDER].sort((a, b) => b.length - a.length)) {
    if (s.includes(id) || s.includes(LAYOUTS[id].name.toLowerCase())) return id;
  }
  if (/taskbar|minimal|compact.*taskbar|tray|mini|tiny/.test(s)) return "taskbar";
  if (/capsule|pill|floating/.test(s)) return "capsule";
  if (/reactor|arc|iron|hud/.test(s)) return "reactor";
  if (/holo|holographic|notch|bracket|angular/.test(s)) return "holodock";
  if (/dock|compact|default|small|simple/.test(s)) return "dock";
  return null;
}

// Full app visual THEMES — background, glass styling, and translucency modes.
// Switchable at runtime via body.theme-<id>.
export const THEMES = {
  glass:  { id: "glass",  name: "Dark Glass",   blurb: "Default deep dark glass with subtle reflections." },
  liquid: { id: "liquid", name: "Liquid Glass", blurb: "Translucent liquid blur showing your desktop wallpaper." },
  nord:   { id: "nord",   name: "Nord Arctic",  blurb: "Authentic Arctic frost palette with cool slate grays." },
  white:  { id: "white",  name: "Pure White",   blurb: "High contrast pure monochrome accent." },
};
export const THEME_ORDER = ["glass", "liquid", "nord", "white"];
export const DEFAULT_THEME = "glass";

export function getTheme(id) {
  return THEMES[id] || THEMES[DEFAULT_THEME];
}

export function resolveTheme(q) {
  const s = String(q || "").toLowerCase();
  if (/liquid|blur|wallpaper|desktop|transparent|acrylic|mica/.test(s)) return "liquid";
  if (/nord|arctic|frost|polar|snow/.test(s)) return "nord";
  if (/white|pure|monochrome|pearl|clean/.test(s)) return "white";
  if (/glass|default|classic|dark/.test(s)) return "glass";
  return null;
}

// Quick voices selectable from the orb settings panel.
export const QUICK_VOICES = [
  { id: "Aoede",  name: "Aoede",  gender: "female", blurb: "Female · Clear, bright, and upbeat (Default)" },
  { id: "Leda",   name: "Leda",   gender: "female", blurb: "Female · Warm, natural, and conversational" },
  { id: "Kore",   name: "Kore",   gender: "female", blurb: "Female · Soft, calm, and gentle" },
  { id: "Zephyr", name: "Zephyr", gender: "female", blurb: "Female · Relaxed, smooth, and mellow" },
  { id: "Puck",   name: "Puck",   gender: "male",   blurb: "Male · Playful, quick, and dry-witted" },
  { id: "Charon", name: "Charon", gender: "male",   blurb: "Male · Calm, formal, and authoritative" },
  { id: "Fenrir", name: "Fenrir", gender: "male",   blurb: "Male · Direct, intense, and steady" },
];
export const DEFAULT_VOICE = "Aoede";

// Full 30-voice catalog supported by Google Gemini Live / TTS
export const ALL_GEMINI_VOICES = [
  { id: "Aoede",        name: "Aoede",        gender: "female", tone: "Breezy & bright (Default)" },
  { id: "Leda",         name: "Leda",         gender: "female", tone: "Youthful & warm" },
  { id: "Kore",         name: "Kore",         gender: "female", tone: "Firm & gentle" },
  { id: "Zephyr",       name: "Zephyr",       gender: "female", tone: "Bright & relaxed" },
  { id: "Callirrhoe",   name: "Callirrhoe",   gender: "female", tone: "Easy-going & clear" },
  { id: "Autonoe",      name: "Autonoe",      gender: "female", tone: "Bright & energetic" },
  { id: "Despina",      name: "Despina",      gender: "female", tone: "Smooth & calm" },
  { id: "Erinome",      name: "Erinome",      gender: "female", tone: "Clear & articulate" },
  { id: "Laomedeia",    name: "Laomedeia",    gender: "female", tone: "Upbeat & cheerful" },
  { id: "Achernar",     name: "Achernar",     gender: "female", tone: "Soft & gentle" },
  { id: "Vindemiatrix", name: "Vindemiatrix", gender: "female", tone: "Gentle & serene" },
  { id: "Sulafat",      name: "Sulafat",      gender: "female", tone: "Warm & engaging" },
  { id: "Puck",         name: "Puck",         gender: "male",   tone: "Upbeat & playful" },
  { id: "Charon",       name: "Charon",       gender: "male",   tone: "Informative & formal" },
  { id: "Fenrir",       name: "Fenrir",       gender: "male",   tone: "Excitable & direct" },
  { id: "Orus",         name: "Orus",         gender: "male",   tone: "Firm & steady" },
  { id: "Enceladus",    name: "Enceladus",    gender: "male",   tone: "Breathy & expressive" },
  { id: "Iapetus",      name: "Iapetus",      gender: "male",   tone: "Clear & thoughtful" },
  { id: "Umbriel",      name: "Umbriel",      gender: "male",   tone: "Easy-going & mellow" },
  { id: "Algieba",      name: "Algieba",      gender: "male",   tone: "Smooth & confident" },
  { id: "Algenib",      name: "Algenib",      gender: "male",   tone: "Gravelly & distinct" },
  { id: "Rasalgethi",   name: "Rasalgethi",   gender: "male",   tone: "Informative & grounded" },
  { id: "Alnilam",      name: "Alnilam",      gender: "male",   tone: "Firm & crisp" },
  { id: "Schedar",      name: "Schedar",      gender: "male",   tone: "Even & measured" },
  { id: "Gacrux",       name: "Gacrux",       gender: "male",   tone: "Mature & resonant" },
  { id: "Pulcherrima",  name: "Pulcherrima",  gender: "male",   tone: "Forward & vibrant" },
  { id: "Achird",       name: "Achird",       gender: "male",   tone: "Friendly & casual" },
  { id: "Zubenelgenubi",name: "Zubenelgenubi",gender: "male",   tone: "Casual & natural" },
  { id: "Sadachbia",    name: "Sadachbia",    gender: "male",   tone: "Lively & animated" },
  { id: "Sadaltager",   name: "Sadaltager",   gender: "male",   tone: "Knowledgeable & authoritative" },
];

export const DEFAULT_LIVE_MODELS = [
  { id: "gemini-3.1-flash-live-preview", name: "Gemini 3.1 Flash Live", blurb: "Real-time streaming audio model (Recommended)" },
  { id: "gemini-2.5-flash-native-audio-preview", name: "Gemini 2.5 Flash Audio", blurb: "Native audio preview with multimodal reasoning" },
  { id: "gemini-3.8-live", name: "Gemini 3.8 Live", blurb: "High reasoning live streaming model" },
];
export const DEFAULT_MODEL = "gemini-3.1-flash-live-preview";

