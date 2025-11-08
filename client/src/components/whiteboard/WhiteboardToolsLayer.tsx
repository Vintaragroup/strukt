import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactFlowInstance, Node, Edge } from "@xyflow/react";
import type {
  LassoMode,
  WhiteboardShapePayload,
  WhiteboardTool,
} from "@/types/whiteboard";
import {
  Point,
  Rect,
  distanceBetweenPoints,
  rectInsidePolygon,
  rectIntersectsPolygon,
  segmentIntersectsRect,
  segmentsIntersect,
} from "@/utils/geometry";

interface WhiteboardToolsLayerProps {
  activeTool: WhiteboardTool;
  lassoMode: LassoMode;
  reactFlowInstance: ReactFlowInstance | null;
  wrapperRef: React.RefObject<HTMLDivElement>;
  onAddShape: (shape: WhiteboardShapePayload) => void;
  onDeleteElements: (nodeIds: string[], edgeIds: string[]) => void;
  onSelectNodes: (nodeIds: string[]) => void;
}

interface PathPoint {
  local: Point;
  flow: Point;
}

const DEFAULT_NODE_WIDTH = 220;
const DEFAULT_NODE_HEIGHT = 160;

export function WhiteboardToolsLayer({
  activeTool,
  lassoMode,
  reactFlowInstance,
  wrapperRef,
  onAddShape,
  onDeleteElements,
  onSelectNodes,
}: WhiteboardToolsLayerProps) {
  const [pathVersion, setPathVersion] = useState(0);
  const [rectVersion, setRectVersion] = useState(0);
  const pathRef = useRef<PathPoint[]>([]);
  const rectRef = useRef<{
    startLocal: Point;
    currentLocal: Point;
    startFlow: Point;
    currentFlow: Point;
  } | null>(null);
  const pointerActiveRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const latestToolRef = useRef<WhiteboardTool>(activeTool);
  latestToolRef.current = activeTool;

  const clearPath = useCallback(() => {
    pathRef.current = [];
    setPathVersion((tick) => tick + 1);
  }, []);

  const clearRectangle = useCallback(() => {
    rectRef.current = null;
    setRectVersion((tick) => tick + 1);
  }, []);

  useEffect(() => {
    if (activeTool === "none") {
      clearPath();
      clearRectangle();
      pointerActiveRef.current = false;
      pointerIdRef.current = null;
    }
  }, [activeTool, clearPath, clearRectangle]);

  const getWrapperBounds = () => wrapperRef.current?.getBoundingClientRect() ?? null;

  const toLocalPoint = (clientX: number, clientY: number): Point => {
    const bounds = getWrapperBounds();
    if (!bounds) return { x: clientX, y: clientY };
    return {
      x: clientX - bounds.left,
      y: clientY - bounds.top,
    };
  };

  const toFlowPoint = (point: Point): Point => {
    if (!reactFlowInstance || typeof reactFlowInstance.project !== "function") {
      return point;
    }
    try {
      return reactFlowInstance.project(point);
    } catch (error) {
      console.warn("[whiteboard-tools] project failed, using raw point", error);
      return point;
    }
  };

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (activeTool === "none") return;
      event.preventDefault();
      event.stopPropagation();
      const local = toLocalPoint(event.clientX, event.clientY);
      const flow = toFlowPoint(local);
      pointerActiveRef.current = true;
      pointerIdRef.current = event.pointerId;
      if (activeTool === "rectangle") {
        rectRef.current = {
          startLocal: local,
          currentLocal: local,
          startFlow: flow,
          currentFlow: flow,
        };
        setRectVersion((tick) => tick + 1);
      } else {
        pathRef.current = [{ local, flow }];
        setPathVersion((tick) => tick + 1);
      }
    },
    [activeTool]
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!pointerActiveRef.current) return;
      if (pointerIdRef.current !== event.pointerId) return;
      event.preventDefault();
      event.stopPropagation();
      const tool = latestToolRef.current;
      if (tool === "rectangle") {
        if (!rectRef.current) return;
        const local = toLocalPoint(event.clientX, event.clientY);
        const flow = toFlowPoint(local);
        rectRef.current = {
          ...rectRef.current,
          currentLocal: local,
          currentFlow: flow,
        };
        setRectVersion((tick) => tick + 1);
        return;
      }
      const local = toLocalPoint(event.clientX, event.clientY);
      const flow = toFlowPoint(local);
      const points = pathRef.current;
      const previous = points[points.length - 1];
      if (!previous || distanceBetweenPoints(previous.local, local) >= 4) {
        pathRef.current = [...points, { local, flow }];
        setPathVersion((tick) => tick + 1);
      }
    },
    []
  );

  const resetPointerState = useCallback(() => {
    pointerActiveRef.current = false;
    pointerIdRef.current = null;
    clearPath();
    clearRectangle();
  }, [clearPath, clearRectangle]);

  const getNodeRect = useCallback((node: Node): Rect | null => {
    const width =
      typeof node.width === "number"
        ? node.width
        : typeof (node as any)?.measured?.width === "number"
        ? (node as any).measured.width
        : typeof node.style?.width === "number"
        ? (node.style?.width as number)
        : DEFAULT_NODE_WIDTH;
    const height =
      typeof node.height === "number"
        ? node.height
        : typeof (node as any)?.measured?.height === "number"
        ? (node as any).measured.height
        : typeof node.style?.height === "number"
        ? (node.style?.height as number)
        : DEFAULT_NODE_HEIGHT;
    const position = node.positionAbsolute ?? node.position;
    if (!position) return null;
    return {
      x: position.x,
      y: position.y,
      width,
      height,
    };
  }, []);

  const collectEraserHits = useCallback(
    (points: Point[]) => {
      if (!reactFlowInstance || points.length < 2) {
        return { nodes: [], edges: [] };
      }
      const segments: [Point, Point][] = [];
      for (let i = 0; i < points.length - 1; i++) {
        segments.push([points[i], points[i + 1]]);
      }
      const nodeHits: string[] = [];
      const nodes = reactFlowInstance.getNodes();
      nodes.forEach((node) => {
        if (!node.id || node.id === "center") return;
        const rect = getNodeRect(node);
        if (!rect) return;
        if (segments.some(([p1, p2]) => segmentIntersectsRect(p1, p2, rect))) {
          nodeHits.push(node.id);
        }
      });

      const nodeMap = new Map(nodes.map((node) => [node.id, node]));
      const edgeHits: string[] = [];
      const edges = reactFlowInstance.getEdges() as Edge[];
      edges.forEach((edge) => {
        const sourceNode = edge.source ? nodeMap.get(edge.source) : null;
        const targetNode = edge.target ? nodeMap.get(edge.target) : null;
        if (!sourceNode || !targetNode) return;
        const sourceRect = getNodeRect(sourceNode);
        const targetRect = getNodeRect(targetNode);
        if (!sourceRect || !targetRect) return;
        const sourceCenter = {
          x: sourceRect.x + sourceRect.width / 2,
          y: sourceRect.y + sourceRect.height / 2,
        };
        const targetCenter = {
          x: targetRect.x + targetRect.width / 2,
          y: targetRect.y + targetRect.height / 2,
        };
        if (segments.some(([p1, p2]) => segmentsIntersect(p1, p2, sourceCenter, targetCenter))) {
          edgeHits.push(edge.id);
        }
      });
      return { nodes: nodeHits, edges: edgeHits };
    },
    [getNodeRect, reactFlowInstance]
  );

  const finalizeEraser = useCallback(() => {
    const flowPoints = pathRef.current.map((point) => point.flow);
    const hits = collectEraserHits(flowPoints);
    if ((hits.nodes.length || hits.edges.length) && (hits.nodes || hits.edges)) {
      onDeleteElements(hits.nodes, hits.edges);
    }
  }, [collectEraserHits, onDeleteElements]);

  const finalizeLasso = useCallback(() => {
    if (!reactFlowInstance || pathRef.current.length < 3) return;
    const polygon = pathRef.current.map((point) => point.flow);
    const nodes = reactFlowInstance.getNodes();
    const selectedIds: string[] = [];
    nodes.forEach((node) => {
      if (!node.id || node.id === "center") return;
      const rect = getNodeRect(node);
      if (!rect) return;
      const matches =
        lassoMode === "full"
          ? rectInsidePolygon(rect, polygon)
          : rectIntersectsPolygon(rect, polygon);
      if (matches) {
        selectedIds.push(node.id);
      }
    });
    onSelectNodes(selectedIds);
  }, [getNodeRect, lassoMode, onSelectNodes, reactFlowInstance]);

  const finalizeFreehand = useCallback(() => {
    if (pathRef.current.length < 4) return;
    const flowPoints = pathRef.current.map((point) => point.flow);
    const xs = flowPoints.map((p) => p.x);
    const ys = flowPoints.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const width = Math.max(12, maxX - minX);
    const height = Math.max(12, maxY - minY);
    const normalizedPoints = flowPoints.map((point) => ({
      x: point.x - minX,
      y: point.y - minY,
    }));
    onAddShape({
      kind: "freehand",
      position: { x: minX, y: minY },
      width,
      height,
      stroke: "#1d4ed8",
      strokeWidth: 2,
      points: normalizedPoints,
    });
  }, [onAddShape]);

  const finalizeRectangle = useCallback(() => {
    if (!rectRef.current) return;
    const {
      startFlow,
      currentFlow,
    } = rectRef.current;
    const width = Math.max(12, Math.abs(currentFlow.x - startFlow.x));
    const height = Math.max(12, Math.abs(currentFlow.y - startFlow.y));
    if (width < 8 || height < 8) return;
    const position = {
      x: Math.min(startFlow.x, currentFlow.x),
      y: Math.min(startFlow.y, currentFlow.y),
    };
    onAddShape({
      kind: "rectangle",
      position,
      width,
      height,
      stroke: "#6366f1",
      strokeWidth: 2,
      fill: "rgba(99,102,241,0.12)",
      borderRadius: 12,
    });
  }, [onAddShape]);

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!pointerActiveRef.current) return;
      if (pointerIdRef.current !== event.pointerId) return;
      event.preventDefault();
      event.stopPropagation();
      const tool = latestToolRef.current;
      if (tool === "eraser") {
        finalizeEraser();
      } else if (tool === "lasso") {
        finalizeLasso();
      } else if (tool === "freehand") {
        finalizeFreehand();
      } else if (tool === "rectangle") {
        finalizeRectangle();
      }
      resetPointerState();
    },
    [finalizeEraser, finalizeFreehand, finalizeLasso, finalizeRectangle, resetPointerState]
  );

  const handlePointerLeave = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!pointerActiveRef.current) return;
      if (pointerIdRef.current !== event.pointerId) return;
      event.preventDefault();
      event.stopPropagation();
      resetPointerState();
    },
    [resetPointerState]
  );

  const pathPoints = useMemo(() => pathRef.current, [pathVersion]);
  const rectDraft = useMemo(() => rectRef.current, [rectVersion]);

  const pathPolyline = useMemo(() => {
    if (!pathPoints.length) return "";
    return pathPoints.map((point) => `${point.local.x},${point.local.y}`).join(" ");
  }, [pathPoints]);

  return (
    <div
      className="absolute inset-0"
      style={{ pointerEvents: activeTool === "none" ? "none" : "auto" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
    >
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {activeTool === "eraser" && pathPoints.length > 1 && (
          <polyline
            points={pathPolyline}
            fill="none"
            stroke="rgba(248,113,113,0.9)"
            strokeWidth={18}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {activeTool === "lasso" && pathPoints.length > 1 && (
          <polyline
            points={pathPolyline}
            fill="rgba(59,130,246,0.08)"
            stroke="#3b82f6"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {activeTool === "freehand" && pathPoints.length > 1 && (
          <polyline
            points={pathPolyline}
            fill="none"
            stroke="#1d4ed8"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>

      {activeTool === "rectangle" && rectDraft && (
        <div
          className="absolute border-2 border-dashed border-indigo-400 bg-indigo-200/20 rounded-2xl pointer-events-none"
          style={{
            left: Math.min(rectDraft.startLocal.x, rectDraft.currentLocal.x),
            top: Math.min(rectDraft.startLocal.y, rectDraft.currentLocal.y),
            width: Math.abs(rectDraft.currentLocal.x - rectDraft.startLocal.x),
            height: Math.abs(rectDraft.currentLocal.y - rectDraft.startLocal.y),
          }}
        />
      )}
    </div>
  );
}
