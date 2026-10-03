// ── Voxa Minimal Orb Shell ────────────────────────────────────────────────
// Clean, low-latency Gemini Live realtime voice assistant in a minimal floating taskbar orb.

import { GeminiSession } from "./js/gemini.js";
import { ToolBridge } from "./js/tools.js";
import { createOrb } from "./js/orb.js";
import {
  getSkin,
  getPalette,
  getLayout,
  getTheme,
  DEFAULT_SKIN,
  DEFAULT_PALETTE,
  DEFAULT_LAYOUT,
  DEFAULT_THEME,
  THEME_ORDER,
  resolveTheme,
} from "./js/skins.js";

const TAURI = window.__TAURI__;

const els = {
  body: document.body,
  dock: document.querySelector(".dock"),
  orb: document.getElementById("orb"),
  orbCanvas: document.getElementById("orbCanvas"),
  btnBack: document.getElementById("btnBack"),
  status: document.getElementById("status"),
  line: document.getElementById("line"),
  feed: document.getElementById("feed"),
  settings: document.getElementById("settings"),
  themeSel: document.getElementById("themeSel"),
  keyInput: document.getElementById("keyInput"),
  modelSel: document.getElementById("modelSel"),
  voiceSel: document.getElementById("voiceSel"),
  micSel: document.getElementById("micSel"),
  micGain: document.getElementById("micGain"),
  micGainVal: document.getElementById("micGainVal"),
  micMeter: document.getElementById("micMeter"),
  noiseSuppress: document.getElementById("noiseSuppress"),
  autoGain: document.getElementById("autoGain"),
  vadSel: document.getElementById("vadSel"),
  brand: document.getElementById("brand"),
  gear: document.getElementById("gear"),
  expand: document.getElementById("expand"),
  close: document.getElementById("close"),
  wave: document.getElementById("wave"),
  wave2: document.getElementById("wave2"),
  composer: document.getElementById("composer"),
  composerInput: document.getElementById("composerInput"),
  ptt: document.getElementById("ptt"),
  send: document.getElementById("send"),
  hint: document.getElementById("hint"),
  sysstats: document.getElementById("sysstats"),
  contextMenu: document.getElementById("contextMenu"),
  ctxTalkLabel: document.getElementById("ctxTalkLabel"),
  ctxStealthLabel: document.getElementById("ctxStealthLabel"),
};

els.body.classList.add("lay-taskbar");
if (!TAURI) els.body.classList.add("web-preview");

// Initialize minimal procedural canvas orb
const orb = createOrb(els.orbCanvas);

// ── State & Config ────────────────────────────────────────────────────────
const VALID_MODELS = [
  "gemini-2.5-flash-native-audio-preview",
  "gemini-3.1-flash-live-preview",
  "gemini-3.8-live",
];
const storedModel = localStorage.getItem("voxa.model");
const defaultModel = storedModel && VALID_MODELS.includes(storedModel)
  ? storedModel
  : "gemini-2.5-flash-native-audio-preview";

const SETTINGS = {
  sources: ["http://localhost:3010"],
  voice: {
    model: defaultModel,
    voiceName: localStorage.getItem("voxa.voice") || "Aoede",
  },
  persona: {
    name: "Companion",
    instruction: "You are a concise, helpful desktop voice assistant living in a minimal glowing orb. Respond directly, naturally, and warmly in 1-2 spoken sentences.",
  },
  ui: {
    pushToTalk: false,
    pttKey: "Space",
    pttMod: "ctrl",
  },
};

const appearance = {
  get skin() { return DEFAULT_SKIN; },
  get layout() { return DEFAULT_LAYOUT; },
  get theme() { return localStorage.getItem("voxa.theme") || DEFAULT_THEME; },
  set theme(v) { localStorage.setItem("voxa.theme", v); },
};

let session = null;
let state = "idle";
let starting = false;
let expanded = false;
let isHoveringDock = false;
let isDraggingOrb = false;
let orbPointerDownPos = null;
let pttHeld = false;
let isResizingWindow = false;
let isPlaced = false;

