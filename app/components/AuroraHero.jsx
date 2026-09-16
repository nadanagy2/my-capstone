'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const AURORA_FRAGMENT_SHADER = `
  // Read the values supplied by React Three Fiber.
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec2 u_mouse;

  // Receive normalized coordinates from the vertex shader.
  varying vec2 v_uv;

  // Main fragment-shader function; it calculates one pixel's color.
  void main() {
    // Convert UV coordinates to a centered, aspect-corrected coordinate system.
    vec2 uv = v_uv;
    float aspect = u_resolution.x / max(u_resolution.y, 1.0);
    vec2 centered = (uv - 0.5) * vec2(aspect, 1.0);

    // Bend the pattern gently toward the cursor with distance-based falloff.
    vec2 mouse = (u_mouse - 0.5) * vec2(aspect, 1.0);
    float mouseDistance = distance(centered, mouse);
    float mouseInfluence = exp(-mouseDistance * 2.5);
    centered += normalize(mouse - centered + vec2(0.0001)) *
      mouseInfluence * 0.18;

    // Create a slowly moving horizontal coordinate for the wave bands.
    float time = u_time * 0.18;
    float wavePosition = centered.y;

    // Build several overlapping sine waves with different frequencies.
    float waveOne = sin(centered.x * 3.0 + time + wavePosition * 5.0);
    float waveTwo = sin(centered.x * 5.0 - time * 1.3 + wavePosition * 8.0);
    float waveThree = sin(centered.x * 8.0 + time * 0.7 - wavePosition * 11.0);
    float waveFour = sin(centered.x * 12.0 - time * 0.5 + wavePosition * 15.0);

    // Combine the waves into soft color-band intensity values.
    float blueBand = smoothstep(-0.8, 0.9, waveOne * 0.5 + 0.5);
    float purpleBand = smoothstep(-0.7, 0.8, waveTwo * 0.5 + 0.5);
    float lightBand = smoothstep(-0.6, 0.9, waveThree * 0.5 + 0.5);
    float deepBand = smoothstep(-0.5, 0.8, waveFour * 0.5 + 0.5);

    // Define the blue and purple colors used by the aurora.
    vec3 deepBlue = vec3(0.114, 0.306, 0.847);
    vec3 blue = vec3(0.145, 0.388, 0.922);
    vec3 lightBlue = vec3(0.376, 0.647, 0.984);
    vec3 purple = vec3(0.545, 0.361, 0.965);

    // Layer the colors together according to the wave intensities.
    vec3 color = deepBlue;
    color = mix(color, blue, blueBand * 0.8);
    color = mix(color, purple, purpleBand * 0.55);
    color = mix(color, lightBlue, lightBand * 0.35);
    color = mix(color, purple, deepBand * 0.25);

    // Add a subtle vignette so the center remains the visual focus.
    float vignette = 1.0 - smoothstep(0.35, 0.85, length(centered));
    color *= 0.82 + vignette * 0.18;

    // Output the final opaque pixel color.
    gl_FragColor = vec4(color, 1.0);
  }
`;

const AURORA_VERTEX_SHADER = `
  // Pass the plane's UV coordinates to the fragment shader.
  varying vec2 v_uv;

  // Position vertices directly in clip space (-1 to 1 on both axes), 
  // ignoring the camera's projection/view matrices entirely. This is the 
  // standard technique for a fullscreen shader quad: since our plane's 
  // vertices are already at -1/1, we skip the camera math and place them 
  // straight into clip space, guaranteeing the plane always fills the 
  // whole screen regardless of camera settings.
  void main() {
    v_uv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

function AuroraPlane({ mouse }) {
  const materialRef = useRef(null);
  const { gl, size } = useThree();

  const uniforms = useMemo(
    () => ({
      u_time: { value: 0 },
      u_resolution: { value: new THREE.Vector2() },
      u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
    }),
    [],
  );

  useFrame((state, delta) => {
    const material = materialRef.current;
    if (!material) return;

    material.uniforms.u_time.value += delta;
    material.uniforms.u_resolution.value.set(
      size.width * gl.getPixelRatio(),
      size.height * gl.getPixelRatio(),
    );

    material.uniforms.u_mouse.value.lerp(
      new THREE.Vector2(mouse.current.x, mouse.current.y),
      1 - Math.exp(-delta * 5),
    );
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={AURORA_VERTEX_SHADER}
        fragmentShader={AURORA_FRAGMENT_SHADER}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}

export default function AuroraHero() {
  const [reducedMotion, setReducedMotion] = useState(null);
  const [visible, setVisible] = useState(true);
  const mouse = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const updateMotionPreference = () => {
      setReducedMotion(motionQuery.matches);
    };

    const updateVisibility = () => {
      setVisible(!document.hidden);
    };

    updateMotionPreference();
    updateVisibility();

    motionQuery.addEventListener?.('change', updateMotionPreference);
    document.addEventListener('visibilitychange', updateVisibility);

    return () => {
      motionQuery.removeEventListener?.('change', updateMotionPreference);
      document.removeEventListener('visibilitychange', updateVisibility);
    };
  }, []);

  const handlePointerMove = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();

    mouse.current = {
      x: (event.clientX - bounds.left) / bounds.width,
      y: 1 - (event.clientY - bounds.top) / bounds.height,
    };
  };

  if (reducedMotion === null) {
    return <div aria-hidden="true" className="absolute inset-0 bg-blue-700" />;
  }

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      onPointerMove={handlePointerMove}
      aria-hidden="true"
    >
      {reducedMotion ? (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,#60a5fa,transparent_35%),linear-gradient(135deg,#1d4ed8,#2563eb_45%,#8b5cf6)]" />
      ) : (
        <Canvas
          orthographic
          camera={{ position: [0, 0, 1], zoom: 1 }}
          dpr={[1, 1.5]}
          frameloop={visible ? 'always' : 'never'}
          gl={{ antialias: true, alpha: false }}
        >
          <AuroraPlane mouse={mouse} />
        </Canvas>
      )}
    </div>
  );
}