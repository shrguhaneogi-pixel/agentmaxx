/**
 * ASTROLABE STATE MACHINE & TRANSITION ADAPTER
 *
 * Implements pure state resolution, transition mechanics, and mathematical
 * invariants for Marzban's Cybernetic Astrolabe & Haunted Lamp.
 *
 * Guarantees:
 * - Deterministic output for any combination of props.
 * - Explicit precedence rules (ReducedMotion > Checkout > Negotiation > Mood > Round).
 * - Safe clamping on round values ([1, 4]).
 * - Zero side effects on agent business logic or cryptographic keys.
 */

import { AstrolabeProps, AstrolabeMood, MOOD_CONFIG, ASTROLABE_COLORS } from "./types";

export interface ResolvedAstrolabeState {
  mood: AstrolabeMood;
  targetColor: string;
  speedMultiplier: number;
  lightIntensity: number;
  emissiveIntensity: number;
  clampedRound: number;
  outerRingScale: number;
  isNegotiating: boolean;
  isProcessingCheckout: boolean;
  reducedMotion: boolean;
  turbulenceAmplitude: number;
  ringAlignmentTarget: [number, number, number] | null;
  statusBadge: "STANDBY" | "NEGOTIATING" | "SETTLEMENT VERIFICATION";
}

/**
 * Pure state resolver mapping incoming agent state to visual parameters
 */
export function resolveAstrolabeState(
  props: AstrolabeProps & { reducedMotion?: boolean }
): ResolvedAstrolabeState {
  const mood: AstrolabeMood =
    props.mood && ["cheerful", "neutral", "grumpy"].includes(props.mood)
      ? props.mood
      : "neutral";

  const config = MOOD_CONFIG[mood] || MOOD_CONFIG.neutral;

  // Safe clamping for round (1 to 4)
  const rawRound = typeof props.round === "number" && !isNaN(props.round) ? props.round : 1;
  const clampedRound = Math.min(Math.max(Math.floor(rawRound), 1), 4);

  const reducedMotion = Boolean(props.reducedMotion);
  const isProcessingCheckout = Boolean(props.isProcessingCheckout);
  const isNegotiating = !isProcessingCheckout && Boolean(props.isNegotiating);

  // Precedence Rule 1: Reduced Motion overrides rotational speeds & eliminates turbulence
  const speedMultiplier = reducedMotion
    ? 0
    : isProcessingCheckout
    ? 0.4
    : isNegotiating
    ? config.speedMultiplier * 2.2
    : config.speedMultiplier;

  const turbulenceAmplitude = reducedMotion
    ? 0
    : isProcessingCheckout
    ? 0
    : isNegotiating
    ? 0.08
    : 0;

  // Precedence Rule 2: Checkout mode forces planar gyroscopic lock
  const ringAlignmentTarget: [number, number, number] | null = isProcessingCheckout
    ? [Math.PI / 2, 0, 0]
    : null;

  // Precedence Rule 3: Round scales outer ring emphasis
  const outerRingScale = 1.0 + (clampedRound - 1) * 0.05;

  // Status badge semantics
  const statusBadge: ResolvedAstrolabeState["statusBadge"] = isProcessingCheckout
    ? "SETTLEMENT VERIFICATION"
    : isNegotiating
    ? "NEGOTIATING"
    : "STANDBY";

  return {
    mood,
    targetColor: config.targetColor,
    speedMultiplier,
    lightIntensity: config.lightIntensity,
    emissiveIntensity: config.emissiveIntensity,
    clampedRound,
    outerRingScale,
    isNegotiating,
    isProcessingCheckout,
    reducedMotion,
    turbulenceAmplitude,
    ringAlignmentTarget,
    statusBadge,
  };
}
