// Voxa skins + palettes + themes
// Minimal design system: Minimal Orb, Taskbar Layout, Black & Nord themes.

export const PALETTES = {
  white: {
    id: "white",
    name: "Pure White",
    core: [255, 255, 255],
    accent: [255, 255, 255],
    hot: [255, 255, 255],
    deep: [30, 30, 30],
    line: [220, 220, 220],
    white: [255, 255, 255],
  },
  nord: {
    id: "nord",
    name: "Nord Blue",
    core: [136, 192, 208],
    accent: [136, 192, 208],
    hot: [236, 239, 244],
    deep: [46, 52, 64],
    line: [129, 161, 193],
    white: [245, 250, 255],
  },
};
export const PALETTE_ORDER = ["white", "nord"];
export const DEFAULT_PALETTE = "white";

export const SKINS = {
  minimal: {
    id: "minimal",
    name: "Minimal",
    sphere: "soft",
    ring: "none",
    flare: false,
    scan: false,
    defaultPalette: "white",
    blurb: "Clean, quiet minimal orb — waveform and audio-forward.",
  },
};
export const SKIN_ORDER = ["minimal"];
export const DEFAULT_SKIN = "minimal";

export function getSkin(id) {
  return SKINS[id] || SKINS[DEFAULT_SKIN];
}

export function getPalette(id) {
  return PALETTES[id] || PALETTES[DEFAULT_PALETTE];
}

export function resolveSkin(_q) {
  return "minimal";
}

export function resolvePalette(q) {
  const s = String(q || "").toLowerCase();
  if (/nord|blue|arctic|frost|slate/.test(s)) return "nord";
  return "white";
}

export const LAYOUTS = {
  taskbar: {
    id: "taskbar",
    name: "Taskbar",
    collapsed: { w: 56, h: 56 },
    peek: { w: 380, h: 140 },
    expanded: { w: 380, h: 500 },
    settingsH: 520,
    blurb: "Minimalist compact orb for the taskbar with hover flyout.",
  },
};
export const LAYOUT_ORDER = ["taskbar"];
export const DEFAULT_LAYOUT = "taskbar";

export function getLayout(_id) {
  return LAYOUTS.taskbar;
}

export function resolveLayout(_q) {
  return "taskbar";
}

export const THEMES = {
  black: {
    id: "black",
    name: "Black",
    palette: "white",
    accentCss: "255, 255, 255",
    blurb: "Deep black background with stark white accent.",
  },
  nord: {
    id: "nord",
    name: "Nord",
    palette: "nord",
    accentCss: "136, 192, 208",
    blurb: "Authentic Arctic frost palette with cool slate grays and Nord blue accent.",
  },
};
export const THEME_ORDER = ["black", "nord"];
export const DEFAULT_THEME = "black";

export function getTheme(id) {
  return THEMES[id] || THEMES[DEFAULT_THEME];
}

export function resolveTheme(q) {
  const s = String(q || "").toLowerCase();
  if (/nord|arctic|frost|polar|snow|slate|blue/.test(s)) return "nord";
  return "black";
}

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
export const DEFAULT_VOICE = "Aoede";

export const DEFAULT_LIVE_MODELS = [
  { id: "gemini-3.1-flash-live-preview", name: "Gemini 3.1 Flash Live", blurb: "Real-time streaming audio model (Recommended)" },
  { id: "gemini-2.5-flash-native-audio-preview", name: "Gemini 2.5 Flash Audio", blurb: "Native audio preview with multimodal reasoning" },
  { id: "gemini-3.8-live", name: "Gemini 3.8 Live", blurb: "High reasoning live streaming model" },
];
export const DEFAULT_MODEL = "gemini-3.1-flash-live-preview";