// ── Window Positioning (Rock-solid Orb Anchor) ───────────────────────────
// The orb anchor stores the physical screen coordinates of the 56x56 collapsed orb.
// Any expansion or flyout expands upward/leftward from this fixed anchor point.
function getSavedOrbAnchor() {
  try {
    const raw = localStorage.getItem("voxa.orbAnchor");
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (typeof p?.x === "number" && typeof p?.y === "number") return p;
  } catch {}
  return null;
}

function saveOrbAnchor(pos) {
  if (pos && typeof pos.x === "number" && typeof pos.y === "number") {
    localStorage.setItem("voxa.orbAnchor", JSON.stringify(pos));
  }
}

let _saveAnchorTimer = null;
function debouncedSaveOrbAnchor(pos) {
  clearTimeout(_saveAnchorTimer);
  _saveAnchorTimer = setTimeout(() => {
    saveOrbAnchor(pos);
  }, 150);
}

async function setWindowSize(w, h, resizable = false) {
  if (!TAURI?.window?.getCurrentWindow) return;
  const win = TAURI.window.getCurrentWindow();
  isResizingWindow = true;

  try {
    const sf = (await win.scaleFactor().catch(() => 1)) || 1;
    const targetW = Math.round(w * sf);
    const targetH = Math.round(h * sf);

    let anchor = getSavedOrbAnchor();
    const mon = await win.currentMonitor().catch(() => null);

    if (!anchor && mon) {
      const margin = Math.round(12 * sf);
      const taskbar = Math.round(56 * sf);
      anchor = {
        x: mon.position.x + Math.max(0, mon.size.width - Math.round(56 * sf) - margin),
        y: mon.position.y + Math.max(0, mon.size.height - Math.round(56 * sf) - taskbar),
      };
      saveOrbAnchor(anchor);
    }

    if (!anchor) return;

    // Anchor the bottom-right of the window to the bottom-right of the 56x56 orb
    const orbRight = anchor.x + Math.round(56 * sf);
    const orbBottom = anchor.y + Math.round(56 * sf);

    let targetX = orbRight - targetW;
    let targetY = orbBottom - targetH;

    // Clamp inside current monitor
    if (mon) {
      const minX = mon.position.x;
      const maxX = mon.position.x + mon.size.width - targetW;
      const minY = mon.position.y;
      const maxY = mon.position.y + mon.size.height - targetH;
      targetX = Math.max(minX, Math.min(targetX, maxX));
      targetY = Math.max(minY, Math.min(targetY, maxY));
    }

    await win.setResizable(!!resizable);
    await win.setSize(new TAURI.window.PhysicalSize(targetW, targetH));
    await win.setPosition(new TAURI.window.PhysicalPosition(Math.round(targetX), Math.round(targetY)));
  } catch (err) {
    console.warn("[orb] setWindowSize failed:", err);
  } finally {
    setTimeout(() => { isResizingWindow = false; }, 200);
  }
}

async function dockBottomRight() {
  if (!TAURI?.window?.getCurrentWindow) return;
  const win = TAURI.window.getCurrentWindow();

  let mon = null;
  for (let i = 0; i < 20 && !mon; i++) {
    try { mon = await win.currentMonitor(); } catch {}
    if (!mon) await new Promise((r) => setTimeout(r, 80));
  }
  if (!mon) return;

  const sf = mon.scaleFactor || 1;
  const orbSizePhys = Math.round(56 * sf);
  const margin = Math.round(12 * sf);
  const taskbar = Math.round(56 * sf);

  let anchor = getSavedOrbAnchor();
  const isOffScreen = !anchor ||
    anchor.x < mon.position.x - 20 ||
    anchor.x > mon.position.x + mon.size.width - 20 ||
    anchor.y < mon.position.y - 20 ||
    anchor.y > mon.position.y + mon.size.height - 20;

  if (isOffScreen) {
    anchor = {
      x: mon.position.x + Math.max(0, mon.size.width - orbSizePhys - margin),
      y: mon.position.y + Math.max(0, mon.size.height - orbSizePhys - taskbar),
    };
    saveOrbAnchor(anchor);
  }

  try {
    await win.setSize(new TAURI.window.PhysicalSize(orbSizePhys, orbSizePhys));
    await win.setPosition(new TAURI.window.PhysicalPosition(anchor.x, anchor.y));
    await win.show();
    await win.setFocus();
  } catch (err) {
    console.warn("[orb] dockBottomRight failed:", err);
  } finally {
    isPlaced = true;
  }
}

