// @ts-nocheck
import { memo } from "react";
import { ConnectionLineComponentProps, getBezierPath, Position, useReactFlow } from "@xyflow/react";
import { getConnectStart, isShiftPressed, setHoveredTargetHandle, clearHoveredTargetHandle } from "../utils/connectionState";
import { evaluateConnectionPreview } from "../utils/relationships";

const OUTSET = 6; // outward nudge so the preview line starts/ends at the dot center

export const CustomConnectionLine = memo(({ 
  fromX,
  fromY,
  fromPosition,
  toX,
  toY,
  toPosition,
  connectionStatus,
}: ConnectionLineComponentProps) => {
  const instance = useReactFlow();
  const { getViewport, screenToFlowPosition } = instance;
  const zoom = getViewport()?.zoom ?? 1;
  const outset = OUTSET / (zoom || 1);
  let sX = fromX;
  let sY = fromY;

  // If we know the exact handle we started from, compute its true center via DOM
  const startInfo = getConnectStart();
  if (startInfo?.nodeId && startInfo?.handleId) {
    const selector = `[data-nodeid="${startInfo.nodeId}"][data-handleid="${startInfo.handleId}"]`;
    const el = document.querySelector(selector) as HTMLElement | null;
    if (el) {
      const rect = el.getBoundingClientRect();
      // center in screen coords
      const centerScreen = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      const centerFlow = screenToFlowPosition(centerScreen);
      sX = centerFlow.x;
      sY = centerFlow.y;
    }
  }
  let tX = toX ?? fromX;
  let tY = toY ?? fromY;

  // Do not offset the source in preview; start exactly at the handle coordinate to avoid any visual shift

  // Do not offset the target end in preview: keep it exactly under the cursor
  // This prevents the line from overshooting the pointer by several pixels
  // When the edge is finalized, CustomEdge applies the proper offset on target

  // Pick a reasonable target side for the curve shape if not provided
  let targetPos = toPosition;
  if (!targetPos) {
    const dx = (tX ?? 0) - (sX ?? 0);
    const dy = (tY ?? 0) - (sY ?? 0);
    if (Math.abs(dx) > Math.abs(dy)) {
      targetPos = dx >= 0 ? Position.Right : Position.Left;
    } else {
      targetPos = dy >= 0 ? Position.Bottom : Position.Top;
    }
  }

  // If the cursor is over a node, clamp the endpoint to that node's outer edge (in screen space)
  const vp = getViewport();
  const flowToScreen = (pt: { x: number; y: number }) => ({ x: pt.x * vp.zoom + vp.x, y: pt.y * vp.zoom + vp.y });
  const screenToFlow = (pt: { x: number; y: number }) => ({ x: (pt.x - vp.x) / vp.zoom, y: (pt.y - vp.y) / vp.zoom });

  const sScr = flowToScreen({ x: sX, y: sY });
  const tScr = flowToScreen({ x: tX, y: tY });

  const elUnder = document.elementFromPoint(tScr.x, tScr.y) as HTMLElement | null;
  const nodeEl = elUnder?.closest('.react-flow__node') as HTMLElement | null;
  if (nodeEl) {
    const r = nodeEl.getBoundingClientRect();
    // Line segment intersection helper with rectangle
    const candidates: { x: number; y: number; u: number }[] = [];
    const addIfOnSegment = (u: number, x: number, y: number) => {
      if (!isFinite(u)) return;
      // ensure intersection lies on rectangle side segment
      const onX = x >= r.left - 0.5 && x <= r.right + 0.5;
      const onY = y >= r.top - 0.5 && y <= r.bottom + 0.5;
      if (u >= 0 && u <= 1 && onX && onY) candidates.push({ x, y, u });
    };

    const dx = tScr.x - sScr.x;
    const dy = tScr.y - sScr.y;

    // Intersections with vertical sides x = r.left and x = r.right
    if (Math.abs(dx) > 1e-6) {
      let u = (r.left - sScr.x) / dx;
      addIfOnSegment(u, r.left, sScr.y + u * dy);
      u = (r.right - sScr.x) / dx;
      addIfOnSegment(u, r.right, sScr.y + u * dy);
    }
    // Intersections with horizontal sides y = r.top and y = r.bottom
    if (Math.abs(dy) > 1e-6) {
      let u = (r.top - sScr.y) / dy;
      addIfOnSegment(u, sScr.x + u * dx, r.top);
      u = (r.bottom - sScr.y) / dy;
      addIfOnSegment(u, sScr.x + u * dx, r.bottom);
    }

    if (candidates.length) {
      // pick the intersection closest to the cursor (u nearest to 1 but <= 1)
      candidates.sort((a, b) => Math.abs(1 - a.u) - Math.abs(1 - b.u));
      const hit = candidates[0];
      const clamped = screenToFlow({ x: hit.x, y: hit.y });
      tX = clamped.x;
      tY = clamped.y;
    }

    // Find nearest handle and snap if within radius
    const handles = Array.from(nodeEl.querySelectorAll('[data-handleid]')) as HTMLElement[];
    let nearest: { el: HTMLElement; dist: number; center: { x: number; y: number } } | null = null;
    for (const h of handles) {
      const hr = h.getBoundingClientRect();
      const cx = hr.left + hr.width / 2;
      const cy = hr.top + hr.height / 2;
      const d = Math.hypot(tScr.x - cx, tScr.y - cy);
      if (!nearest || d < nearest.dist) {
        nearest = { el: h, dist: d, center: { x: cx, y: cy } };
      }
    }
    const SNAP_RADIUS = 24; // px in screen space
    if (nearest && nearest.dist <= SNAP_RADIUS) {
      // Highlight and snap
      setHoveredTargetHandle(nearest.el);
      const centerFlow = screenToFlow(nearest.center);
      tX = centerFlow.x;
      tY = centerFlow.y;
    } else {
      // Clear highlight if outside radius
      clearHoveredTargetHandle();
    }
  }
  else {
    clearHoveredTargetHandle();
  }

  const [path] = getBezierPath({
    sourceX: sX,
    sourceY: sY,
    sourcePosition: fromPosition,
    targetX: tX,
    targetY: tY,
    targetPosition: targetPos,
  });

  // If Shift is held, snap the preview to 45° increments for cleaner connections
  // Skip if we already snapped to a handle (since tX/tY was set to exact center)
  if (isShiftPressed()) {
    const dx = (tX ?? 0) - (sX ?? 0);
    const dy = (tY ?? 0) - (sY ?? 0);
    const len = Math.hypot(dx, dy) || 1;
    let angle = Math.atan2(dy, dx);
    const snap = Math.PI / 4; // 45°
    angle = Math.round(angle / snap) * snap;
    const ndx = Math.cos(angle) * len;
    const ndy = Math.sin(angle) * len;
    tX = sX + ndx;
    tY = sY + ndy;
  }

  const [snappedPath] = getBezierPath({
    sourceX: sX,
    sourceY: sY,
    sourcePosition: fromPosition,
    targetX: tX,
    targetY: tY,
    targetPosition: targetPos,
  });

  // Evaluate tiered status (ok/warn/error) for richer feedback
  let tierColor = '#94a3b8';
  let reasonMessage: string | undefined;
  try {
    const startInfo = getConnectStart();
    const sourceId = startInfo?.nodeId ?? null;
    const targetId = nodeEl?.getAttribute('data-id') ?? null;
    // Access current edges from instance if available
  const edges = typeof instance?.getEdges === 'function' ? instance.getEdges() : [];
    const tier = evaluateConnectionPreview(sourceId, targetId, edges as any);
    if (tier.status === 'error') {
      tierColor = '#ef4444';
      reasonMessage = tier.message;
    } else if (tier.status === 'warn') {
      tierColor = '#f59e0b';
      reasonMessage = tier.message;
    } else {
      tierColor = '#10b981';
    }
  } catch {
    // Fallback to provided status when evaluation fails
    tierColor = connectionStatus === 'valid' ? '#10b981' : connectionStatus === 'invalid' ? '#ef4444' : '#94a3b8';
  }

  return (
    <g>
      <path
        d={snappedPath}
        stroke={tierColor}
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
      />
      {reasonMessage && (
        <g>
          <rect
            x={(sX + tX) / 2 - 120}
            y={(sY + tY) / 2 - 20}
            rx={6}
            ry={6}
            width={240}
            height={28}
            fill="#111827"
            opacity={0.9}
          />
          <text
            x={(sX + tX) / 2}
            y={(sY + tY) / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#fff"
            fontSize={12}
          >
            {reasonMessage}
          </text>
        </g>
      )}
    </g>
  );
});

CustomConnectionLine.displayName = "CustomConnectionLine";
