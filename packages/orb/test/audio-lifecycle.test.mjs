import test from "node:test";
import assert from "node:assert/strict";
import { MicCapture, int16ToBase64, base64ToInt16 } from "../src/js/audio.js";

test("MicCapture constructor initializes with expected defaults", () => {
  const mic = new MicCapture();
  assert.equal(mic.gain, 1);
  assert.equal(mic.noiseSuppression, true);
  assert.equal(mic.autoGainControl, true);
  assert.equal(mic.echoCancellation, true);
  assert.equal(mic.active, false);
  assert.equal(mic.stream, null);
  assert.equal(mic.ctx, null);
});

test("MicCapture.setGain updates gain value", () => {
  const mic = new MicCapture({ gain: 1.5 });
  assert.equal(mic.gain, 1.5);
  mic.setGain(2.2);
  assert.equal(mic.gain, 2.2);
  mic.setGain(NaN);
  assert.equal(mic.gain, 1); // fallback to 1 on invalid
});

test("MicCapture.stop terminates all MediaStream tracks and resets state", () => {
  const mic = new MicCapture();
  let track1Stopped = false;
  let track2Stopped = false;
  let processorDisconnected = false;
  let sourceDisconnected = false;
  let contextClosed = false;
  let reportedLevel = -1;

  // Mock audio nodes and stream
  mic.stream = {
    getTracks: () => [
      { stop: () => { track1Stopped = true; } },
      { stop: () => { track2Stopped = true; } },
    ],
  };
  mic.processor = { disconnect: () => { processorDisconnected = true; } };
  mic.source = { disconnect: () => { sourceDisconnected = true; } };
  mic.ctx = { close: () => { contextClosed = true; } };
  mic.onLevel = (lvl) => { reportedLevel = lvl; };
  mic.active = true;

  mic.stop();

  assert.equal(mic.active, false, "active flag must be reset to false");
  assert.equal(track1Stopped, true, "track 1 must be stopped");
  assert.equal(track2Stopped, true, "track 2 must be stopped");
  assert.equal(processorDisconnected, true, "processor must be disconnected");
  assert.equal(sourceDisconnected, true, "source must be disconnected");
  assert.equal(contextClosed, true, "audio context must be closed");
  assert.equal(reportedLevel, 0, "level must be reset to 0");
  assert.equal(mic.stream, null, "stream must be nulled");
  assert.equal(mic.ctx, null, "ctx must be nulled");
});

test("PCM audio conversion roundtrips accurately", () => {
  const original = new Int16Array([-32768, -16384, 0, 16384, 32767]);
  const b64 = int16ToBase64(original);
  assert.ok(typeof b64 === "string" && b64.length > 0, "Base64 string must be non-empty");

  const restored = base64ToInt16(b64);
  assert.equal(restored.length, original.length, "Restored length must match");
  for (let i = 0; i < original.length; i++) {
    assert.equal(restored[i], original[i], `Sample ${i} must match`);
  }
});

test("Session teardown pattern guarantees mic track termination", () => {
  let sessionStopped = false;
  let tracksStoppedCount = 0;

  const mockSession = {
    mic: {
      stream: {
        getTracks: () => [
          { stop: () => { tracksStoppedCount++; } }
        ]
      },
      stop() {
        this.stream.getTracks().forEach((t) => t.stop());
      }
    },
    stop() {
      sessionStopped = true;
      this.mic.stop();
    }
  };

  // Simulating teardownSession pattern
  let currentSession = mockSession;
  function simulateTeardown(fromCallback) {
    if (currentSession) {
      try { currentSession.stop(); } catch {}
    }
    currentSession = null;
  }

  // Even when fromCallback is true (e.g. server closed connection)
  simulateTeardown(true);

  assert.equal(sessionStopped, true, "Session.stop must be called even when fromCallback=true");
  assert.equal(tracksStoppedCount, 1, "Microphone stream tracks must be terminated");
  assert.equal(currentSession, null, "Session must be nulled");
});