function trackWindowMovement() {
  if (!TAURI?.window?.getCurrentWindow) return;
  try {
    const win = TAURI.window.getCurrentWindow();
    win.onMoved(({ payload }) => {
      if (!isPlaced || isResizingWindow || !payload) return;
      // Only record anchor update if collapsed and not in transient flyout
      if (!expanded && !els.body.classList.contains("flyout-active") && (!els.settings || els.settings.classList.contains("hidden"))) {
        debouncedSaveOrbAnchor({ x: payload.x, y: payload.y });
      }
    });
  } catch (err) {
    console.warn("[orb] Movement tracking error:", err);
  }
}

// ── Themes & Appearance ──────────────────────────────────────────────────
function applyTheme(themeId) {
  const t = getTheme(themeId);
  appearance.theme = t.id;
  for (const k of THEME_ORDER) {
    els.body.classList.toggle("theme-" + k, k === t.id);
  }
  const pal = getPalette(t.palette);
  orb.setSkin("minimal");
  orb.setPalette(pal.id);
  if (els.themeSel) els.themeSel.value = t.id;
  return t;
}

function chooseTheme(id) {
  return applyTheme(id);
}

// ── UI States & Status ────────────────────────────────────────────────────
function setState(st) {
  state = st;
  for (const c of ["idle", "connecting", "listening", "speaking"]) {
    els.body.classList.toggle(c, c === st);
  }
  orb.setOrbState(st);
  if (st === "idle") {
    scheduleTaskbarCollapse();
  }
}

function setStatus(text) {
  if (els.status) els.status.textContent = text;
}

function setLine(text, isUser = false) {
  if (!els.line) return;
  els.line.textContent = text || "";
  els.line.classList.toggle("user", !!isUser);
}

function pushHistory(who, text) {
  if (!text || !els.feed) return null;
  const msg = document.createElement("div");
  msg.className = `msg ${who}`;
  msg.textContent = text;
  els.feed.appendChild(msg);
  els.feed.scrollTop = els.feed.scrollHeight;
  return msg;
}

// ── Taskbar Flyout Peek / Collapse ────────────────────────────────────────
let collapseTimer = null;

function scheduleTaskbarCollapse() {
  if (collapseTimer) clearTimeout(collapseTimer);
  collapseTimer = setTimeout(async () => {
    collapseTimer = null;
    if (isHoveringDock || state !== "idle" || expanded || !els.settings?.classList.contains("hidden")) return;
    if (els.contextMenu && !els.contextMenu.classList.contains("hidden")) return;

    els.body.classList.remove("flyout-active");
    if (TAURI) await setWindowSize(56, 56, false);
  }, 350);
}

if (els.dock) {
  els.dock.addEventListener("pointerenter", async () => {
    isHoveringDock = true;
    if (collapseTimer) {
      clearTimeout(collapseTimer);
      collapseTimer = null;
    }
    if (!expanded) {
      els.body.classList.add("flyout-active");
      if (TAURI) await setWindowSize(380, 140, false);
    }
  });

  els.dock.addEventListener("pointerleave", () => {
    isHoveringDock = false;
    scheduleTaskbarCollapse();
  });
}

async function toggleExpand() {
  expanded = !expanded;
  els.body.classList.toggle("expanded", expanded);
  els.feed?.classList.toggle("hidden", !expanded);
  els.composer?.classList.toggle("hidden", !expanded);
  els.hint?.classList.toggle("hidden", !expanded);

  if (expanded) {
    els.body.classList.add("flyout-active");
    if (TAURI) await setWindowSize(380, 500, true);
    if (els.composerInput) els.composerInput.focus();
    els.feed.scrollTop = els.feed.scrollHeight;
  } else {
    if (state !== "idle" || isHoveringDock) {
      if (TAURI) await setWindowSize(380, 140, false);
    } else {
      els.body.classList.remove("flyout-active");
      if (TAURI) await setWindowSize(56, 56, false);
    }
  }
}

