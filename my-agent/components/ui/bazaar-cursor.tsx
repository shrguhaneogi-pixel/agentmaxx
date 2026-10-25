"use client";

import { useEffect, useRef } from "react";

/**
 * BazaarCursor - Interactive Cursor inspired by ReactBits.dev
 *
 * Implements a high-performance, accessible pointer treatment styled with
 * Marzban's metallic brass and crimson aesthetic.
 *
 * Performance & Accessibility Guarantees:
 * 1. Zero React re-renders on pointer movements (uses direct DOM transforms via ref).
 * 2. Driven by requestAnimationFrame with translate3d compositor layers.
 * 3. pointer-events: none ensures zero interference with clicks, selections, and forms.
 * 4. Strictly disabled on touch devices (@media (pointer: coarse)) and prefers-reduced-motion.
 * 5. Enhances rather than hides native pointer for standard accessibility.
 */
export function BazaarCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Accessibility & Device Compatibility Checks
    if (typeof window === "undefined") return;

    const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!hasFinePointer || prefersReducedMotion) {
      return;
    }

    const cursor = cursorRef.current;
    const ring = ringRef.current;
    if (!cursor || !ring) return;

    cursor.style.display = "block";
    ring.style.display = "block";

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let isHovering = false;
    let isClicking = false;
    let rafId: number;

    const handlePointerMove = (e: PointerEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      // Detect interactive elements under pointer
      const target = e.target as HTMLElement | null;
      if (target) {
        const interactive = Boolean(
          target.closest(
            'button, a, input, textarea, select, [role="button"], [data-cursor-interactive="true"], .bazaar-border'
          )
        );
        if (interactive !== isHovering) {
          isHovering = interactive;
          if (isHovering) {
            ring.classList.add("cursor-interactive");
          } else {
            ring.classList.remove("cursor-interactive");
          }
        }
      }
    };

    const handlePointerDown = () => {
      isClicking = true;
      ring.classList.add("cursor-clicking");
    };

    const handlePointerUp = () => {
      isClicking = false;
      ring.classList.remove("cursor-clicking");
    };

    const handleMouseLeave = () => {
      cursor.style.opacity = "0";
      ring.style.opacity = "0";
    };

    const handleMouseEnter = () => {
      cursor.style.opacity = "1";
      ring.style.opacity = "1";
    };

    // Smooth animation loop using lerp for the outer ring, instant for the inner dot
    const animate = () => {
      const ease = 0.18;
      ringX += (mouseX - ringX) * ease;
      ringY += (mouseY - ringY) * ease;

      cursor.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;

      rafId = requestAnimationFrame(animate);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      {/* Precision Center Brass Reticle Dot */}
      <div
        ref={cursorRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[9999] hidden -translate-x-1/2 -translate-y-1/2 will-change-transform transition-opacity duration-200"
      >
        <div className="size-1.5 rounded-full bg-brass shadow-[0_0_8px_rgba(197,160,89,0.8)]" />
      </div>

      {/* Trailing Interactive Brass Ring with Reticle Corners */}
      <div
        ref={ringRef}
        aria-hidden="true"
        className="bazaar-cursor-ring pointer-events-none fixed top-0 left-0 z-[9998] hidden -translate-x-1/2 -translate-y-1/2 will-change-transform transition-all duration-150 ease-out"
      >
        <div className="relative flex size-8 items-center justify-center rounded-full border border-brass/50 bg-brass/5 shadow-[0_0_12px_rgba(197,160,89,0.2)]">
          {/* Subtle Astrolabe Crosshairs */}
          <span className="absolute h-2 w-px bg-brass/40 -top-1" />
          <span className="absolute h-2 w-px bg-brass/40 -bottom-1" />
          <span className="absolute w-2 h-px bg-brass/40 -left-1" />
          <span className="absolute w-2 h-px bg-brass/40 -right-1" />
        </div>
      </div>

      <style jsx global>{`
        .bazaar-cursor-ring.cursor-interactive > div {
          width: 2.75rem !important;
          height: 2.75rem !important;
          border-color: #C5A059 !important;
          background-color: rgba(122, 16, 34, 0.15) !important;
          box-shadow: 0 0 20px rgba(197, 160, 89, 0.4), inset 0 0 10px rgba(197, 160, 89, 0.2) !important;
        }
        .bazaar-cursor-ring.cursor-clicking > div {
          transform: scale(0.85);
          border-color: #DFC27D !important;
          background-color: rgba(197, 160, 89, 0.25) !important;
        }
      `}</style>
    </>
  );
}
