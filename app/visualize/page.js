'use client';

import dynamic from 'next/dynamic';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import { salesRecords } from '@/lib/sales-data';

const CATEGORY_COLORS = {
  Electronics: '#3b82f6',
  Apparel: '#8b5cf6',
  Home: '#22c55e',
};

function RevenueBar({
  record,
  index,
  maxRevenue,
  selectedCategory,
  onSelect,
}) {
  const [hovered, setHovered] = useState(false);
  const height = Math.max((record.revenue / maxRevenue) * 5, 0.15);
  const spacing = 1.35;
  const x = (index - (salesRecords.length - 1) / 2) * spacing;
  const isDimmed =
    selectedCategory && record.category !== selectedCategory;
  const color = CATEGORY_COLORS[record.category] || '#64748b';

  return (
    <group
      position={[x, height / 2, 0]}
      scale={hovered ? 1.06 : 1}
      onPointerEnter={(event) => {
        event.stopPropagation();
        setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(index, record.category);
      }}
    >
      <mesh castShadow>
        <boxGeometry args={[0.9, height, 1.1]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={isDimmed ? 0.2 : 0.95}
          roughness={0.65}
          metalness={0.05}
        />
      </mesh>

      {hovered && (
        <Html position={[0, height / 2 + 0.35, 0]} center>
          <div className="pointer-events-none whitespace-nowrap rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs text-slate-700 shadow-xl">
            <p className="font-semibold text-slate-900">{record.date}</p>
            <p>Revenue: ${record.revenue.toLocaleString()}</p>
            <p>Category: {record.category}</p>
          </div>
        </Html>
      )}
    </group>
  );
}

function RevenueScene({ records }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);

  const maxRevenue = Math.max(...records.map((record) => record.revenue), 1);

  function handleSelect(index, category) {
    if (selectedIndex === index) {
      setSelectedIndex(null);
      setSelectedCategory(null);
      return;
    }

    setSelectedIndex(index);
    setSelectedCategory(category);
  }

  return (
    <Canvas
      shadows
      camera={{ position: [0, 5.5, 10], fov: 45 }}
      className="h-full w-full"
    >
      <ambientLight intensity={0.7} />
      <directionalLight
        castShadow
        position={[4, 8, 5]}
        intensity={1.4}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
      />

      <group>
        {records.map((record, index) => (
          <RevenueBar
            key={`${record.date}-${record.category}`}
            record={record}
            index={index}
            maxRevenue={maxRevenue}
            selectedCategory={selectedCategory}
            onSelect={handleSelect}
          />
        ))}
      </group>

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.03, 0]}
        receiveShadow
      >
        <planeGeometry args={[records.length * 1.5 + 3, 4]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.9} />
      </mesh>

      <OrbitControls
        enableDamping
        minDistance={5}
        maxDistance={18}
        maxPolarAngle={Math.PI / 2.05}
      />
    </Canvas>
  );
}

const LazyRevenueScene = dynamic(
  () => Promise.resolve(RevenueScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-slate-500">
        Loading 3D visualization…
      </div>
    ),
  },
);

function StaticFallbackChart({ records }) {
  const maxRevenue = Math.max(...records.map((record) => record.revenue), 1);
  const maxBarHeight = 380;

  return (
    <div className="flex h-full items-end gap-2 overflow-x-auto px-4 pb-8 pt-6">
      {records.map((record) => {
        const height = Math.max((record.revenue / maxRevenue) * maxBarHeight, 8);
        const color = CATEGORY_COLORS[record.category] || '#64748b';

        return (
          <div
            key={`${record.date}-${record.category}`}
            className="flex min-w-14 flex-1 flex-col items-center justify-end gap-2"
            title={`${record.date} — $${record.revenue.toLocaleString()} — ${record.category}`}
          >
            <div
              className="w-full rounded-t-md opacity-90"
              style={{
                height: `${height}px`,
                backgroundColor: color,
              }}
            />
            <span className="text-[10px] text-slate-500">
              {record.date.slice(5)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function VisualizePage() {
  const records = useMemo(
    () => [...salesRecords].sort((a, b) => a.date.localeCompare(b.date)),
    [],
  );
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener?.('change', updatePreference);

    return () => {
      mediaQuery.removeEventListener?.('change', updatePreference);
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Revenue Skyline</h1>
          <p className="mt-2 text-sm text-slate-600">
            Hover a bar for details, click to filter by category
          </p>
        </header>

        <section
          aria-label="Revenue visualization"
          className="h-[560px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          {prefersReducedMotion === null ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">
              Loading visualization…
            </div>
          ) : prefersReducedMotion ? (
            <StaticFallbackChart records={records} />
          ) : (
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  Loading 3D visualization…
                </div>
              }
            >
              <LazyRevenueScene records={records} />
            </Suspense>
          )}
        </section>
      </div>
    </main>
  );
}