// ── Audio Waveform Meters ─────────────────────────────────────────────────
let lastWaveState = "";
function renderWaveforms() {
  const lvl = session ? session.getOutputLevel() : 0;
  orb.setAudioLevel(lvl);

  const drawWave = (canvas) => {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height;
    if (state === "idle") {
      if (lastWaveState !== "idle") {
        ctx.clearRect(0, 0, w, h);
      }
      return;
    }
    ctx.clearRect(0, 0, w, h);

    const bars = 8;
    const barW = Math.max(2, (w / bars) - 2);
    ctx.fillStyle = state === "speaking" ? "rgba(255,255,255,0.8)" : "rgba(136,192,208,0.8)";
    for (let i = 0; i < bars; i++) {
      const bh = Math.max(3, Math.min(h, h * lvl * (0.6 + 0.4 * Math.sin(Date.now() / 120 + i))));
      const bx = i * (barW + 2);
      const by = (h - bh) / 2;
      ctx.fillRect(bx, by, barW, bh);
    }
  };

  drawWave(els.wave);
  drawWave(els.wave2);
  lastWaveState = state;
  requestAnimationFrame(renderWaveforms);
}
requestAnimationFrame(renderWaveforms);

// ── Voice Session (Gemini Live) ───────────────────────────────────────────
async function loadVoxaConfig() {
  try {
    const raw = TAURI?.core?.invoke ? await TAURI.core.invoke("read_local_config") : localStorage.getItem("voxa.config");
    if (!raw) return;
    const cfg = JSON.parse(raw);
    if (cfg.voice?.model) SETTINGS.voice.model = cfg.voice.model;
    if (cfg.voice?.voiceName) SETTINGS.voice.voiceName = cfg.voice.voiceName;
    if (cfg.persona?.name) SETTINGS.persona.name = cfg.persona.name;
    if (cfg.persona?.instruction) SETTINGS.persona.instruction = cfg.persona.instruction;
    if (Array.isArray(cfg.sources) && cfg.sources.length) SETTINGS.sources = cfg.sources.map((s) => s.url || s);
  } catch {}
}

async function hydrateGeminiKeyFromHarness() {
  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 2000);
    const res = await fetch("http://localhost:3010/api/secrets/geminiApiKey", { signal: ctrl.signal });
    clearTimeout(timeout);
    if (!res.ok) return "";
    const data = await res.json();
    if (data?.value) {
      const k = String(data.value).trim();
      if (k) {
        localStorage.setItem("voxa.geminiKey", k);
        return k;
      }
    }
  } catch {}
  return "";
}

async function askForKey() {
  setStatus("Key required");
  setLine("Enter your Gemini API key in Settings");
  await openSettings();
  const aiTabBtn = els.settings?.querySelector('.settings-tab[data-tab="ai"]');
  aiTabBtn?.click();
  if (els.keyInput) {
    els.keyInput.focus();
    els.keyInput.select();
  }
}

