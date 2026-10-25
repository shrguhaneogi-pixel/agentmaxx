"use client";

import { useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AstrolabeProps, MOOD_CONFIG, ASTROLABE_COLORS } from "./types";

interface AstrolabeSceneProps extends AstrolabeProps {
  reducedMotion?: boolean;
}

/**
 * AstrolabeScene
 *
 * Procedurally generated 3D Cybernetic Bazaar Astrolabe & Haunted Lamp.
 *
 * Architectural & Performance Guarantees:
 * 1. Zero external 3D assets/models. 100% procedural Three.js geometry.
 * 2. Pre-allocated Float32Array particle buffers and static Three.js instances.
 * 3. Zero object instantiations (no new Color, Vector3, etc.) inside useFrame.
 * 4. Delta-time frame-rate independent interpolation (lerp & damp).
 * 5. Full compliance with prefers-reduced-motion.
 */
export function AstrolabeScene({
  mood = "neutral",
  isNegotiating = false,
  isProcessingCheckout = false,
  round = 1,
  reducedMotion = false,
}: AstrolabeSceneProps) {
  // Scene object refs
  const rootGroupRef = useRef<THREE.Group>(null);
  const lampLightRef = useRef<THREE.PointLight>(null);
  const particlePointsRef = useRef<THREE.Points>(null);
  const particleMaterialRef = useRef<THREE.PointsMaterial>(null);

  // Concentric ring refs
  const ring1Ref = useRef<THREE.Group>(null);
  const ring2Ref = useRef<THREE.Group>(null);
  const ring3Ref = useRef<THREE.Group>(null);
  const ring4Ref = useRef<THREE.Group>(null);

  // Shared ring material refs for smooth color transitions
  const ringMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const outerRingMaterialRef = useRef<THREE.MeshStandardMaterial>(null);

  // Pre-allocated persistent THREE.Color instances for frame-loop mutation
  const activeColor = useRef(new THREE.Color(ASTROLABE_COLORS.brass));
  const targetColor = useRef(new THREE.Color(ASTROLABE_COLORS.brass));

  const moodConfig = MOOD_CONFIG[mood] || MOOD_CONFIG.neutral;
  const clampedRound = Math.min(Math.max(round, 1), 4);

  // Update target color upon prop change (runs outside the animation loop)
  useEffect(() => {
    targetColor.current.set(moodConfig.targetColor);
  }, [moodConfig.targetColor]);

  // Generate 800 particles uniformly distributed across a spherical volume
  const particlePositions = useMemo(() => {
    const count = 800;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 1.35 * Math.cbrt(Math.random()); // Uniform distribution within sphere
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    return positions;
  }, []);

  // Frame-rate independent animation loop
  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;

    // Smooth delta-based color lerping for materials and lamp light
    const colorLambda = 5.0;
    const colorAlpha = 1.0 - Math.exp(-colorLambda * delta);
    activeColor.current.lerp(targetColor.current, colorAlpha);

    // Update point light intensity and color
    if (lampLightRef.current) {
      lampLightRef.current.color.copy(activeColor.current);
      const baseIntensity = moodConfig.lightIntensity;
      const pulseIntensity = isProcessingCheckout
        ? Math.sin(time * 6.0) * 0.8
        : isNegotiating
        ? Math.sin(time * 4.0) * 0.4
        : Math.sin(time * 2.0) * 0.15;
      lampLightRef.current.intensity = THREE.MathUtils.damp(
        lampLightRef.current.intensity,
        baseIntensity + pulseIntensity,
        4.0,
        delta
      );
    }

    // Update particle material color
    if (particleMaterialRef.current) {
      particleMaterialRef.current.color.copy(activeColor.current);
    }

    // Update ring materials emissive color
    if (ringMaterialRef.current) {
      ringMaterialRef.current.emissive.copy(activeColor.current);
      ringMaterialRef.current.emissiveIntensity = moodConfig.emissiveIntensity;
    }
    if (outerRingMaterialRef.current) {
      outerRingMaterialRef.current.emissive.copy(activeColor.current);
      // Outer ring emphasis scales progressively with negotiation round (1..4)
      outerRingMaterialRef.current.emissiveIntensity = 0.2 + clampedRound * 0.2;
    }

    // Respect reduced motion: lock rings to balanced, elegant resting orientation
    if (reducedMotion) {
      if (ring1Ref.current) ring1Ref.current.rotation.set(0.4, 0, 0);
      if (ring2Ref.current) ring2Ref.current.rotation.set(0, 0.6, 0);
      if (ring3Ref.current) ring3Ref.current.rotation.set(0.3, 0.4, 0);
      if (ring4Ref.current) ring4Ref.current.rotation.set(0, 0, 0.5);
      return;
    }

    // Base rotational speed modulated by mood and negotiation energy
    const baseSpeed = 0.35 * moodConfig.speedMultiplier;
    const activeSpeed = isNegotiating ? baseSpeed * 2.2 : baseSpeed;

    // Particle turbulence & rotation
    if (particlePointsRef.current) {
      particlePointsRef.current.rotation.y += delta * activeSpeed * 0.5;
      particlePointsRef.current.rotation.x += delta * activeSpeed * 0.25;

      if (isNegotiating) {
        // Controlled sinusoidal turbulence on particle swarm during bargaining
        particlePointsRef.current.position.y = Math.sin(time * 4.0) * 0.08;
      } else {
        particlePointsRef.current.position.y = THREE.MathUtils.damp(
          particlePointsRef.current.position.y,
          0,
          4.0,
          delta
        );
      }
    }

    // Rings State Machine: Checkout Mode vs Continuous Rotation
    if (isProcessingCheckout) {
      // CHECKOUT MODE: Gyroscopic alignment sequence
      // Rings smoothly damp toward synchronized planar alignment (Math.PI / 2 on X axis)
      const dampSpeed = 3.5;
      const targetX = Math.PI / 2;

      if (ring1Ref.current) {
        ring1Ref.current.rotation.x = THREE.MathUtils.damp(ring1Ref.current.rotation.x, targetX, dampSpeed, delta);
        ring1Ref.current.rotation.y = THREE.MathUtils.damp(ring1Ref.current.rotation.y, 0, dampSpeed, delta);
        ring1Ref.current.rotation.z = THREE.MathUtils.damp(ring1Ref.current.rotation.z, 0, dampSpeed, delta);
      }
      if (ring2Ref.current) {
        ring2Ref.current.rotation.x = THREE.MathUtils.damp(ring2Ref.current.rotation.x, targetX, dampSpeed, delta);
        ring2Ref.current.rotation.y = THREE.MathUtils.damp(ring2Ref.current.rotation.y, 0, dampSpeed, delta);
        ring2Ref.current.rotation.z = THREE.MathUtils.damp(ring2Ref.current.rotation.z, 0, dampSpeed, delta);
      }
      if (ring3Ref.current) {
        ring3Ref.current.rotation.x = THREE.MathUtils.damp(ring3Ref.current.rotation.x, targetX, dampSpeed, delta);
        ring3Ref.current.rotation.y = THREE.MathUtils.damp(ring3Ref.current.rotation.y, 0, dampSpeed, delta);
        ring3Ref.current.rotation.z = THREE.MathUtils.damp(ring3Ref.current.rotation.z, 0, dampSpeed, delta);
      }
      if (ring4Ref.current) {
        ring4Ref.current.rotation.x = THREE.MathUtils.damp(ring4Ref.current.rotation.x, targetX, dampSpeed, delta);
        ring4Ref.current.rotation.y = THREE.MathUtils.damp(ring4Ref.current.rotation.y, 0, dampSpeed, delta);
        ring4Ref.current.rotation.z = THREE.MathUtils.damp(ring4Ref.current.rotation.z, 0, dampSpeed, delta);
      }
    } else {
      // IDLE & NEGOTIATION MODE: Harmonious multi-axis mechanical rotation
      if (ring1Ref.current) {
        ring1Ref.current.rotation.x += delta * activeSpeed * 1.3;
        ring1Ref.current.rotation.y += delta * activeSpeed * 0.4;
      }
      if (ring2Ref.current) {
        ring2Ref.current.rotation.y += delta * activeSpeed * 0.9;
        ring2Ref.current.rotation.z += delta * activeSpeed * 0.3;
      }
      if (ring3Ref.current) {
        ring3Ref.current.rotation.z += delta * activeSpeed * 0.7;
        ring3Ref.current.rotation.x -= delta * activeSpeed * 0.5;
      }
      if (ring4Ref.current) {
        ring4Ref.current.rotation.y -= delta * activeSpeed * 0.45;
        // Outer ring scale slightly responds to round emphasis (1.0 to 1.15)
        const targetScale = 1.0 + (clampedRound - 1) * 0.05;
        ring4Ref.current.scale.setScalar(
          THREE.MathUtils.damp(ring4Ref.current.scale.x, targetScale, 3.0, delta)
        );
      }
    }
  });

  return (
    <group ref={rootGroupRef}>
      {/* Illumination: Ambient + Directional highlights + Central Point Light */}
      <ambientLight intensity={0.45} color="#1A0A0E" />
      <directionalLight position={[5, 8, 5]} intensity={1.2} color="#FFF8E7" />
      <directionalLight position={[-5, -4, -4]} intensity={0.6} color={ASTROLABE_COLORS.deepCrimson} />
      <pointLight ref={lampLightRef} position={[0, 0, 0]} intensity={1.5} distance={16} decay={2} />

      {/* Layer 1: Central Luminous Haunted Lamp (800 Procedural Particles) */}
      <group>
        <points ref={particlePointsRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[particlePositions, 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            ref={particleMaterialRef}
            size={0.055}
            transparent
            opacity={0.85}
            color={moodConfig.targetColor}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>

        {/* Inner Glowing Core Sphere */}
        <mesh>
          <sphereGeometry args={[0.35, 16, 16]} />
          <meshBasicMaterial color="#FFFDF7" transparent opacity={0.9} />
        </mesh>
      </group>

      {/* Layer 2: Concentric Brass Astrolabe Rings */}
      {/* Shared standard brass material */}
      <meshStandardMaterial
        ref={ringMaterialRef}
        color={ASTROLABE_COLORS.brass}
        metalness={0.88}
        roughness={0.22}
        emissive={moodConfig.targetColor}
        emissiveIntensity={moodConfig.emissiveIntensity}
      />
      <meshStandardMaterial
        ref={outerRingMaterialRef}
        color={ASTROLABE_COLORS.brass}
        metalness={0.92}
        roughness={0.18}
        emissive={moodConfig.targetColor}
        emissiveIntensity={0.5}
      />

      {/* Ring 1: Inner Stabilizing Ring (Radius 2.0, Tube 0.04) */}
      <group ref={ring1Ref} rotation={[Math.PI / 4, 0, 0]}>
        <mesh>
          <torusGeometry args={[2.0, 0.04, 16, 64]} />
          <primitive object={ringMaterialRef.current || new THREE.MeshStandardMaterial()} attach="material" />
        </mesh>
      </group>

      {/* Ring 2: Primary Instrument Ring (Radius 3.0, Tube 0.055) */}
      <group ref={ring2Ref} rotation={[0, Math.PI / 3, 0]}>
        <mesh>
          <torusGeometry args={[3.0, 0.055, 16, 64]} />
          <primitive object={ringMaterialRef.current || new THREE.MeshStandardMaterial()} attach="material" />
        </mesh>
      </group>

      {/* Ring 3: Tilted Secondary Ring / Rete (Radius 4.0, Tube 0.048) */}
      <group ref={ring3Ref} rotation={[Math.PI / 6, Math.PI / 4, 0]}>
        <mesh>
          <torusGeometry args={[4.0, 0.048, 16, 64]} />
          <primitive object={ringMaterialRef.current || new THREE.MeshStandardMaterial()} attach="material" />
        </mesh>
      </group>

      {/* Ring 4: Outer Navigation Ring (Radius 5.0, Tube 0.065, scales with round) */}
      <group ref={ring4Ref} rotation={[0, 0, Math.PI / 5]}>
        <mesh>
          <torusGeometry args={[5.0, 0.065, 16, 64]} />
          <primitive object={outerRingMaterialRef.current || new THREE.MeshStandardMaterial()} attach="material" />
        </mesh>
      </group>
    </group>
  );
}
