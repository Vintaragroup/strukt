// @ts-nocheck
import React from 'react';
import { useStore } from '@xyflow/react';

/**
 * ViewportLogger: Shows current viewport x/y and zoom from React Flow's store.
 * Renders a small fixed panel in the lower-left (above other overlays).
 */
export function ViewportLogger() {
  const transform = useStore((s: any) => s.transform); // [x, y, zoom]
  const [x, y, zoom] = Array.isArray(transform) ? transform : [0, 0, 1];

  const fmt = (n: number) => (Math.abs(n) >= 1 ? n.toFixed(1) : n.toFixed(3));

  return (
    <div
      className="fixed left-4 bottom-28 z-50 rounded-md bg-black/60 text-white/90 px-3 py-2 shadow border border-white/10"
      style={{ pointerEvents: 'none' }}
    >
      <div className="text-[11px] font-semibold">Viewport</div>
      <div className="text-[11px] opacity-90 font-mono">
        x: {fmt(x)} • y: {fmt(y)} • zoom: {zoom.toFixed(2)}
      </div>
    </div>
  );
}

export default ViewportLogger;
