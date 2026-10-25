"use client";

import { Canvas } from "@react-three/fiber";
import { AstrolabeScene } from "./astrolabe-scene";
import { AstrolabeProps } from "./types";

interface AstrolabeCanvasProps extends AstrolabeProps {
  reducedMotion?: boolean;
}

/**
 * AstrolabeCanvas
 *
 * Client-rendered React Three Fiber Canvas with responsive DPR bounds [1, 2],
 * alpha transparency, and antialiasing.
 */
export function AstrolabeCanvas({
  mood = "neutral",
  isNegotiating = false,
  isProcessingCheckout = false,
  round = 1,
  reducedMotion = false,
}: AstrolabeCanvasProps) {
  return (
    <div className="size-full absolute inset-0">
      <Canvas
        camera={{ position: [0, 0, 13.5], fov: 46 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        className="size-full pointer-events-none"
      >
        <AstrolabeScene
          mood={mood}
          isNegotiating={isNegotiating}
          isProcessingCheckout={isProcessingCheckout}
          round={round}
          reducedMotion={reducedMotion}
        />
      </Canvas>
    </div>
  );
}