async function startSession() {
  if (session || starting) return;
  starting = true;
  await loadVoxaConfig();

  let apiKey = (localStorage.getItem("voxa.geminiKey") || "").trim();
  if (!apiKey) {
    apiKey = await hydrateGeminiKeyFromHarness();
  }
  if (!apiKey) {
    starting = false;
    return askForKey();
  }

  els.body.classList.add("flyout-active");
  if (TAURI && !expanded) await setWindowSize(380, 140, false);

  setState("connecting");
  setStatus("Connecting…");
  setLine("…");

  const toolBridge = new ToolBridge(SETTINGS.sources);

  // Local tools executable by voice
  const localTools = [
    {
      name: "set_theme",
      description: "Switch the orb UI theme. Options: 'black' (black background with white accent) or 'nord' (arctic slate background with blue accent).",
      parameters: {
        type: "object",
        properties: { theme: { type: "string", description: "Either 'black' or 'nord'" } },
        required: ["theme"],
      },
      handler: async (args) => {
        const th = resolveTheme(args?.theme);
        chooseTheme(th);
        return `Theme set to ${th}.`;
      },
    },
  ];

  try {
    session = new GeminiSession({
      apiKey,
      model: SETTINGS.voice.model,
      voice: SETTINGS.voice.voiceName || localStorage.getItem("voxa.voice") || "Aoede",
      systemInstruction: SETTINGS.persona.instruction,
      toolBridge,
      localTools,
      micDeviceId: els.micSel?.value || null,
      audio: {
        gain: parseFloat(els.micGain?.value || "1.0"),
        noiseSuppression: !!els.noiseSuppress?.checked,
        autoGainControl: !!els.autoGain?.checked,
        vadSensitivity: els.vadSel?.value || "",
      },
      on: {
        status: (st) => {
          if (!st) return;
          if (st === "listening") {
            setState("listening");
            const last = els.feed?.lastElementChild;
            if (last?.dataset.streaming === "1") delete last.dataset.streaming;
          } else if (st === "speaking") {
            setState("speaking");
          } else if (st === "idle") {
            setState("idle");
          } else if (st === "offline") {
            stopSession(false);
            return;
          }
          setStatus(st.charAt(0).toUpperCase() + st.slice(1));
        },
        level: (lvl) => {
          if (els.micMeter) {
            const pct = Math.min(100, Math.max(0, Math.round((lvl || 0) * 100)));
            els.micMeter.style.width = `${pct}%`;
          }
        },
        userText: (text) => {
          setLine(text, true);
          const last = els.feed?.lastElementChild;
          if (last?.classList.contains("user") && last.dataset.streaming === "1") {
            last.textContent = text;
            els.feed.scrollTop = els.feed.scrollHeight;
          } else {
            const el = pushHistory("user", text);
            if (el) el.dataset.streaming = "1";
          }
        },
        assistantText: (text) => {
          setLine(text, false);
          const last = els.feed?.lastElementChild;
          if (last?.classList.contains("bot") && last.dataset.streaming === "1") {
            last.textContent = text;
            els.feed.scrollTop = els.feed.scrollHeight;
          } else {
            const el = pushHistory("bot", text);
            if (el) el.dataset.streaming = "1";
          }
        },
        error: (err) => {
          console.error("[orb] Session error:", err);
          const msg = err?.message || String(err) || "Session error";
          setStatus("Error");
          setLine(msg, false);
          pushHistory("bot", `[Error] ${msg}`);
          stopSession(true);
          if (/api key|apikey|api_key|401|403|unauthorized/i.test(msg)) {
            askForKey();
          }
        },
      },
    });

    session.player?.unlock?.();
    await session.start();
    setState("listening");
    setStatus("Listening…");
    setLine("Listening…");
  } catch (err) {
    console.error("[orb] Failed to start Gemini Live:", err);
    let msg = err?.message || String(err) || "Connection failed";
    if (/permission denied|notallowederror|notfounderror/i.test(msg)) {
      msg = "Microphone blocked: grant mic permission in browser";
    }
    setStatus("Error");
    setLine(msg);
    pushHistory("bot", `[Error] ${msg}`);
    stopSession(true);
    if (/api key|apikey|api_key|401|403|unauthorized/i.test(msg)) {
      askForKey();
    }
  } finally {
    starting = false;
  }
}

function stopSession(preserveError = false) {
  if (session) {
    try { session.stop(); } catch {}
    session = null;
  }
  setState("idle");
  if (!preserveError) {
    setStatus("Idle");
    setLine("Tap the orb to start");
  }
  scheduleTaskbarCollapse();
}

function toggleSession() {
  if (state === "idle") startSession();
  else stopSession();
}

// ── Dragging & Orb Click ──────────────────────────────────────────────────
els.orb.addEventListener("pointerdown", (e) => {
  if (e.button === 0) {
    orbPointerDownPos = { x: e.screenX, y: e.screenY };
    isDraggingOrb = false;
  }
});

els.orb.addEventListener("pointermove", (e) => {
  if (orbPointerDownPos && TAURI?.window?.getCurrentWindow) {
    const dist = Math.hypot(e.screenX - orbPointerDownPos.x, e.screenY - orbPointerDownPos.y);
    if (dist > 5) {
      isDraggingOrb = true;
      orbPointerDownPos = null;
      try {
        TAURI.window.getCurrentWindow().startDragging().catch(() => {});
      } catch {}
      setTimeout(() => { isDraggingOrb = false; }, 300);
    }
  }
});

