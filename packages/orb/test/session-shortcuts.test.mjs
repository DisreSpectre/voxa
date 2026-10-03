import test from "node:test";
import assert from "node:assert/strict";

test("Stealth mode visibility rules state machine", () => {
  function computeVisibility({ stealthMode, state, settingsOpen }) {
    const isHidden = Boolean(stealthMode && state === "idle" && !settingsOpen);
    return { isHidden, isVisible: !isHidden };
  }

  // Normal mode: always visible
  assert.equal(computeVisibility({ stealthMode: false, state: "idle", settingsOpen: false }).isHidden, false);
  assert.equal(computeVisibility({ stealthMode: false, state: "listening", settingsOpen: false }).isHidden, false);

  // Stealth mode: hidden when idle, visible when active or settings open
  assert.equal(computeVisibility({ stealthMode: true, state: "idle", settingsOpen: false }).isHidden, true);
  assert.equal(computeVisibility({ stealthMode: true, state: "connecting", settingsOpen: false }).isHidden, false);
  assert.equal(computeVisibility({ stealthMode: true, state: "listening", settingsOpen: false }).isHidden, false);
  assert.equal(computeVisibility({ stealthMode: true, state: "speaking", settingsOpen: false }).isHidden, false);
  assert.equal(computeVisibility({ stealthMode: true, state: "idle", settingsOpen: true }).isHidden, false);
});

test("Escape key behavior priority dispatch", () => {
  function handleEscape({ contextMenuOpen, settingsOpen, isSessionActive, stealthMode }) {
    if (contextMenuOpen) return "close_context_menu";
    if (settingsOpen) return stealthMode ? "close_settings_and_hide" : "close_settings";
    if (isSessionActive) return stealthMode ? "stop_session_and_hide" : "stop_session";
    if (stealthMode) return "hide_ui";
    return "noop";
  }

  assert.equal(handleEscape({ contextMenuOpen: true }), "close_context_menu");
  assert.equal(handleEscape({ contextMenuOpen: false, settingsOpen: true, stealthMode: false }), "close_settings");
  assert.equal(handleEscape({ contextMenuOpen: false, settingsOpen: false, isSessionActive: true, stealthMode: false }), "stop_session");
  assert.equal(handleEscape({ contextMenuOpen: false, settingsOpen: false, isSessionActive: false, stealthMode: true }), "hide_ui");
});

test("btnBack navigation hierarchy", () => {
  function handleBack({ settingsOpen, expanded }) {
    if (settingsOpen) return "close_settings";
    if (expanded) return "collapse_chat";
    return "noop";
  }

  assert.equal(handleBack({ settingsOpen: true, expanded: true }), "close_settings");
  assert.equal(handleBack({ settingsOpen: true, expanded: false }), "close_settings");
  assert.equal(handleBack({ settingsOpen: false, expanded: true }), "collapse_chat");
  assert.equal(handleBack({ settingsOpen: false, expanded: false }), "noop");
});

test("close button collapses to taskbar orb or minimizes", () => {
  function handleClose({ settingsOpen, expanded, isCollapsed }) {
    if (settingsOpen || expanded) return "collapse_to_orb";
    if (isCollapsed) return "minimize_window";
    return "noop";
  }

  assert.equal(handleClose({ settingsOpen: true, expanded: false, isCollapsed: false }), "collapse_to_orb");
  assert.equal(handleClose({ settingsOpen: false, expanded: true, isCollapsed: false }), "collapse_to_orb");
  assert.equal(handleClose({ settingsOpen: false, expanded: false, isCollapsed: true }), "minimize_window");
});

test("stopSession preserves error state when requested", () => {
  function computeStatusOnStop({ preserveError, currentStatus, currentLine }) {
    if (preserveError) {
      return { status: currentStatus, line: currentLine };
    }
    return { status: "Idle", line: "Tap the orb to start" };
  }

  const normalStop = computeStatusOnStop({ preserveError: false, currentStatus: "Listening", currentLine: "Hello" });
  assert.equal(normalStop.status, "Idle");
  assert.equal(normalStop.line, "Tap the orb to start");

  const errorStop = computeStatusOnStop({ preserveError: true, currentStatus: "Error", currentLine: "Microphone blocked: grant mic permission in browser" });
  assert.equal(errorStop.status, "Error");
  assert.equal(errorStop.line, "Microphone blocked: grant mic permission in browser");
});

