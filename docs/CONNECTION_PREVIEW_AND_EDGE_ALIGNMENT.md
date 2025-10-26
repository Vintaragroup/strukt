# Connection Preview and Edge Alignment

This document explains how the connection preview (the line you see while dragging) and the finalized edges are made to attach precisely to the handle dots without visual gaps or overshoot. It also lists the knobs to tweak if alignment ever regresses.

## TL;DR
- Preview line starts at the exact handle you clicked and ends at the cursor, clamped to the outer edge of a hovered node.
- Final edges use a tiny, zoom-aware outward nudge so the path meets the visible dot center on both nodes.
- Handle visuals are fixed-size (12px) with consistent offsets and no hover scaling to avoid drift.

## Files and responsibilities
- `client/src/components/CustomConnectionLine.tsx`
  - Renders the in-progress connection line.
  - Anchors the start to the actual DOM handle center (nodeId + handleId from onConnectStart).
  - Keeps the endpoint exactly under the pointer; when hovering a node, clamps the endpoint to the node boundary so the line never draws inside the card.
  - Zoom-aware transforms are used when converting between screen and flow coordinates.
- `client/src/components/CustomEdge.tsx`
  - Renders finalized edges.
  - Applies a small outward “nudge” from both source and target, scaled by current zoom, so the path meets the visible dot center.
  - Uses `strokeLinecap="round"` for clean joins.
- `client/src/App.tsx`
  - Wires `connectionLineComponent={CustomConnectionLine}` on `<ReactFlow />`.
  - Captures `onConnectStart` and `onConnectEnd` and stores the start `(nodeId, handleId)` in a tiny module-scoped store.
  - Passes `isConnectSource` to nodes so the starting node’s source dots remain visible during drag.
- `client/src/utils/connectionState.ts`
  - Minimal store for the current connection start (nodeId, handleId), consulted by the preview renderer.
- `client/src/components/CustomNode.tsx` and `client/src/components/CenterNode.tsx`
  - Handle visuals: 12px (Tailwind `w-3 h-3`) with offsets `-6px` on each side.
  - No hover scale on source handles; only opacity changes. This prevents any perceived center drift.

## Why the issue happened
- The preview used library-provided coordinates that didn’t always match the exact handle the user clicked, and offsets were applied inconsistently and not scaled with zoom.
- The preview endpoint was sometimes offset, which made it overshoot the pointer when hovering other nodes.

## How it’s fixed
1. Source (start) anchoring
  - In `App.tsx`, we record `nodeId` and `handleId` at `onConnectStart` and clear at `onConnectEnd`.
  - In `CustomConnectionLine.tsx`, we query the DOM for the exact handle element using:
    - `querySelector('[data-nodeid="<nodeId>"][data-handleid="<handleId>"]')`
  - We compute its center in screen space, convert to flow space using `screenToFlowPosition`, and use that as `(sourceX, sourceY)` for the preview line.

2. Target (end) preview behavior
  - The preview endpoint stays exactly at the pointer in general.
  - If the pointer is over a node, we compute the intersection of the start→cursor line segment with the node’s bounding box (in screen coordinates) and clamp the endpoint to that intersection.
  - This prevents the preview from drawing inside the hovered node.

3. Finalized edges
  - In `CustomEdge.tsx`, we apply a small outward nudge (default 6px) from both ends scaled by current zoom (via `useReactFlow().getViewport()`).
  - This aligns the rendered path with the visible dot center, and the rounded line caps make the join look crisp.

## Knobs you can tweak
- Outward nudge on finalized edges: `OUTSET` in `CustomEdge.tsx` (default 6). Increase/decrease by 1 to tune to your monitor.
- Handle size and offsets:
  - In `CustomNode.tsx` and `CenterNode.tsx` source/target `Handle` elements:
    - Size: `w-3 h-3` (12px)
    - Offset: `top/right/bottom/left: '-6px'`
  - Avoid adding `hover:scale-*` transforms; they visually shift the center.
- Preview endpoint clamp tolerance: `±0.5px` perimeter margin in the intersection logic, inside `CustomConnectionLine.tsx`.

## Troubleshooting checklist
- The preview line jumps when clicking a dot:
  - Ensure `onConnectStart` is forwarding `nodeId` and `handleId` to `setConnectStart()` and that `CustomConnectionLine.tsx` is querying the DOM handle element.
- The preview line passes into the target node:
  - Confirm the intersection clamp code in `CustomConnectionLine.tsx` is present and that `.react-flow__node` is found under the cursor.
- Final edges don’t meet the dots:
  - Adjust `OUTSET` in `CustomEdge.tsx` by ±1 and verify `strokeLinecap="round"` is set.
- Dots disappear while dragging:
  - Ensure `isConnectSource` is passed on nodes in `App.tsx` and included in handle opacity conditions in node components.

## Related source references
- `client/src/components/CustomConnectionLine.tsx`
- `client/src/components/CustomEdge.tsx`
- `client/src/utils/connectionState.ts`
- `client/src/App.tsx` (`onConnectStart`, `onConnectEnd`, and `connectionLineComponent`)
- `client/src/components/CustomNode.tsx`, `client/src/components/CenterNode.tsx` (handle dimensions and offsets)