window.addEventListener("pointerup", async () => {
  if (isDraggingOrb && TAURI?.window?.getCurrentWindow) {
    try {
      const win = TAURI.window.getCurrentWindow();
      const pos = await win.outerPosition();
      saveOrbAnchor({ x: pos.x, y: pos.y });
    } catch {}
  }
  orbPointerDownPos = null;
  setTimeout(() => { isDraggingOrb = false; }, 100);
});

els.orb.addEventListener("click", (e) => {
  e.stopPropagation();
  if (isDraggingOrb) {
    isDraggingOrb = false;
    return;
  }
  toggleSession();
});

// ── Composer & Text Input ─────────────────────────────────────────────────
function sendComposerText() {
  const text = (els.composerInput?.value || "").trim();
  if (!text) return;
  els.composerInput.value = "";
  const last = els.feed?.lastElementChild;
  if (last?.dataset.streaming === "1") delete last.dataset.streaming;
  if (session) {
    session.sendText(text);
    pushHistory("user", text);
  } else {
    startSession()
      .then(() => {
        if (session) {
          session.sendText(text);
          pushHistory("user", text);
        }
      })
      .catch((err) => {
        const msg = err?.message || String(err) || "Failed to start session";
        console.error("[orb] sendComposerText startSession error:", err);
        pushHistory("bot", `[Error] ${msg}`);
        setStatus("Error");
        setLine(msg);
      });
  }
}

els.send?.addEventListener("click", sendComposerText);
els.composerInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendComposerText();
  }
});

els.expand?.addEventListener("click", toggleExpand);

// ── Back Button & Minimize Button ─────────────────────────────────────────
async function goBack() {
  if (els.settings && !els.settings.classList.contains("hidden")) {
    await closeSettings();
  } else if (expanded) {
    await toggleExpand();
  }
}

async function handleCloseOrMinimize() {
  if (els.settings && !els.settings.classList.contains("hidden")) {
    await closeSettings();
  }
  if (expanded) {
    await toggleExpand();
  }
  isHoveringDock = false;
  els.body.classList.remove("flyout-active");
  if (TAURI?.window?.getCurrentWindow) {
    const win = TAURI.window.getCurrentWindow();
    await setWindowSize(56, 56, false);
    try { await win.minimize(); } catch {}
  }
}

els.btnBack?.addEventListener("click", (e) => {
  e.stopPropagation();
  goBack();
});

els.close?.addEventListener("click", async (e) => {
  e.stopPropagation();
  await handleCloseOrMinimize();
});

// ── Push-to-Talk / Mic Button ─────────────────────────────────────────────
els.ptt?.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleSession();
});

els.ptt?.addEventListener("pointerdown", () => {
  if (SETTINGS.ui.pushToTalk && session) {
    session.setMicMuted(false);
  }
});

els.ptt?.addEventListener("pointerup", () => {
  if (SETTINGS.ui.pushToTalk && session) {
    session.setMicMuted(true);
  }
});

els.ptt?.addEventListener("pointerleave", () => {
  if (SETTINGS.ui.pushToTalk && session) {
    session.setMicMuted(true);
  }
});

// ── Settings Dialog ───────────────────────────────────────────────────────
async function openSettings() {
  els.settings.classList.remove("hidden");
  els.body.classList.add("settings-open");
  els.body.classList.add("flyout-active");
  if (TAURI) await setWindowSize(380, 500, true);
  if (els.keyInput) {
    els.keyInput.value = localStorage.getItem("voxa.geminiKey") || "";
  }
}

async function closeSettings() {
  els.settings.classList.add("hidden");
  els.body.classList.remove("settings-open");
  if (!expanded) {
    if (state === "idle" && !isHoveringDock) {
      els.body.classList.remove("flyout-active");
      if (TAURI) await setWindowSize(56, 56, false);
    } else {
      if (TAURI) await setWindowSize(380, 140, false);
    }
  } else {
    if (TAURI) await setWindowSize(380, 500, true);
  }
}