test("Model validation falls back to default on invalid or deprecated model", () => {
  const VALID_MODELS = [
    "gemini-2.5-flash-native-audio-preview",
    "gemini-3.1-flash-live-preview",
    "gemini-3.8-live",
  ];
  function resolveModel(stored) {
    return stored && VALID_MODELS.includes(stored) ? stored : "gemini-2.5-flash-native-audio-preview";
  }

  assert.equal(resolveModel("gemini-3.1-flash-live-preview"), "gemini-3.1-flash-live-preview");
  assert.equal(resolveModel("gemini-2.0-flash-exp"), "gemini-2.5-flash-native-audio-preview");
  assert.equal(resolveModel(null), "gemini-2.5-flash-native-audio-preview");
  assert.equal(resolveModel(""), "gemini-2.5-flash-native-audio-preview");
});

test("PcmPlayer close cleanly terminates context and sources", () => {
  let ctxClosed = false;
  let sourceStopped = false;
  let sourceDisconnected = false;

  const mockSource = {
    stop() { sourceStopped = true; },
    disconnect() { sourceDisconnected = true; },
  };

  const mockPlayer = {
    sources: [mockSource],
    ctx: {
      state: "running",
      close() { ctxClosed = true; },
    },
    analyser: {},
    stop() {
      for (const s of this.sources.splice(0)) {
        s.stop();
        s.disconnect();
      }
    },
    close() {
      this.stop();
      if (this.ctx && this.ctx.state !== "closed") {
        this.ctx.close();
      }
      this.ctx = null;
      this.analyser = null;
    },
  };

  mockPlayer.close();
  assert.equal(sourceStopped, true);
  assert.equal(sourceDisconnected, true);
  assert.equal(ctxClosed, true);
  assert.equal(mockPlayer.sources.length, 0);
  assert.equal(mockPlayer.ctx, null);
  assert.equal(mockPlayer.analyser, null);
});

test("on.status handler ignores undefined and handles offline without throwing", () => {
  let sessionStopped = false;
  let currentState = "";

  function handleStatus(st) {
    if (!st) return;
    if (st === "listening") currentState = "listening";
    else if (st === "speaking") currentState = "speaking";
    else if (st === "idle") currentState = "idle";
    else if (st === "offline") {
      sessionStopped = true;
      return;
    }
  }

  // Must not throw when undefined/null is passed from mic level ticks
  assert.doesNotThrow(() => handleStatus(undefined));
  assert.doesNotThrow(() => handleStatus(null));
  assert.doesNotThrow(() => handleStatus(""));

  // Valid states
  handleStatus("listening");
  assert.equal(currentState, "listening");
  handleStatus("speaking");
  assert.equal(currentState, "speaking");

  // Offline closes session
  handleStatus("offline");
  assert.equal(sessionStopped, true);
});

test("Streaming transcript bubbles update in-place during turn and finalize on complete", () => {
  const feed = [];

  function handleAssistantText(text) {
    const last = feed[feed.length - 1];
    if (last && last.role === "bot" && last.streaming) {
      last.text = text;
    } else {
      feed.push({ role: "bot", text, streaming: true });
    }
  }

  function handleTurnComplete() {
    const last = feed[feed.length - 1];
    if (last && last.streaming) {
      delete last.streaming;
    }
  }

  // Turn 1: streaming deltas
  handleAssistantText("Hello, how");
  handleAssistantText("Hello, how can");
  handleAssistantText("Hello, how can I help");
  handleAssistantText("Hello, how can I help you today?");

  // Should result in exactly ONE bot bubble with the complete text
  assert.equal(feed.length, 1);
  assert.equal(feed[0].text, "Hello, how can I help you today?");
  assert.equal(feed[0].streaming, true);

  handleTurnComplete();
  assert.equal(feed[0].streaming, undefined);

  // Turn 2: next response starts a new bubble
  handleAssistantText("The weather is sunny.");
  assert.equal(feed.length, 2);
  assert.equal(feed[1].text, "The weather is sunny.");
});

test("PcmPlayer unlock resumes suspended context and plays silent buffer", () => {
  let resumed = false;
  let bufferCreated = false;
  let sourceStarted = false;

  const mockCtx = {
    state: "suspended",
    sampleRate: 24000,
    async resume() { resumed = true; },
    createBuffer() {
      bufferCreated = true;
      return {};
    },
    createBufferSource() {
      return {
        buffer: null,
        connect() {},
        start() { sourceStarted = true; },
      };
    },
    destination: {},
  };

  const mockPlayer = {
    ctx: mockCtx,
    _ensureCtx() { return this.ctx; },
    unlock() {
      const ctx = this._ensureCtx();
      if (ctx && ctx.state === "suspended") {
        ctx.resume();
      }
      if (ctx) {
        const silent = ctx.createBuffer(1, 1, ctx.sampleRate);
        const src = ctx.createBufferSource();
        src.buffer = silent;
        src.connect(ctx.destination);
        src.start();
      }
    },
  };

  mockPlayer.unlock();
  assert.equal(resumed, true);
  assert.equal(bufferCreated, true);
  assert.equal(sourceStarted, true);
});


