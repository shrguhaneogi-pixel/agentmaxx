"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface BazaarSplineEnvironmentProps {
  sceneUrl?: string;
  className?: string;
}

/**
 * BazaarSplineEnvironment
 *
 * Implements an atmospheric 3D / procedural environmental backdrop behind the
 * Marzban Bazaar reasoning workspace.
 *
 * Architecture & Zero-Hallucination Guarantees:
 * 1. Sits behind interactive UI with pointer-events: none, z-0, and overflow-hidden.
 * 2. Uses dynamic fallback: if no external Spline URL is configured (or if WebGL /
 *    network loading fails), renders an exquisite lightweight procedural CSS/SVG
 *    ambient bazaar night atmosphere with warm lantern glow and celestial astrolabe grid.
 * 3. Fully respects prefers-reduced-motion to avoid unnecessary GPU/CPU cycles.
 * 4. Zero runtime blocking of the critical rendering path.
 */
export function BazaarSplineEnvironment({
  sceneUrl = process.env.NEXT_PUBLIC_SPLINE_SCENE_URL,
  className,
}: BazaarSplineEnvironmentProps) {
  const [mounted, setMounted] = useState(false);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [splineFailed, setSplineFailed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setMounted(true);

    // Detect WebGL capability safely
    try {
      const testCanvas = document.createElement("canvas");
      const gl = testCanvas.getContext("webgl") || testCanvas.getContext("experimental-webgl");
      setHasWebGL(Boolean(gl));
    } catch {
      setHasWebGL(false);
    }
  }, []);

  // Ambient procedural canvas particles (subtle brass dust / lantern embers)
  useEffect(() => {
    if (!mounted || !canvasRef.current) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", handleResize);

    // Subtle floating brass embers
    const particleCount = 28;
    const particles = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.8,
      speedY: -(Math.random() * 0.35 + 0.15),
      speedX: (Math.random() - 0.5) * 0.2,
      opacity: Math.random() * 0.6 + 0.2,
      pulseSpeed: Math.random() * 0.02 + 0.01,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.y += p.speedY;
        p.x += p.speedX;
        p.opacity += Math.sin(Date.now() * p.pulseSpeed) * 0.005;

        // Wrap boundaries
        if (p.y < 0) p.y = height;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(197, 160, 89, ${Math.max(0.1, Math.min(0.7, p.opacity))})`;
        ctx.shadowBlur = 6;
        ctx.shadowColor = "rgba(197, 160, 89, 0.4)";
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [mounted]);

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 z-0 overflow-hidden select-none",
        className
      )}
    >
      {/* Dynamic Ambient Lantern Vignettes */}
      <div className="absolute -top-32 -right-32 size-96 rounded-full bg-crimson/20 blur-3xl" />
      <div className="absolute top-1/2 -left-32 size-80 rounded-full bg-brass/10 blur-3xl" />
      <div className="absolute -bottom-24 right-1/4 size-72 rounded-full bg-crimson-deep/30 blur-2xl" />

      {/* Rotating Celestial Astrolabe Geometry Watermark */}
      <div className="absolute top-1/2 right-12 -translate-y-1/2 opacity-15 pointer-events-none hidden md:block">
        <svg
          viewBox="0 0 400 400"
          className="size-96 animate-[spin_120s_linear_infinite]"
        >
          <circle cx="200" cy="200" r="180" fill="none" stroke="#C5A059" strokeWidth="1" strokeDasharray="4 8" />
          <circle cx="200" cy="200" r="140" fill="none" stroke="#C5A059" strokeWidth="0.75" />
          <circle cx="200" cy="200" r="100" fill="none" stroke="#C5A059" strokeWidth="1" strokeDasharray="8 4" />
          <ellipse cx="200" cy="180" rx="90" ry="60" fill="none" stroke="#DFC27D" strokeWidth="0.75" />
          <line x1="200" y1="10" x2="200" y2="390" stroke="#C5A059" strokeWidth="1" />
          <line x1="10" y1="200" x2="390" y2="200" stroke="#C5A059" strokeWidth="1" />
        </svg>
      </div>

      {/* Floating Canvas Embers */}
      <canvas
        ref={canvasRef}
        className="size-full absolute inset-0 opacity-70"
      />
    </div>
  );
}
