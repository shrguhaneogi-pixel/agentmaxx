"use client";

import { useEffect, useState, Component, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { AstrolabeProps } from "./types";
import { AstrolabeFallback } from "./astrolabe-fallback";
import { AstrolabeHUD } from "./astrolabe-hud";
import { cn } from "@/lib/utils";

// Error Boundary for WebGL runtime or context crash resilience
class WebGLErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: ReactNode; children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("BazaarAstrolabe3D: WebGL render failure, falling back to accessible SVG.", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Dynamically import R3F Canvas with ssr: false to prevent SSR hydration errors
const DynamicAstrolabeCanvas = dynamic(
  () => import("./astrolabe-canvas").then((mod) => mod.AstrolabeCanvas),
  {
    ssr: false,
    loading: () => null,
  }
);

/**
 * BazaarAstrolabe3D
 *
 * Cybernetic Bazaar Astrolabe & Haunted Lamp with reactive 2.5D HUD.
 * Transitions smoothly between agent moods, negotiation energy, and crypto-settlement
 * alignment sequences.
 */
export function BazaarAstrolabe3D({
  mood = "neutral",
  isNegotiating = false,
  isProcessingCheckout = false,
  round = 1,
  className,
  size = "md",
}: AstrolabeProps) {
  const [mounted, setMounted] = useState(false);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Detect WebGL support safely
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl");
      setHasWebGL(Boolean(gl));
    } catch {
      setHasWebGL(false);
    }

    // Detect prefers-reduced-motion
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReducedMotion(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => {
        setReducedMotion(e.matches);
      };
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, []);

  const sizeClasses = {
    sm: "h-[260px] min-h-[240px]",
    md: "h-[360px] min-h-[320px]",
    lg: "h-[460px] min-h-[400px]",
  }[size];

  const fallback = (
    <AstrolabeFallback
      mood={mood}
      isNegotiating={isNegotiating}
      isProcessingCheckout={isProcessingCheckout}
      round={round}
      className={className}
    />
  );

  return (
    <div
      data-astrolabe-hud="true"
      className={cn(
        "relative w-full overflow-hidden border border-brass/40 bg-void/90 shadow-2xl transition-all duration-500",
        sizeClasses,
        className
      )}
    >
      {/* 2.5D Semantic HUD Overlay */}
      <AstrolabeHUD
        mood={mood}
        round={round}
        isNegotiating={isNegotiating}
        isProcessingCheckout={isProcessingCheckout}
      />

      {/* 3D WebGL Canvas with Graceful Fallback */}
      {!mounted || !hasWebGL ? (
        fallback
      ) : (
        <WebGLErrorBoundary fallback={fallback}>
          <DynamicAstrolabeCanvas
            mood={mood}
            isNegotiating={isNegotiating}
            isProcessingCheckout={isProcessingCheckout}
            round={round}
            reducedMotion={reducedMotion}
          />
        </WebGLErrorBoundary>
      )}
    </div>
  );
}