els.gear?.addEventListener("click", async (e) => {
  e.stopPropagation();
  if (els.settings.classList.contains("hidden")) {
    await openSettings();
  } else {
    await closeSettings();
  }
});

function wireSettingsTabs() {
  const tabBtns = els.settings?.querySelectorAll(".settings-tab");
  const tabPanels = els.settings?.querySelectorAll(".tab-content");
  if (!tabBtns || !tabPanels) return;
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabId = btn.dataset.tab;
      tabBtns.forEach((b) => b.classList.toggle("active", b.dataset.tab === tabId));
      tabPanels.forEach((p) => p.classList.toggle("active", p.dataset.tab === tabId));
    });
  });
}

function syncSettingsInputs() {
  if (els.keyInput) {
    els.keyInput.value = localStorage.getItem("voxa.geminiKey") || "";
    const saveKey = () => {
      const val = els.keyInput.value.trim();
      if (val) {
        localStorage.setItem("voxa.geminiKey", val);
        setLine("Gemini key saved");
      }
    };
    els.keyInput.addEventListener("change", saveKey);
    els.keyInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        saveKey();
        els.keyInput.blur();
      }
    });
  }
  if (els.modelSel) {
    els.modelSel.value = SETTINGS.voice.model;
    els.modelSel.addEventListener("change", () => {
      SETTINGS.voice.model = els.modelSel.value;
      localStorage.setItem("voxa.model", els.modelSel.value);
    });
  }
  if (els.voiceSel) {
    els.voiceSel.value = SETTINGS.voice.voiceName || "Aoede";
    els.voiceSel.addEventListener("change", () => {
      SETTINGS.voice.voiceName = els.voiceSel.value;
      localStorage.setItem("voxa.voice", els.voiceSel.value);
    });
  }
  if (els.micGain) {
    els.micGain.addEventListener("input", () => {
      const g = parseFloat(els.micGain.value || "1.0");
      if (els.micGainVal) els.micGainVal.textContent = `${g.toFixed(1)}×`;
      session?.setAudioParams({ gain: g });
    });
  }
  if (els.noiseSuppress) {
    els.noiseSuppress.addEventListener("change", () => {
      session?.setAudioParams({ noiseSuppression: !!els.noiseSuppress.checked });
    });
  }
  if (els.autoGain) {
    els.autoGain.addEventListener("change", () => {
      session?.setAudioParams({ autoGainControl: !!els.autoGain.checked });
    });
  }
  if (els.vadSel) {
    els.vadSel.addEventListener("change", () => {
      session?.setAudioParams({ vadSensitivity: els.vadSel.value });
    });
  }
  if (els.micSel) {
    els.micSel.addEventListener("change", () => {
      session?.setMicDevice(els.micSel.value);
    });
  }
}

// ── Context Menu (Right Click) ────────────────────────────────────────────
els.orb.addEventListener("contextmenu", async (e) => {
  e.preventDefault();
  if (!els.contextMenu) return;
  els.ctxTalkLabel.textContent = state === "idle" ? "Start conversation (Ctrl+Space)" : "Stop conversation (Esc)";
  els.body.classList.add("flyout-active");
  if (TAURI && !expanded) await setWindowSize(380, 240, false);
  els.contextMenu.classList.remove("hidden");
});

document.addEventListener("pointerdown", (e) => {
  if (els.contextMenu && !els.contextMenu.classList.contains("hidden")) {
    if (!els.contextMenu.contains(e.target) && !els.orb.contains(e.target)) {
      els.contextMenu.classList.add("hidden");
      scheduleTaskbarCollapse();
    }
  }
});

els.contextMenu?.addEventListener("click", async (e) => {
  const item = e.target.closest("[data-action]");
  if (!item) return;
  const action = item.getAttribute("data-action");
  els.contextMenu.classList.add("hidden");

  switch (action) {
    case "toggle-talk":
      toggleSession();
      break;
    case "theme-black":
      chooseTheme("black");
      break;
    case "theme-nord":
      chooseTheme("nord");
      break;
    case "toggle-stealth":
      els.body.classList.toggle("stealth-idle");
      break;
    case "settings":
      await openSettings();
      break;
    case "reset-pos":
      localStorage.removeItem("voxa.orbAnchor");
      await dockBottomRight();
      break;
    case "close":
      stopSession();
      if (TAURI?.window?.getCurrentWindow) {
        TAURI.window.getCurrentWindow().close();
      } else {
        window.close();
      }
      break;
  }
});

