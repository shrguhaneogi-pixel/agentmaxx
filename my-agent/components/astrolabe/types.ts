/**
 * BAZAAR CYBERNETIC ASTROLABE & HAUNTED LAMP TYPES
 *
 * Strongly-typed props, color tokens, and state mapping for Marzban's
 * procedural 3D astrolabe visualization.
 */

export type AstrolabeMood = "cheerful" | "neutral" | "grumpy";

export interface AstrolabeProps {
  mood?: AstrolabeMood;
  isNegotiating?: boolean;
  isProcessingCheckout?: boolean;
  round?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
}

export const ASTROLABE_COLORS = {
  brass: "#C5A059",
  luminousBrass: "#E1B964",
  deepCrimson: "#7A1022",
  crimsonEmissive: "#96141E",
  agedParchment: "#F4F1EA",
  void: "#050304",
} as const;

export const MOOD_CONFIG: Record<
  AstrolabeMood,
  {
    targetColor: string;
    speedMultiplier: number;
    lightIntensity: number;
    emissiveIntensity: number;
  }
> = {
  cheerful: {
    targetColor: ASTROLABE_COLORS.luminousBrass,
    speedMultiplier: 1.5,
    lightIntensity: 2.2,
    emissiveIntensity: 0.65,
  },
  neutral: {
    targetColor: ASTROLABE_COLORS.brass,
    speedMultiplier: 1.0,
    lightIntensity: 1.5,
    emissiveIntensity: 0.45,
  },
  grumpy: {
    targetColor: ASTROLABE_COLORS.crimsonEmissive,
    speedMultiplier: 0.5,
    lightIntensity: 1.1,
    emissiveIntensity: 0.8,
  },
};
