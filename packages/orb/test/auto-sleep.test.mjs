import test from "node:test";
import assert from "node:assert/strict";

class AutoSleepManager {
  constructor(opts = {}) {
    this.timeoutSec = opts.timeoutSec ?? 35;
    this.getState = opts.getState || (() => "listening");
    this.isBypassed = opts.isBypassed || (() => false);
    this.onSleep = opts.onSleep || (() => {});
    this.lastActivity = Date.now();
    this.running = false;
  }

  touch() {
    this.lastActivity = Date.now();
  }

  check(now = Date.now()) {
    if (!this.running) return false;
    if (this.timeoutSec <= 0) return false;
    if (this.getState() !== "listening") return false;
    if (this.isBypassed()) return false;

    const elapsedMs = now - this.lastActivity;
    if (elapsedMs >= this.timeoutSec * 1000) {
      this.running = false;
      this.onSleep();
      return true;
    }
    return false;
  }

  start() {
    this.running = true;
    this.touch();
  }

  stop() {
    this.running = false;
  }
}

test("AutoSleepManager triggers onSleep after timeout seconds of silence", () => {
  let slept = false;
  const manager = new AutoSleepManager({
    timeoutSec: 30,
    getState: () => "listening",
    onSleep: () => { slept = true; },
  });

  manager.start();
  const startTime = Date.now();

  // 15 seconds elapsed — should not sleep
  assert.equal(manager.check(startTime + 15000), false);
  assert.equal(slept, false);

  // 30 seconds elapsed — should sleep
  assert.equal(manager.check(startTime + 30000), true);
  assert.equal(slept, true);
});

test("touch() resets activity and extends session", () => {
  let slept = false;
  const manager = new AutoSleepManager({
    timeoutSec: 30,
    getState: () => "listening",
    onSleep: () => { slept = true; },
  });

  manager.start();
  const startTime = Date.now();

  // User speaks at second 25
  manager.touch();
  const spokeAt = startTime + 25000;
  manager.lastActivity = spokeAt;

  // At second 35 from start (only 10s from speech) — should NOT sleep
  assert.equal(manager.check(spokeAt + 10000), false);
  assert.equal(slept, false);

  // At 30s after speaking — should sleep
  assert.equal(manager.check(spokeAt + 30000), true);
  assert.equal(slept, true);
});

test("AutoSleepManager does not sleep while assistant is speaking or state is idle", () => {
  let currentState = "speaking";
  let slept = false;

  const manager = new AutoSleepManager({
    timeoutSec: 30,
    getState: () => currentState,
    onSleep: () => { slept = true; },
  });

  manager.start();
  const startTime = Date.now();

  // 40 seconds pass while assistant is speaking
  assert.equal(manager.check(startTime + 40000), false);
  assert.equal(slept, false);

  // Switch to idle
  currentState = "idle";
  assert.equal(manager.check(startTime + 50000), false);
  assert.equal(slept, false);
});

test("AutoSleepManager is disabled when timeoutSec is 0", () => {
  let slept = false;
  const manager = new AutoSleepManager({
    timeoutSec: 0, // disabled
    getState: () => "listening",
    onSleep: () => { slept = true; },
  });

  manager.start();
  assert.equal(manager.check(Date.now() + 100000), false);
  assert.equal(slept, false);
});