// ── Keyboard Shortcuts ────────────────────────────────────────────────────
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && (e.ctrlKey || e.metaKey)) {
    if (document.activeElement === els.composerInput || document.activeElement === els.keyInput) return;
    e.preventDefault();
    toggleSession();
  } else if (e.key === "Escape") {
    if (els.contextMenu && !els.contextMenu.classList.contains("hidden")) {
      els.contextMenu.classList.add("hidden");
      scheduleTaskbarCollapse();
      return;
    }
    if (els.settings && !els.settings.classList.contains("hidden")) {
      closeSettings();
      return;
    }
    if (expanded) {
      toggleExpand();
      return;
    }
    if (state !== "idle") {
      stopSession();
    }
  }
});

// Global shortcut from Tauri background plugin
if (TAURI?.event?.listen) {
  TAURI.event.listen("global-shortcut", () => {
    toggleSession();
  });
}

// ── System Stats Polling ──────────────────────────────────────────────────
let sysStatsEnabled = true;
let ssCpu = null;
let ssRam = null;
let ssTemp = null;

async function pollSysStats() {
  if (!els.sysstats || !sysStatsEnabled) return;
  const baseUrl = (SETTINGS.sources && SETTINGS.sources[0]) || "http://localhost:3010";
  try {
    const res = await fetch(`${baseUrl}/api/connectors/system-stats/actions/sysstats_snapshot`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ args: {} }),
    });
    if (!res.ok) return;
    const data = await res.json().catch(() => ({}));
    if (data?.result) {
      const s = typeof data.result === "string" ? JSON.parse(data.result) : data.result;
      if (!ssCpu) {
        els.sysstats.innerHTML = "";
        ssCpu = document.createElement("span");
        ssCpu.className = "ss-item";
        ssRam = document.createElement("span");
        ssRam.className = "ss-item";
        ssTemp = document.createElement("span");
        ssTemp.className = "ss-item";
        els.sysstats.appendChild(ssCpu);
        els.sysstats.appendChild(ssRam);
        els.sysstats.appendChild(ssTemp);
      }

      if (s.cpu != null) {
        ssCpu.textContent = `CPU ${Math.round(s.cpu)}%`;
        ssCpu.style.display = "";
      } else {
        ssCpu.style.display = "none";
      }

      if (s.ram != null) {
        ssRam.textContent = `RAM ${Math.round(s.ram)}%`;
        ssRam.style.display = "";
      } else {
        ssRam.style.display = "none";
      }

      if (s.cpuTemp != null) {
        ssTemp.textContent = `${Math.round(s.cpuTemp)}°C`;
        ssTemp.style.display = "";
      } else {
        ssTemp.style.display = "none";
      }

      els.sysstats.classList.remove("hidden");
    }
  } catch {}
}
setInterval(pollSysStats, 3000);
pollSysStats();

// ── Mic Device Selector ───────────────────────────────────────────────────
async function populateMicDevices() {
  if (!navigator.mediaDevices?.enumerateDevices || !els.micSel) return;
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const mics = devices.filter((d) => d.kind === "audioinput");
    els.micSel.innerHTML = "";
    for (const m of mics) {
      const opt = document.createElement("option");
      opt.value = m.deviceId;
      opt.textContent = m.label || `Microphone ${els.micSel.children.length + 1}`;
      els.micSel.appendChild(opt);
    }
  } catch {}
}
populateMicDevices();

if (els.themeSel) {
  els.themeSel.value = appearance.theme;
  els.themeSel.addEventListener("change", () => {
    chooseTheme(els.themeSel.value);
  });
}

// ── Bootstrapping ─────────────────────────────────────────────────────────
wireSettingsTabs();
syncSettingsInputs();
applyTheme(appearance.theme);
trackWindowMovement();
dockBottomRight();
setState("idle");
setStatus("Idle");
setLine("Tap the orb to start");