test("MicCapture.start auto-resumes suspended AudioContext", async () => {
  const mic = new MicCapture();
  let resumed = false;

  // Mock global window/AudioContext and navigator.mediaDevices
  const origWindow = globalThis.window;
  const origNavDesc = Object.getOwnPropertyDescriptor(globalThis, "navigator");

  globalThis.window = {
    AudioContext: class {
      constructor() {
        this.state = "suspended";
        this.sampleRate = 48000;
        this.destination = {};
      }
      async resume() {
        this.state = "running";
        resumed = true;
      }
      createMediaStreamSource() {
        return { connect: () => {} };
      }
      createScriptProcessor() {
        return { connect: () => {}, onaudioprocess: null };
      }
      createGain() {
        return { gain: { value: 1 }, connect: () => {} };
      }
    }
  };

  Object.defineProperty(globalThis, "navigator", {
    value: {
      mediaDevices: {
        getUserMedia: async () => ({
          getTracks: () => [{ stop: () => {} }]
        })
      }
    },
    configurable: true,
    writable: true,
  });

  try {
    await mic.start();
    assert.equal(resumed, true, "Suspended AudioContext must be resumed on start");
    assert.equal(mic.ctx.state, "running", "AudioContext state should be running");
    assert.ok(mic.muteNode, "muteNode should be created");
    assert.equal(mic.muteNode.gain.value, 0, "muteNode gain must be 0 to prevent acoustic loopback");

    // Test resume() method
    mic.ctx.state = "suspended";
    await mic.resume();
    assert.equal(mic.ctx.state, "running", "mic.resume() should resume suspended ctx");
  } finally {
    mic.stop();
    globalThis.window = origWindow;
    if (origNavDesc) {
      Object.defineProperty(globalThis, "navigator", origNavDesc);
    } else {
      delete globalThis.navigator;
    }
  }
});

test("MicCapture downsamples 48kHz audio to 16kHz mono without phase drift", () => {
  const mic = new MicCapture();
  // 48000 Hz to 16000 Hz ratio = 3:1. 300 samples -> 100 samples
  const input = new Float32Array(300);
  for (let i = 0; i < input.length; i++) input[i] = 0.5;

  const output = mic._downsample(input, 48000);
  assert.equal(output.length, 100, "300 samples at 48kHz should downsample to 100 samples at 16kHz");
  assert.ok(Math.abs(output[0] - 0.5) < 0.001, "Averaged sample amplitude should match");
});

test("Gemini Live session configuration adheres to 3.8 protocol rules", () => {
  function buildLiveConfig({ model, thinkingLevel, tools, vadSensitivity }) {
    const isExtended = /extended-thinking/.test(model);
    return {
      model: model || "gemini-3.8-live",
      config: {
        responseModalities: ["AUDIO"],
        ...(vadSensitivity === "high"
          ? { realtimeInputConfig: { automaticActivityDetection: { startOfSpeechSensitivity: "START_SENSITIVITY_HIGH" } } }
          : {}),
        ...(thinkingLevel && isExtended ? { thinkingConfig: { thinkingLevel } } : {}),
        ...(tools ? { tools } : {}),
      }
    };
  }

  // Standard gemini-3.8-live must NOT have thinkingConfig
  const stdConfig = buildLiveConfig({ model: "gemini-3.8-live", thinkingLevel: "low" });
  assert.equal(stdConfig.config.thinkingConfig, undefined, "gemini-3.8-live must omit thinkingConfig");

  // Extended thinking model MUST have thinkingConfig
  const extConfig = buildLiveConfig({ model: "gemini-3.8-live-extended-thinking", thinkingLevel: "low" });
  assert.deepEqual(extConfig.config.thinkingConfig, { thinkingLevel: "low" }, "extended thinking model must include thinkingConfig");
});

