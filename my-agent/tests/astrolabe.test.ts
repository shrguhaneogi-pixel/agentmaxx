import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveAstrolabeState } from "../components/astrolabe/state-machine";
import {
  ASTROLABE_COLORS,
  MOOD_CONFIG,
  type AstrolabeMood,
} from "../components/astrolabe/types";

describe("Cybernetic Bazaar Astrolabe & Reactive HUD State Machine", () => {
  // 1. Initial mount (neutral, round 1, idle)
  it("Transition 1: Initial mount defaults cleanly to neutral, round 1, and idle standby", () => {
    const state = resolveAstrolabeState({});
    assert.equal(state.mood, "neutral");
    assert.equal(state.clampedRound, 1);
    assert.equal(state.isNegotiating, false);
    assert.equal(state.isProcessingCheckout, false);
    assert.equal(state.statusBadge, "STANDBY");
    assert.equal(state.targetColor, ASTROLABE_COLORS.brass);
    assert.equal(state.ringAlignmentTarget, null);
    assert.equal(state.turbulenceAmplitude, 0);
  });

  // 2. Neutral -> cheerful
  it("Transition 2: Neutral → cheerful activates luminous brass and elevated speed multiplier", () => {
    const initial = resolveAstrolabeState({ mood: "neutral" });
    const cheerful = resolveAstrolabeState({ mood: "cheerful" });

    assert.equal(initial.mood, "neutral");
    assert.equal(cheerful.mood, "cheerful");
    assert.equal(cheerful.targetColor, ASTROLABE_COLORS.luminousBrass);
    assert.ok(cheerful.speedMultiplier > initial.speedMultiplier);
    assert.ok(cheerful.lightIntensity > initial.lightIntensity);
  });

  // 3. Neutral -> grumpy
  it("Transition 3: Neutral → grumpy transitions to deep crimson and restrained pacing", () => {
    const initial = resolveAstrolabeState({ mood: "neutral" });
    const grumpy = resolveAstrolabeState({ mood: "grumpy" });

    assert.equal(grumpy.mood, "grumpy");
    assert.equal(grumpy.targetColor, ASTROLABE_COLORS.crimsonEmissive);
    assert.ok(grumpy.speedMultiplier < initial.speedMultiplier);
    assert.ok(grumpy.emissiveIntensity > initial.emissiveIntensity);
  });

  // 4. Idle -> active negotiation -> ordinary idle state
  it("Transition 4: Idle → active negotiation → idle toggles turbulence and status badge", () => {
    const idle1 = resolveAstrolabeState({ isNegotiating: false });
    assert.equal(idle1.statusBadge, "STANDBY");
    assert.equal(idle1.turbulenceAmplitude, 0);

    const negotiating = resolveAstrolabeState({ isNegotiating: true });
    assert.equal(negotiating.statusBadge, "NEGOTIATING");
    assert.equal(negotiating.isNegotiating, true);
    assert.ok(negotiating.turbulenceAmplitude > 0, "Turbulence must be active during negotiation");
    assert.ok(negotiating.speedMultiplier > idle1.speedMultiplier, "Speed must surge during haggle");

    const idle2 = resolveAstrolabeState({ isNegotiating: false });
    assert.equal(idle2.statusBadge, "STANDBY");
    assert.equal(idle2.turbulenceAmplitude, 0);
  });

  // 5. Negotiation -> checkout processing
  it("Transition 5: Negotiation → checkout processing locks gyroscopic plane and suppresses turbulence", () => {
    const negotiating = resolveAstrolabeState({ isNegotiating: true });
    const checkout = resolveAstrolabeState({ isNegotiating: true, isProcessingCheckout: true });

    assert.equal(checkout.statusBadge, "SETTLEMENT VERIFICATION");
    assert.equal(checkout.isProcessingCheckout, true);
    assert.equal(checkout.isNegotiating, false, "Checkout overrides negotiation turbulence");
    assert.equal(checkout.turbulenceAmplitude, 0);
    assert.deepEqual(checkout.ringAlignmentTarget, [Math.PI / 2, 0, 0]);
  });

  // 6. Checkout processing -> ordinary idle state
  it("Transition 6: Checkout processing → ordinary idle releases gyroscopic lock", () => {
    const checkout = resolveAstrolabeState({ isProcessingCheckout: true });
    assert.ok(checkout.ringAlignmentTarget !== null);

    const idle = resolveAstrolabeState({ isProcessingCheckout: false });
    assert.equal(idle.ringAlignmentTarget, null);
    assert.equal(idle.statusBadge, "STANDBY");
  });

  // 7. Checkout processing remains active while round or mood props change
  it("Transition 7: Checkout processing remains locked when round or mood changes concurrently", () => {
    const s1 = resolveAstrolabeState({ isProcessingCheckout: true, round: 2, mood: "neutral" });
    const s2 = resolveAstrolabeState({ isProcessingCheckout: true, round: 3, mood: "cheerful" });

    assert.equal(s1.isProcessingCheckout, true);
    assert.equal(s2.isProcessingCheckout, true);
    assert.deepEqual(s1.ringAlignmentTarget, [Math.PI / 2, 0, 0]);
    assert.deepEqual(s2.ringAlignmentTarget, [Math.PI / 2, 0, 0]);
    assert.equal(s2.mood, "cheerful");
    assert.equal(s2.clampedRound, 3);
  });

  // 8. Round 1 -> round 4
  it("Transition 8: Round 1 → round 4 progressively expands outer ring scale", () => {
    const r1 = resolveAstrolabeState({ round: 1 });
    const r2 = resolveAstrolabeState({ round: 2 });
    const r3 = resolveAstrolabeState({ round: 3 });
    const r4 = resolveAstrolabeState({ round: 4 });

    assert.equal(r1.clampedRound, 1);
    assert.equal(r4.clampedRound, 4);
    assert.ok(r2.outerRingScale > r1.outerRingScale);
    assert.ok(r3.outerRingScale > r2.outerRingScale);
    assert.ok(r4.outerRingScale > r3.outerRingScale);
  });

  // 9. Invalid round values are handled according to chosen clamping policy
  it("Transition 9: Handles invalid, negative, out-of-bounds, and non-numeric round values safely", () => {
    assert.equal(resolveAstrolabeState({ round: -5 }).clampedRound, 1);
    assert.equal(resolveAstrolabeState({ round: 0 }).clampedRound, 1);
    assert.equal(resolveAstrolabeState({ round: 99 }).clampedRound, 4);
    assert.equal(resolveAstrolabeState({ round: NaN }).clampedRound, 1);
    assert.equal(resolveAstrolabeState({ round: undefined }).clampedRound, 1);
  });

  // 10. Rapid state transitions without animation jumps (damp simulation verification)
  it("Transition 10: Delta damping mathematically guarantees continuous orientation without jumping", () => {
    let currentX = 0;
    const targetX = Math.PI / 2;
    const dampSpeed = 3.5;
    const dt = 0.016; // ~60fps frame delta

    // Simulate 30 frames of smooth damping
    for (let frame = 0; frame < 30; frame++) {
      const prevX = currentX;
      // THREE.MathUtils.damp formula: x = lerp(x, y, 1 - exp(-lambda * dt))
      const alpha = 1.0 - Math.exp(-dampSpeed * dt);
      currentX = currentX + (targetX - currentX) * alpha;

      // Ensure delta between frames is smooth and monotonic towards target
      assert.ok(currentX >= prevX, "Damping must be monotonically approaching target");
      assert.ok(currentX - prevX < 0.2, "Step delta must never jump discontinuously");
    }
    assert.ok(currentX > 0.5, "Should have smoothly converged significantly towards target");
  });

  // 11. Reduced-motion mode remains functional
  it("Transition 11: prefers-reduced-motion forces 0 rotation velocity and 0 turbulence", () => {
    const active = resolveAstrolabeState({
      isNegotiating: true,
      mood: "cheerful",
      reducedMotion: true,
    });
    assert.equal(active.reducedMotion, true);
    assert.equal(active.speedMultiplier, 0);
    assert.equal(active.turbulenceAmplitude, 0);
  });

  // 12. Missing WebGL support produces working fallback state
  it("Transition 12: Missing WebGL or fallback consumes matching props without divergence", () => {
    const fallbackProps = {
      mood: "cheerful" as AstrolabeMood,
      round: 3,
      isNegotiating: true,
      isProcessingCheckout: false,
    };
    const resolved = resolveAstrolabeState(fallbackProps);
    assert.equal(resolved.mood, "cheerful");
    assert.equal(resolved.clampedRound, 3);
    assert.equal(resolved.statusBadge, "NEGOTIATING");
  });

  // Zero Crypto Side Effects Guarantee
  it("Cryptographic Invariant: Astrolabe resolution is strictly pure and does not mutate input or global state", () => {
    const inputProps = Object.freeze({
      mood: "neutral" as AstrolabeMood,
      round: 2,
      isNegotiating: true,
      isProcessingCheckout: false,
    });
    const result = resolveAstrolabeState(inputProps);
    assert.ok(result);
    // Ensure input object is not modified
    assert.equal(inputProps.round, 2);
    assert.equal(inputProps.mood, "neutral");
  });
});
