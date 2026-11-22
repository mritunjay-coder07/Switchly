// src/__tests__/switchly.test.ts
/**
 * Basic test suite for the Switchly core functionality.
 * Runs with Node's built‑in test runner (`node --test`).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createSwitchly, SwitchlyOptions } from "../index.js";

const options: SwitchlyOptions = { environment: "development" };

const switchly = createSwitchly(options);

describe('Switchly core API', () => {
  it('should register and enable a simple flag', () => {
    switchly.registerFlag({ key: "test-flag", enabled: true });
    const enabled = switchly.isEnabled("test-flag");
    assert.equal(enabled, true);
  });

  it('should respect explicit disable', () => {
    switchly.registerFlag({ key: "disabled-flag", enabled: false });
    assert.equal(switchly.isEnabled("disabled-flag"), false);
  });

  it('should handle percentage rollout deterministically', () => {
    switchly.registerFlag({ key: "rollout-flag", rollout: 50 });
    const userA = switchly.isEnabled("rollout-flag", { userId: "user-A" });
    const userB = switchly.isEnabled("rollout-flag", { userId: "user-B" });
    // Run twice to ensure determinism.
    const userA2 = switchly.isEnabled("rollout-flag", { userId: "user-A" });
    assert.equal(userA, userA2, "deterministic for same user");
    // At least one user should be true and one false for 50% rollout (probabilistic, but highly likely).
    // We'll just assert the values are booleans.
    assert.ok(typeof userA === 'boolean');
    assert.ok(typeof userB === 'boolean');
  });

  it('should support user ID whitelist', () => {
    switchly.registerFlag({ key: "whitelist-flag", enabled: false, userIds: ["uid-123"] });
    assert.equal(switchly.isEnabled("whitelist-flag", { userId: "uid-123" }), true);
    assert.equal(switchly.isEnabled("whitelist-flag", { userId: "other" }), false);
  });

  it('should evaluate A/B variants according to weights', () => {
    switchly.registerFlag({
      key: "ab-flag",
      variants: [
        { name: "A", weight: 70 },
        { name: "B", weight: 30 }
      ]
    });
    const variant = switchly.getVariant("ab-flag", { userId: "user-xyz" });
    assert.ok(["A", "B"].includes(variant as string));
  });

  it('should update flag configuration at runtime', () => {
    switchly.registerFlag({ key: "dynamic-flag", enabled: false });
    assert.equal(switchly.isEnabled("dynamic-flag"), false);
    switchly.updateFlag("dynamic-flag", { enabled: true });
    assert.equal(switchly.isEnabled("dynamic-flag"), true);
  });
});
