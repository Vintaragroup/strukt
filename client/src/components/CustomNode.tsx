// @ts-nocheck
import {
  memo,
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useMemo,
  useCallback,
  type MouseEvent as ReactMouseEvent,
  type WheelEvent as ReactWheelEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Handle, Position, NodeProps, useReactFlow, useUpdateNodeInternals } from "@xyflow/react";
import { Layers, Layout, Server, FileText, BookOpen, Plus, MoreVertical, Copy, Trash2, Download, FileJson, FileCode2, ClipboardCopy, GitBranch, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { EditableCard, EditableCardData, CardType } from "./EditableCard";
import { CARD_TEMPLATES, NODE_CARD_MATRIX, type NodeCardTemplateId } from "../config/nodeCardRegistry";
import type { DomainType } from "../types";

export interface CustomNodeData extends Record<string, unknown> {
  label: string;
  type: "root" | "frontend" | "backend" | "requirement" | "doc" | "domain";
  domain?: "business" | "product" | "tech" | "data-ai" | "operations";
  ring?: number; // Which ring (1, 2, 3+) in radial layout
  summary?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  isConnecting?: boolean;
  collapsed?: boolean;
  cards?: EditableCardData[];
  onAddCard?: (type: CardType, templateId?: NodeCardTemplateId) => void;
  onUpdateCard?: (cardId: string, data: EditableCardData) => void;
  onDeleteCard?: (cardId: string) => void;
  onExpandCard?: (cardId: string) => void;
  onDragNewNode?: (nodeId: string, position: { x: number; y: number }) => void;
  onDragPreviewUpdate?: (start: { x: number; y: number } | null, end: { x: number; y: number } | null) => void;
  onPlacingModeChange?: (isPlacing: boolean, nodeId: string, startPos: { x: number; y: number } | null) => void;
  onEditingChange?: (isEditing: boolean) => void;
  onToggleCollapse?: () => void;
  onDuplicate?: () => void;
  onOpenSuggestionPanel?: () => void;
  onDelete?: () => void;
  onExportJSON?: () => void;
  onExportMarkdown?: () => void;
  onCopyData?: () => void;
  onExportSubgraphJSON?: () => void;
  onExportSubgraphMarkdown?: () => void;
  onEnrichWithAI?: () => void;
  isNew?: boolean;
  isPlacingFromThisNode?: boolean;
  enrichmentCount?: number;
  isConnectSource?: boolean;
  connectStartHandleId?: string | null;
  maxNodeHeight?: number;
  preferredHeight?: number;
  maxNodeWidth?: number;
  preferredWidth?: number;
  onGenerateCardContent?: (cardId: string) => void;
  generatingCardId?: string | null;
  documentationAccuracy?: {
    score: number;
    status: "fresh" | "fallback" | "stale";
    lastGeneratedAt?: string;
    factors?: string[];
    qualityConfidence?: number;
    needsReview?: boolean;
    warnings?: string[];
  };
}

const BASE_NODE_WIDTH = 280;
const ROOT_NODE_WIDTH = 320;
const DEFAULT_MAX_NODE_WIDTH = 520;

const nodeConfig = {
  root: {
    icon: Layers,
    color: "#8b5cf6",
    bgGradient: "from-purple-600 via-purple-500 to-violet-600",
    borderColor: "border-l-purple-600",
    cardColor: "purple" as const,
    badgeColor: "bg-white/30 text-white border-white/40",
    selectedRing: "ring-purple-500",
    selectedRingOpacity: "ring-opacity-90",
    selectedGlow: "shadow-purple-500/60",
  },
  frontend: {
    icon: Layout,
    color: "#3b82f6",
    bgGradient: "from-blue-600 via-blue-500 to-cyan-600",
    borderColor: "border-l-blue-600",
    cardColor: "blue" as const,
    badgeColor: "bg-white/30 text-white border-white/40",
    selectedRing: "ring-blue-500",
    selectedRingOpacity: "ring-opacity-90",
    selectedGlow: "shadow-blue-500/60",
  },
  backend: {
    icon: Server,
    color: "#10b981",
    bgGradient: "from-emerald-600 via-emerald-500 to-green-600",
    borderColor: "border-l-emerald-600",
    cardColor: "green" as const,
    badgeColor: "bg-white/30 text-white border-white/40",
    selectedRing: "ring-emerald-500",
    selectedRingOpacity: "ring-opacity-90",
    selectedGlow: "shadow-emerald-500/60",
  },
  requirement: {
    icon: FileText,
    color: "#f59e0b",
    bgGradient: "from-amber-600 via-amber-500 to-orange-600",
    borderColor: "border-l-amber-600",
    cardColor: "orange" as const,
    badgeColor: "bg-white/30 text-white border-white/40",
    selectedRing: "ring-amber-500",
    selectedRingOpacity: "ring-opacity-90",
    selectedGlow: "shadow-amber-500/60",
  },
  doc: {
    icon: BookOpen,
    color: "#ec4899",
    bgGradient: "from-pink-600 via-pink-500 to-rose-600",
    borderColor: "border-l-pink-600",
    cardColor: "pink" as const,
    badgeColor: "bg-white/30 text-white border-white/40",
    selectedRing: "ring-pink-500",
    selectedRingOpacity: "ring-opacity-90",
    selectedGlow: "shadow-pink-500/60",
  },
  domain: {
    icon: Layers,
    color: "#6b7280",
    bgGradient: "from-gray-600 via-gray-500 to-slate-600",
    borderColor: "border-l-gray-600",
    cardColor: "gray" as const,
    badgeColor: "bg-white/30 text-white border-white/40",
    selectedRing: "ring-gray-500",
    selectedRingOpacity: "ring-opacity-90",
    selectedGlow: "shadow-gray-500/60",
  },
};

// Domain-specific overrides
const domainConfig = {
  business: {
    color: "#f97316",
    bgGradient: "from-orange-600 via-orange-500 to-amber-600",
    borderColor: "border-l-orange-600",
    selectedRing: "ring-orange-500",
    selectedGlow: "shadow-orange-500/60",
  },
  product: {
    color: "#3b82f6",
    bgGradient: "from-blue-600 via-blue-500 to-cyan-600",
    borderColor: "border-l-blue-600",
    selectedRing: "ring-blue-500",
    selectedGlow: "shadow-blue-500/60",
  },
  tech: {
    color: "#10b981",
    bgGradient: "from-emerald-600 via-emerald-500 to-green-600",
    borderColor: "border-l-emerald-600",
    selectedRing: "ring-emerald-500",
    selectedGlow: "shadow-emerald-500/60",
  },
  "data-ai": {
    color: "#8b5cf6",
    bgGradient: "from-purple-600 via-purple-500 to-violet-600",
    borderColor: "border-l-purple-600",
    selectedRing: "ring-purple-500",
    selectedGlow: "shadow-purple-500/60",
  },
  operations: {
    color: "#6b7280",
    bgGradient: "from-gray-600 via-gray-500 to-slate-600",
    borderColor: "border-l-gray-600",
    selectedRing: "ring-gray-500",
    selectedGlow: "shadow-gray-500/60",
  },
};

const DEFAULT_MAX_NODE_HEIGHT = 720;
const MIN_NODE_HEIGHT = 200;
const ADD_BUTTON_RESERVE = 64;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const CustomNode = memo(({ data, selected, id }: NodeProps<CustomNodeData>) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPlacingMode, setIsPlacingMode] = useState(false);
  const [handleHovered, setHandleHovered] = useState(false);
  const [showPulse, setShowPulse] = useState(data.isNew || false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const { screenToFlowPosition, setNodes } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  
  // Use domain config if domain is specified, otherwise use type config
  let config = nodeConfig[data.type];
  if (data.domain && domainConfig[data.domain]) {
    config = { ...config, ...domainConfig[data.domain] };
  }
  
  const Icon = config.icon;
  const isRoot = data.type === "root";
  const isCollapsed = !!data.collapsed;
  const headerRef = useRef(null);
  const addButtonRef = useRef(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [footerHeight, setFooterHeight] = useState(ADD_BUTTON_RESERVE);
  const [contentHeight, setContentHeight] = useState(0);
  const heightCap = data.maxNodeHeight ?? DEFAULT_MAX_NODE_HEIGHT;
  const defaultPreferred = Math.max(
    MIN_NODE_HEIGHT,
    Math.min(heightCap, Math.round(heightCap / 2))
  );
  const widthCap = data.maxNodeWidth ?? DEFAULT_MAX_NODE_WIDTH;
  const baseWidth = isRoot ? ROOT_NODE_WIDTH : BASE_NODE_WIDTH;
  const preferredWidth =
    typeof data.preferredWidth === "number" && Number.isFinite(data.preferredWidth)
      ? data.preferredWidth
      : baseWidth;
  const effectiveWidth = clamp(preferredWidth, baseWidth, widthCap);
  const cardWidth = effectiveWidth;
  const preferredHeightRaw = data.preferredHeight ?? defaultPreferred;
  const contentMinHeight = Math.max(
    MIN_NODE_HEIGHT,
    headerHeight + footerHeight + contentHeight
  );
  const effectiveHeight = Math.min(Math.max(preferredHeightRaw, contentMinHeight), heightCap);
  const bodyAvailable = Math.max(0, effectiveHeight - headerHeight - footerHeight);
  const domainTypeMap: Record<string, DomainType> = {
    business: "Business",
    product: "Product",
    tech: "Tech",
    "data-ai": "DataAI",
    operations: "Ops",
  };
  const normalizedDomain = data.domain ? domainTypeMap[data.domain] : undefined;
  const documentationAccuracy = data.documentationAccuracy;
  const accuracyBadgeClass = documentationAccuracy
    ? documentationAccuracy.status === "fallback"
      ? "bg-amber-100/90 text-amber-700 border border-amber-200"
      : documentationAccuracy.status === "stale"
      ? "bg-slate-100/90 text-slate-700 border border-slate-200"
      : documentationAccuracy.score >= 85
      ? "bg-emerald-100/90 text-emerald-700 border border-emerald-200"
      : documentationAccuracy.score >= 65
      ? "bg-blue-100/90 text-blue-700 border border-blue-200"
      : documentationAccuracy.score >= 45
      ? "bg-amber-100/90 text-amber-700 border border-amber-200"
      : "bg-rose-100/90 text-rose-700 border border-rose-200"
    : "";
  const recommendedCards = useMemo(() => {
    const matches = NODE_CARD_MATRIX.filter((entry) => {
      const nodeMatch = entry.nodeTypes ? entry.nodeTypes.includes(data.type) : true;
      const domainMatch = entry.domains
        ? normalizedDomain
          ? entry.domains.includes(normalizedDomain)
          : false
        : true;
      return nodeMatch && domainMatch;
    });
    const uniqueIds = Array.from(new Set(matches.flatMap((entry) => entry.recommendedCards)));
    return uniqueIds.map((templateId) => CARD_TEMPLATES[templateId]).filter(Boolean);
  }, [data.type, normalizedDomain]);
  
  // Ref to store cleanup functions - MUST be declared before sync effect
  const eventCleanupRef = useRef<(() => void) | null>(null);
  // Animate handle reposition during collapse/expand
  const collapseRAFRef = useRef<number | null>(null);
  const isFollowingRef = useRef(false);
  
  // Ref to track if we've successfully synced with parent (prevents premature cleanup)
  const hasStartedPlacingRef = useRef(false);
  
  // Store callbacks in refs so event handlers always have latest version
  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useLayoutEffect(() => {
    const measure = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight || 0);
      }
      if (addButtonRef.current) {
        setFooterHeight(addButtonRef.current.offsetHeight || ADD_BUTTON_RESERVE);
      } else {
        setFooterHeight(ADD_BUTTON_RESERVE);
      }
      if (contentRef.current) {
        const node = contentRef.current;
        const scrollHeight = node.scrollHeight || 0;
        setContentHeight(scrollHeight);
      } else {
        setContentHeight(0);
      }
    };

    measure();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(measure);
      if (headerRef.current) observer.observe(headerRef.current);
      if (addButtonRef.current) observer.observe(addButtonRef.current);
      if (contentRef.current) observer.observe(contentRef.current);
      return () => observer.disconnect();
    }

    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [
    data.label,
    data.type,
    data.summary,
    data.cards?.length,
    data.tags?.length,
    data.cards,
    data.tags,
    isCollapsed,
  ]);

  // Remove pulse animation after it plays
  useEffect(() => {
    if (data.isNew) {
      const timer = setTimeout(() => {
        setShowPulse(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [data.isNew]);

  // Sync local placing mode with parent state
  useEffect(() => {
    // When parent confirms placing mode started, set the flag
    if (data.isPlacingFromThisNode === true && isPlacingMode) {
      hasStartedPlacingRef.current = true;
    }
    
    // Only clean up if we've actually started and now parent says stop
    if (data.isPlacingFromThisNode === false && isPlacingMode && hasStartedPlacingRef.current) {
      // Parent has turned off placing mode, sync local state
      setIsPlacingMode(false);
      hasStartedPlacingRef.current = false;
      
      // Clean up event listeners immediately
      if (eventCleanupRef.current) {
        eventCleanupRef.current();
        eventCleanupRef.current = null;
      }
      // Don't clear dragStartPos - it stays for the duration of the operation
    }
  }, [data.isPlacingFromThisNode, isPlacingMode]);

  const handleDragHandleClick = (e: React.MouseEvent | React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent if already in placing mode
    if (isPlacingMode) return;
    
    // Start placing mode
    const startPos = { x: e.clientX, y: e.clientY };
    setIsPlacingMode(true);
    dragStartPos.current = startPos;
    
    // Notify parent about placing mode
    if (data.onPlacingModeChange) {
      data.onPlacingModeChange(true, id, startPos);
    }

    // IMMEDIATELY attach event listeners (don't wait for useEffect)
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (dragStartPos.current && dataRef.current.onDragPreviewUpdate) {
        dataRef.current.onDragPreviewUpdate(
          dragStartPos.current,
          { x: moveEvent.clientX, y: moveEvent.clientY }
        );
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Cancel placing mode
        setIsPlacingMode(false);
        dragStartPos.current = null;
        if (dataRef.current.onDragPreviewUpdate) {
          dataRef.current.onDragPreviewUpdate(null, null);
        }
        if (dataRef.current.onPlacingModeChange) {
          dataRef.current.onPlacingModeChange(false, id, null);
        }
        // Clean up listeners
        if (eventCleanupRef.current) {
          eventCleanupRef.current();
          eventCleanupRef.current = null;
        }
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keydown', handleEscape);

    // Store cleanup function
    eventCleanupRef.current = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleEscape);
    };
  };

  const activeResizeRef = useRef<{
    startX: number;
    startY: number;
    startHeight: number;
    startWidth: number;
    mode: "vertical" | "corner-left" | "corner-right";
  } | null>(null);
  const resizeCleanupRef = useRef<(() => void) | null>(null);
  const resizeFrameRef = useRef<number | null>(null);
  const pendingResizeRef = useRef<{ height?: number; width?: number } | null>(null);

  const commitResize = useCallback(() => {
    resizeFrameRef.current = null;
    const pending = pendingResizeRef.current;
    if (!pending) return;
    pendingResizeRef.current = null;
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id !== id) return node;
        const nextData = { ...(node.data || {}) };
        if (pending.height !== undefined) {
          nextData.preferredHeight = pending.height;
        }
        if (pending.width !== undefined) {
          nextData.preferredWidth = pending.width;
        }
        return { ...node, data: nextData };
      })
    );
    if (pending.width !== undefined) {
      requestAnimationFrame(() => updateNodeInternals(id));
    }
  }, [setNodes, id, updateNodeInternals]);

  const scheduleResize = useCallback(
    (nextHeight?: number, nextWidth?: number) => {
      if (nextHeight == null && nextWidth == null) return;
      const pending = pendingResizeRef.current ?? {};
      if (nextHeight != null) {
        const clampedHeight = clamp(nextHeight, contentMinHeight, heightCap);
        pending.height = clampedHeight;
      }
      if (nextWidth != null) {
        const clampedWidth = clamp(nextWidth, baseWidth, widthCap);
        pending.width = clampedWidth;
      }
      pendingResizeRef.current = pending;
      if (resizeFrameRef.current === null) {
        resizeFrameRef.current = requestAnimationFrame(commitResize);
      }
    },
    [commitResize, contentMinHeight, heightCap, baseWidth, widthCap]
  );

  const stopManualResize = useCallback(() => {
    activeResizeRef.current = null;
    if (resizeCleanupRef.current) {
      resizeCleanupRef.current();
      resizeCleanupRef.current = null;
    }
    if (resizeFrameRef.current !== null) {
      cancelAnimationFrame(resizeFrameRef.current);
      resizeFrameRef.current = null;
    }
    if (pendingResizeRef.current) {
      commitResize();
    }
    document.body.style.cursor = "";
    setIsResizing(false);
  }, [commitResize]);

  const handleResizeMouseMove = useCallback(
    (event: MouseEvent) => {
      const context = activeResizeRef.current;
      if (!context) return;
      const deltaY = event.clientY - context.startY;
      let nextHeight: number | undefined;
      let nextWidth: number | undefined;
      if (context.mode === "vertical" || context.mode === "corner-left" || context.mode === "corner-right") {
        nextHeight = context.startHeight + deltaY;
      }

      if (context.mode === "corner-left") {
        const deltaX = context.startX - event.clientX;
        nextWidth = context.startWidth + deltaX;
        document.body.style.cursor = "nwse-resize";
      } else if (context.mode === "corner-right") {
        const deltaX = event.clientX - context.startX;
        nextWidth = context.startWidth + deltaX;
        document.body.style.cursor = "nwse-resize";
      } else {
        document.body.style.cursor = "ns-resize";
      }
      scheduleResize(nextHeight, nextWidth);
    },
    [scheduleResize]
  );

  const handleResizeMouseUp = useCallback(() => {
    stopManualResize();
  }, [stopManualResize]);

  const beginResize = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>, mode: "vertical" | "corner-left" | "corner-right") => {
      event.preventDefault();
      event.stopPropagation();
      if (typeof (event.nativeEvent as any).stopImmediatePropagation === "function") {
        (event.nativeEvent as any).stopImmediatePropagation();
      }
      stopManualResize();
      activeResizeRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        startHeight: effectiveHeight,
        startWidth: effectiveWidth,
        mode,
      };
      document.addEventListener("mousemove", handleResizeMouseMove);
      document.addEventListener("mouseup", handleResizeMouseUp);
      resizeCleanupRef.current = () => {
        document.removeEventListener("mousemove", handleResizeMouseMove);
        document.removeEventListener("mouseup", handleResizeMouseUp);
      };
      document.body.style.cursor = mode === "vertical" ? "ns-resize" : "nwse-resize";
      setIsResizing(true);
    },
    [effectiveHeight, effectiveWidth, handleResizeMouseMove, handleResizeMouseUp, stopManualResize]
  );

  useEffect(() => {
    if (preferredHeightRaw < contentMinHeight) {
      scheduleResize(contentMinHeight);
    }
  }, [preferredHeightRaw, contentMinHeight, scheduleResize]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventCleanupRef.current) {
        eventCleanupRef.current();
      }
      if (collapseRAFRef.current !== null) {
        cancelAnimationFrame(collapseRAFRef.current);
        collapseRAFRef.current = null;
      }
      stopManualResize();
    };
  }, [stopManualResize]);

  // Nudge React Flow to re-measure node size so handle anchors move after collapse/expand
  useEffect(() => {
    updateNodeInternals(id);
    const timer = setTimeout(() => updateNodeInternals(id), 360);
    return () => clearTimeout(timer);
  }, [isCollapsed, id, updateNodeInternals]);

  // Fallback: if transition events don't fire, run a short rAF loop
  useEffect(() => {
    startFollowingHandles();
    const stopTimer = setTimeout(() => {
      stopFollowingHandles();
    }, 380);
    return () => clearTimeout(stopTimer);
  }, [isCollapsed]);

  const startFollowingHandles = () => {
    if (isFollowingRef.current) return;
    isFollowingRef.current = true;
    const tick = () => {
      updateNodeInternals(id);
      collapseRAFRef.current = requestAnimationFrame(tick);
    };
    collapseRAFRef.current = requestAnimationFrame(tick);
  };

  const stopFollowingHandles = () => {
    isFollowingRef.current = false;
    if (collapseRAFRef.current !== null) {
      cancelAnimationFrame(collapseRAFRef.current);
      collapseRAFRef.current = null;
    }
    updateNodeInternals(id);
  };

  const handleScrollAreaWheel = useCallback((event: ReactWheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey) {
      event.stopPropagation();
    }
  }, []);

  const handleScrollAreaPointerDown = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  }, []);

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        type: "spring",
        stiffness: 260,
        damping: 20
      }}
  onMouseEnter={() => setIsHovered(true)}
  onMouseLeave={() => setIsHovered(false)}
  className="relative"
  style={{ width: cardWidth }}
    >
      {/* Node Resizer - Invisible handles, cursor changes on hover */}
      
      {/* Connection Handles - All sides for flexible routing */}
      {/* Combined source/target handles that work bidirectionally */}
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        isConnectable={true}
        isConnectableStart={true}
        isConnectableEnd={false}
        className={`w-3 h-3 !bg-indigo-500 !border-2 !border-white !shadow-md !transition-opacity !duration-200 !z-50 ${
          selected || isHovered || data.isConnectSource ? '!opacity-100' : '!opacity-0'
        }`}
        style={{ background: '#818cf8', borderColor: 'white', top: '-6px' }}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        isConnectable={true}
        isConnectableStart={false}
        isConnectableEnd={true}
        className="w-3 h-3 !bg-indigo-500 !border-2 !border-white !shadow-md !z-50 !opacity-0"
        style={{ background: '#818cf8', borderColor: 'white', top: '-6px' }}
      />
      
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        isConnectable={true}
        isConnectableStart={true}
        isConnectableEnd={false}
        className={`w-3 h-3 !bg-indigo-500 !border-2 !border-white !shadow-md !transition-opacity !duration-200 !z-50 ${
          selected || isHovered || data.isConnectSource ? '!opacity-100' : '!opacity-0'
        }`}
        style={{ background: '#818cf8', borderColor: 'white', right: '-6px' }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        isConnectable={true}
        isConnectableStart={false}
        isConnectableEnd={true}
        className="w-3 h-3 !bg-indigo-500 !border-2 !border-white !shadow-md !z-50 !opacity-0"
        style={{ background: '#818cf8', borderColor: 'white', right: '-6px' }}
      />
      
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        isConnectable={true}
        isConnectableStart={true}
        isConnectableEnd={false}
        className={`w-3 h-3 !bg-indigo-500 !border-2 !border-white !shadow-md !transition-opacity !duration-200 !z-50 ${
          selected || isHovered || data.isConnectSource ? '!opacity-100' : '!opacity-0'
        }`}
        style={{ background: '#818cf8', borderColor: 'white', bottom: '-6px' }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        isConnectable={true}
        isConnectableStart={false}
        isConnectableEnd={true}
        className="w-3 h-3 !bg-indigo-500 !border-2 !border-white !shadow-md !z-50 !opacity-0"
        style={{ background: '#818cf8', borderColor: 'white', bottom: '-6px' }}
      />
      
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        isConnectable={true}
        isConnectableStart={true}
        isConnectableEnd={false}
        className={`w-3 h-3 !bg-indigo-500 !border-2 !border-white !shadow-md !transition-opacity !duration-200 !z-50 ${
          selected || isHovered || data.isConnectSource ? '!opacity-100' : '!opacity-0'
        }`}
        style={{ background: '#818cf8', borderColor: 'white', left: '-6px' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        isConnectable={true}
        isConnectableStart={false}
        isConnectableEnd={true}
        className="w-3 h-3 !bg-indigo-500 !border-2 !border-white !shadow-md !z-50 !opacity-0"
        style={{ background: '#818cf8', borderColor: 'white', left: '-6px' }}
      />

      {/* Removed custom overlay dots; the visible source Handle above is the single interactive dot */}

      {/* Node Card */}
      <div
          className={`relative rounded-2xl bg-white border-l-4 w-full flex flex-col overflow-hidden ${config.borderColor} ${
            showPulse ? "animate-pulse-scale" : ""
          } ${
            isResizing ? "" : "transition-all duration-200 ease-out"
          } ${
            selected
              ? `shadow-2xl ring-4 ${config.selectedRing} ${config.selectedRingOpacity} ring-offset-2 ${config.selectedGlow}`
              : isHovered
              ? "shadow-xl"
              : "shadow-md"
          }`}
        style={{
          boxShadow: selected
            ? "0 25px 30px -5px rgba(99, 102, 241, 0.25), 0 15px 15px -5px rgba(99, 102, 241, 0.2), 0 0 0 4px rgba(99, 102, 241, 0.15), 0 0 40px rgba(99, 102, 241, 0.3)"
            : isHovered
            ? "0 25px 30px -5px rgba(0, 0, 0, 0.12), 0 15px 15px -5px rgba(0, 0, 0, 0.06)"
            : undefined,
          width: cardWidth,
          minWidth: cardWidth,
          maxWidth: cardWidth,
          height: effectiveHeight,
          maxHeight: heightCap,
        }}
      >
        {/* Resize overlays */}
        {!isCollapsed && (
          <>
            <div
              className="absolute left-6 right-6 -bottom-[6px] h-[14px] cursor-ns-resize"
              onPointerDown={(e) => beginResize(e, "vertical")}
            />
            <div
              className="absolute -bottom-[6px] -left-[6px] h-[18px] w-[18px] cursor-nwse-resize"
              onPointerDown={(e) => beginResize(e, "corner-left")}
            />
            <div
              className="absolute -bottom-[6px] -right-[6px] h-[18px] w-[18px] cursor-nesw-resize"
              onPointerDown={(e) => beginResize(e, "corner-right")}
            />
          </>
        )}
        {/* Header */}
        <div
          ref={headerRef}
          className={`p-4 pb-3 bg-gradient-to-r ${config.bgGradient} rounded-t-2xl relative animate-gradient-shift bg-[length:200%_200%]`}
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 shadow-sm">
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0 relative">
              <h3 className="text-white leading-snug break-words">
                {data.label}
              </h3>
              {documentationAccuracy && (
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium backdrop-blur-sm ${accuracyBadgeClass}`}
                    title={
                      documentationAccuracy.factors
                        ? documentationAccuracy.factors.join(" • ")
                        : undefined
                    }
                  >
                    {documentationAccuracy.score}% accuracy
                    {documentationAccuracy.status === "stale"
                      ? " (refresh suggested)"
                      : documentationAccuracy.status === "fallback"
                      ? " (review recommended)"
                      : ""}
                  </span>
                  {documentationAccuracy.needsReview && (
                    <span className="text-[11px] text-white/80">
                      Double-check generated content
                    </span>
                  )}
                </div>
              )}
              {data.enrichmentCount && data.enrichmentCount > 0 && (
                <div 
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white/90 flex items-center justify-center shadow-md animate-pulse"
                  title={`Enriched ${data.enrichmentCount} time${data.enrichmentCount > 1 ? 's' : ''}`}
                >
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                </div>
              )}
            </div>
            {/* Context Menu */}
            {(selected || isHovered) && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/20"
                  onClick={(e) => { e.stopPropagation(); data.onToggleCollapse?.(); }}
                  title={isCollapsed ? 'Expand' : 'Collapse'}
                >
                  {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/20"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-1" align="end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2"
                    onClick={() => data.onEnrichWithAI?.()}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    Enrich with AI
                  </Button>
                  <div className="h-px bg-gray-200 my-1" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => data.onDuplicate?.()}
                  >
                    <Copy className="w-3.5 h-3.5 mr-2" />
                    Duplicate
                  </Button>
                  <div className="px-2 py-1.5 text-xs text-gray-500 mt-1">
                    Export Single Node
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => data.onExportJSON?.()}
                  >
                    <FileJson className="w-3.5 h-3.5 mr-2" />
                    Export as JSON
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => data.onExportMarkdown?.()}
                  >
                    <FileCode2 className="w-3.5 h-3.5 mr-2" />
                    Export as Markdown
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => data.onCopyData?.()}
                  >
                    <ClipboardCopy className="w-3.5 h-3.5 mr-2" />
                    Copy to Clipboard
                  </Button>
                  <div className="px-2 py-1.5 text-xs text-gray-500 mt-1">
                    Export with Connections
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => data.onExportSubgraphJSON?.()}
                  >
                    <GitBranch className="w-3.5 h-3.5 mr-2" />
                    Subgraph as JSON
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => data.onExportSubgraphMarkdown?.()}
                  >
                    <GitBranch className="w-3.5 h-3.5 mr-2" />
                    Subgraph as Markdown
                  </Button>
                  <div className="h-px bg-gray-200 my-1" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => data.onDelete?.()}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                    Delete
                  </Button>
                  </PopoverContent>
                </Popover>
              </div>
            )}
        </div>
        {/* Type Badge */}
        <div className="mt-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border backdrop-blur-sm ${config.badgeColor}`}>
            <Icon className="w-3 h-3" />
            {data.type.charAt(0).toUpperCase() + data.type.slice(1)}
          </span>
        </div>
        {selected && (
          <button
            type="button"
            onClick={() => data.onOpenSuggestionPanel?.()}
            className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Suggest Next
          </button>
        )}
      </div>

      {/* Collapsible Section: Summary, Cards, Tags, Add Button */}
        <div
          className={`flex flex-col min-h-0 overflow-hidden ${
            isResizing ? "transition-none" : "transition-[height,opacity] duration-200"
          } ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          style={{ height: isCollapsed ? 0 : Math.max(0, bodyAvailable) }}
          onTransitionEnd={stopFollowingHandles}
        >
          <div
            ref={contentRef}
            className="flex-1 overflow-y-auto min-h-0"
            onWheel={handleScrollAreaWheel}
            onMouseDown={handleScrollAreaPointerDown}
          >
            {data.summary && (
              <div className="px-4 pt-3 pb-2">
                <p className="text-gray-600 leading-relaxed text-sm break-words">
                  {data.summary}
                </p>
              </div>
            )}
            {data.cards && data.cards.length > 0 && (
              <div className="px-3 pb-2 space-y-2">
                {data.cards.map((card) => (
                  <EditableCard
                    key={card.id}
                    data={card}
                    onUpdate={(updatedCard) => data.onUpdateCard?.(card.id, updatedCard)}
                    onDelete={() => data.onDeleteCard?.(card.id)}
                    onExpand={() => data.onExpandCard?.(card.id)}
                    color={config.cardColor}
                    onEditingChange={data.onEditingChange}
                    onGenerateContent={
                      data.onGenerateCardContent ? () => data.onGenerateCardContent(card.id) : undefined
                    }
                    isGenerating={data.generatingCardId === card.id}
                  />
                ))}
              </div>
            )}
            {data.tags && data.tags.length > 0 && (
              <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                {data.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 text-xs rounded-md bg-gray-100 text-gray-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="mt-auto">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  ref={addButtonRef}
                  className="w-full py-2.5 flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-t border-gray-100 rounded-b-2xl transition-colors shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Add Card
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="center">
                <div className="space-y-1">
                  {recommendedCards.length > 0 && (
                    <>
                      <p className="px-2 pb-1 text-[11px] uppercase tracking-wide text-slate-400">
                        Suggested
                      </p>
                      {recommendedCards.map((template) => (
                        <Button
                          key={template.id}
                          variant="ghost"
                          className="w-full justify-start gap-2 h-9 text-sm"
                          onClick={() => data.onAddCard?.(template.cardType, template.id)}
                        >
                          <Sparkles className="w-4 h-4 text-emerald-500" />
                          {template.label}
                        </Button>
                      ))}
                      <div className="border-t border-slate-100 my-2" />
                    </>
                  )}
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 h-9 text-sm"
                    onClick={() => data.onAddCard?.("text")}
                  >
                    <FileText className="w-4 h-4 text-gray-600" />
                    Text
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 h-9 text-sm"
                    onClick={() => data.onAddCard?.("todo")}
                  >
                    <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M9 11l3 3 5-5" />
                    </svg>
                    To-Do List
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

CustomNode.displayName = "CustomNode";
