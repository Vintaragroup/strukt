// @ts-nocheck
import {
  memo,
  useState,
  useRef,
  useEffect,
  useCallback,
  type MouseEvent as ReactMouseEvent,
  type WheelEvent as ReactWheelEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Handle, Position, NodeProps, useUpdateNodeInternals } from "@xyflow/react";
import { Copy, ExternalLink, Settings, Palette, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";

export interface CenterNodeData extends Record<string, unknown> {
  label: string;
  description: string;
  icon?: string;
  link?: string;
  buttonText?: string;
  buttonAction?: () => void;
  secondaryButtonText?: string;
  secondaryButtonAction?: () => void;
  coreIdea?: string;
  coreProblem?: string;
  coreOutcome?: string;
  primaryAudience?: string;
  launchScope?: string;
  primaryRisk?: string;
  kickoffCompletedAt?: string;
  onOpenKickoffDialog?: () => void;
  isConnecting?: boolean;
  isConnectSource?: boolean;
  connectStartHandleId?: string | null;
  onDragNewNode?: (nodeId: string, position: { x: number; y: number }) => void;
  onDragPreviewUpdate?: (start: { x: number; y: number } | null, end: { x: number; y: number } | null) => void;
  onPlacingModeChange?: (isPlacing: boolean, nodeId: string, startPos: { x: number; y: number } | null) => void;
  onUpdateCenterNode?: (updates: Partial<CenterNodeData>) => void;
  gradient?: string;
  isNew?: boolean;
  isPlacingFromThisNode?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  preferredHeight?: number;
  maxNodeHeight?: number;
  preferredWidth?: number;
  maxNodeWidth?: number;
}

// Predefined gradient options
const gradientPresets = [
  { name: "Purple Violet", value: "from-indigo-700 via-purple-600 to-violet-700" },
  { name: "Blue Cyan", value: "from-blue-700 via-blue-600 to-cyan-700" },
  { name: "Green Emerald", value: "from-emerald-700 via-green-600 to-teal-700" },
  { name: "Orange Amber", value: "from-orange-700 via-amber-600 to-yellow-700" },
  { name: "Red Rose", value: "from-red-700 via-rose-600 to-pink-700" },
  { name: "Gray Slate", value: "from-gray-700 via-slate-600 to-zinc-700" },
];

// Common emoji icons for quick selection
const iconPresets = [
  "⚖️", "🚀", "💡", "🎯", "📊", "🔧", "💰", "🌟", "🎨", "🔒",
  "📱", "💻", "🌐", "📈", "🏆", "🎁", "🔔", "⚡", "🎪", "🎭"
];

const CENTER_NODE_WIDTH = 360;
const CENTER_MIN_WIDTH = 320;
const DEFAULT_CENTER_MAX_WIDTH = 600;
const CENTER_SCROLL_HEIGHT = 320;
const CENTER_MIN_HEIGHT = 220;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const CenterNode = memo(({ data, selected, id }: NodeProps<CenterNodeData>) => {
  const [isPlacingMode, setIsPlacingMode] = useState(false);
  const [handleHovered, setHandleHovered] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showPulse, setShowPulse] = useState(data.isNew || false);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditingIcon, setIsEditingIcon] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [localLabel, setLocalLabel] = useState(data.label);
  const [localDescription, setLocalDescription] = useState(data.description);
  const [localIcon, setLocalIcon] = useState(data.icon || "");
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const updateNodeInternals = useUpdateNodeInternals();
  const labelInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  const isCollapsed = !!data.collapsed;
  const heightCap =
    typeof data.maxNodeHeight === "number" && Number.isFinite(data.maxNodeHeight)
      ? data.maxNodeHeight
      : 640;
  const preferredHeight =
    typeof data.preferredHeight === "number" && Number.isFinite(data.preferredHeight)
      ? data.preferredHeight
      : Math.round(CENTER_SCROLL_HEIGHT * 1.2);
  const effectiveHeight = clamp(preferredHeight, CENTER_MIN_HEIGHT, heightCap);
  const widthCap =
    typeof data.maxNodeWidth === "number" && Number.isFinite(data.maxNodeWidth)
      ? data.maxNodeWidth
      : DEFAULT_CENTER_MAX_WIDTH;
  const preferredWidth =
    typeof data.preferredWidth === "number" && Number.isFinite(data.preferredWidth)
      ? data.preferredWidth
      : CENTER_NODE_WIDTH;
  const effectiveWidth = clamp(preferredWidth, CENTER_MIN_WIDTH, widthCap);
  const resizeContextRef = useRef<{
    startX: number;
    startY: number;
    startHeight: number;
    startWidth: number;
    mode: "vertical" | "corner-left" | "corner-right";
  } | null>(null);
  const resizeCleanupRef = useRef<(() => void) | null>(null);
  const applyHeight = useCallback(
    (nextHeight: number) => {
      const clamped = clamp(nextHeight, CENTER_MIN_HEIGHT, heightCap);
      if (typeof data.onUpdateCenterNode === "function") {
        data.onUpdateCenterNode({ preferredHeight: clamped });
      }
    },
    [data, heightCap]
  );

  const applyWidth = useCallback(
    (nextWidth: number) => {
      const clamped = clamp(nextWidth, CENTER_MIN_WIDTH, widthCap);
      if (typeof data.onUpdateCenterNode === "function") {
        data.onUpdateCenterNode({ preferredWidth: clamped });
      }
      requestAnimationFrame(() => updateNodeInternals(id));
    },
    [data, widthCap, updateNodeInternals, id]
  );
  
  // Ref to store cleanup functions - MUST be declared before sync effect
  const eventCleanupRef = useRef<(() => void) | null>(null);
  // rAF loop to keep handles following while the card animates
  const collapseRAFRef = useRef<number | null>(null);
  const isFollowingRef = useRef(false);
  
  // Ref to track if we've successfully synced with parent (prevents premature cleanup)
  const hasStartedPlacingRef = useRef(false);
  
  // Store callbacks in refs so event handlers always have latest version
  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Remove pulse animation after it plays
  useEffect(() => {
    if (data.isNew) {
      const timer = setTimeout(() => {
        setShowPulse(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [data.isNew]);

  // Sync local state with data changes
  useEffect(() => {
    setLocalLabel(data.label);
    setLocalDescription(data.description);
    setLocalIcon(data.icon || "");
  }, [data.label, data.description, data.icon]);

  // Focus on input when editing starts
  useEffect(() => {
    if (isEditingLabel && labelInputRef.current) {
      labelInputRef.current.focus();
      labelInputRef.current.select();
    }
  }, [isEditingLabel]);

  useEffect(() => {
    if (isEditingDescription && descriptionInputRef.current) {
      descriptionInputRef.current.focus();
      descriptionInputRef.current.select();
    }
  }, [isEditingDescription]);

  const handleLabelSave = () => {
    setIsEditingLabel(false);
    if (localLabel.trim() && localLabel !== data.label) {
      data.onUpdateCenterNode?.({ label: localLabel });
    } else {
      setLocalLabel(data.label);
    }
  };

  const handleDescriptionSave = () => {
    setIsEditingDescription(false);
    if (localDescription.trim() && localDescription !== data.description) {
      data.onUpdateCenterNode?.({ description: localDescription });
    } else {
      setLocalDescription(data.description);
    }
  };

  const handleIconChange = (newIcon: string) => {
    setLocalIcon(newIcon);
    data.onUpdateCenterNode?.({ icon: newIcon });
    setIsEditingIcon(false);
  };

  const handleGradientChange = (gradient: string) => {
    data.onUpdateCenterNode?.({ gradient });
  };

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
    };
  }, []);

  // Re-measure size on collapse/expand so handle anchors move with the header
  useEffect(() => {
    updateNodeInternals(id);
    const timer = setTimeout(() => updateNodeInternals(id), 360);
    return () => clearTimeout(timer);
  }, [isCollapsed, id, updateNodeInternals]);

  // Fallback rAF loop around collapse/expand in case transition events don't fire for height
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

  const handleContentWheel = useCallback((event: ReactWheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey) {
      event.stopPropagation();
    }
  }, []);

  const handleContentPointerDown = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  }, []);

  const stopManualResize = useCallback(() => {
    resizeContextRef.current = null;
    if (resizeCleanupRef.current) {
      resizeCleanupRef.current();
      resizeCleanupRef.current = null;
    }
    document.body.style.cursor = "";
    setIsResizing(false);
  }, []);

  const handleResizeMouseMove = useCallback(
    (event: MouseEvent) => {
      const ctx = resizeContextRef.current;
      if (!ctx) return;
      const deltaY = event.clientY - ctx.startY;
      if (ctx.mode === "vertical" || ctx.mode === "corner-left" || ctx.mode === "corner-right") {
        applyHeight(ctx.startHeight + deltaY);
      }

      if (ctx.mode === "corner-left") {
        const deltaX = ctx.startX - event.clientX;
        applyWidth(ctx.startWidth + deltaX);
        document.body.style.cursor = "nwse-resize";
      } else if (ctx.mode === "corner-right") {
        const deltaX = event.clientX - ctx.startX;
        applyWidth(ctx.startWidth + deltaX);
        document.body.style.cursor = "nwse-resize";
      } else {
        document.body.style.cursor = "ns-resize";
      }
    },
    [applyHeight, applyWidth]
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
      resizeContextRef.current = {
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

  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        type: "spring",
        stiffness: 200,
        damping: 20,
        delay: 0.1
      }}
      className="relative"
      style={{ width: effectiveWidth, minWidth: CENTER_MIN_WIDTH, maxWidth: widthCap }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Node Resizer - Invisible handles, only width resizing; hidden when collapsed */}
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
      
      {/* Connection Handles - Multiple for radial layout */}
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

      {/* Drag-to-Create Handles removed: rely on native React Flow handles as the single visible dots */}

      {/* Center Card - Auto height based on content */}
      <div
        className={`w-full rounded-3xl bg-gradient-to-br ${data.gradient || "from-indigo-700 via-purple-600 to-violet-700"} border-2 border-indigo-400/60 flex flex-col animate-gradient-shift bg-[length:200%_200%] ${
          showPulse ? "animate-pulse-scale" : ""
        } ${isResizing ? "" : "transition-all duration-200 ease-out"} ${
          selected ? "ring-4 ring-indigo-400 ring-opacity-95 ring-offset-4" : ""
        }`}
        style={{
          boxShadow: selected
            ? "0 30px 60px -12px rgba(99, 102, 241, 0.6), 0 0 0 4px rgba(99, 102, 241, 0.3), 0 0 60px rgba(99, 102, 241, 0.5)"
            : isHovered
            ? "0 30px 60px -12px rgba(99, 102, 241, 0.4)"
            : "0 25px 50px -12px rgba(99, 102, 241, 0.25)",
          width: effectiveWidth,
          minWidth: CENTER_MIN_WIDTH,
          maxWidth: widthCap,
        }}
        onTransitionEnd={stopFollowingHandles}
      >
        {/* Settings Button */}
        {(selected || isHovered) && (
          <div className="absolute top-3 right-3 z-10">
            <Popover open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20 nopan nodrag"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="end">
                <div className="space-y-4">
                  <div>
                    <h3 className="mb-3">Customize Center Node</h3>
                  </div>

                  {/* Icon Selection */}
                  <div className="space-y-2">
                    <Label>Icon</Label>
                    <div className="grid grid-cols-10 gap-1">
                      {iconPresets.map((emoji) => (
                        <button
                          key={emoji}
                          className={`w-8 h-8 rounded flex items-center justify-center hover:bg-gray-100 transition-colors ${
                            localIcon === emoji ? "bg-indigo-100 ring-2 ring-indigo-500" : ""
                          }`}
                          onClick={() => handleIconChange(emoji)}
                        >
                          <span className="text-lg">{emoji}</span>
                        </button>
                      ))}
                    </div>
                    <Input
                      placeholder="Or paste any emoji..."
                      value={localIcon}
                      onChange={(e) => setLocalIcon(e.target.value)}
                      onBlur={() => {
                        if (localIcon && localIcon !== data.icon) {
                          data.onUpdateCenterNode?.({ icon: localIcon });
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (localIcon && localIcon !== data.icon) {
                            data.onUpdateCenterNode?.({ icon: localIcon });
                          }
                        }
                      }}
                      className="mt-2"
                    />
                  </div>

                  {/* Color/Gradient Selection */}
                  <div className="space-y-2">
                    <Label>Color Theme</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {gradientPresets.map((preset) => (
                        <button
                          key={preset.name}
                          className={`h-10 rounded-lg bg-gradient-to-br ${preset.value} flex items-center justify-center text-white text-xs transition-all hover:scale-105 ${
                            (data.gradient || gradientPresets[0].value) === preset.value
                              ? "ring-2 ring-indigo-500 ring-offset-2"
                              : ""
                          }`}
                          onClick={() => handleGradientChange(preset.value)}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            {/* Collapse Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 ml-1 text-white/80 hover:text-white hover:bg-white/20 nopan nodrag"
              onClick={(e) => { e.stopPropagation(); data.onToggleCollapse?.(); }}
              title={isCollapsed ? 'Expand' : 'Collapse'}
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </Button>
          </div>
        )}

        {/* Collapsed header-only view */}
        {isCollapsed && (
          <div className="px-4 py-3 text-center">
            <h2 className="text-white text-sm font-medium tracking-tight truncate break-words" title={data.label}>
              {data.label}
            </h2>
          </div>
        )}

        {/* Expandable Content Wrapper: animates height for smooth collapse/expand */}
        <div
          className={`overflow-hidden ${isResizing ? "transition-none" : "transition-all duration-200"} ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'}`}
          onTransitionEnd={stopFollowingHandles}
          onWheel={handleContentWheel}
          onMouseDown={handleContentPointerDown}
        >
          {/* Icon */}
          <div className="flex justify-center pt-6 pb-3">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              {data.icon ? (
                <span className="text-3xl">{data.icon}</span>
              ) : (
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-5 text-center overflow-y-auto" style={{ maxHeight: CENTER_SCROLL_HEIGHT }}>
          {/* Label - Editable */}
          {isEditingLabel ? (
            <Input
              ref={labelInputRef}
              value={localLabel}
              onChange={(e) => setLocalLabel(e.target.value)}
              onBlur={handleLabelSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleLabelSave();
                } else if (e.key === 'Escape') {
                  setLocalLabel(data.label);
                  setIsEditingLabel(false);
                }
              }}
              className="text-center mb-2 bg-white/20 border-white/40 text-white placeholder:text-white/60 nopan nodrag"
            />
          ) : (
            <h2 
              className="text-white text-xl mb-2 tracking-tight cursor-text hover:opacity-80 transition-opacity break-words"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingLabel(true);
              }}
              title="Click to edit"
            >
              {data.label}
            </h2>
          )}

          {/* Description - Editable */}
          {isEditingDescription ? (
            <Textarea
              ref={descriptionInputRef}
              value={localDescription}
              onChange={(e) => setLocalDescription(e.target.value)}
              onBlur={handleDescriptionSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleDescriptionSave();
                } else if (e.key === 'Escape') {
                  setLocalDescription(data.description);
                  setIsEditingDescription(false);
                }
              }}
              className="text-center mb-4 bg-white/20 border-white/40 text-white placeholder:text-white/60 text-sm min-h-[60px] nopan nodrag break-words"
            />
          ) : (
            <p 
              className="text-indigo-100 text-sm leading-relaxed mb-4 cursor-text hover:opacity-80 transition-opacity break-words"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingDescription(true);
              }}
              title="Click to edit"
            >
              {data.description}
            </p>
          )}

          {/* Link */}
          {data.link && (
            <div className="flex items-center justify-center gap-2 mb-3 px-3 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 transition-opacity">
              <ExternalLink className="w-3.5 h-3.5 text-indigo-200 shrink-0" />
              <span className="text-indigo-100 text-xs truncate flex-1 min-w-0">{data.link}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:bg-white/20 text-indigo-200 hover:text-white shrink-0"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          )}

          {(data.coreIdea || data.primaryAudience || data.coreOutcome || data.launchScope || data.primaryRisk) && (
            <div className="mb-4 text-left bg-white/10 border border-white/25 rounded-xl px-4 py-3 space-y-3">
              {data.coreIdea && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-indigo-200/80 font-semibold">Idea</p>
                  <p className="text-indigo-50 text-sm leading-relaxed break-words">{data.coreIdea}</p>
                </div>
              )}
              {data.primaryAudience && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-indigo-200/80 font-semibold">First audience</p>
                  <p className="text-indigo-50 text-sm leading-relaxed break-words">{data.primaryAudience}</p>
                </div>
              )}
              {data.coreOutcome && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-indigo-200/80 font-semibold">Success looks like</p>
                  <p className="text-indigo-50 text-sm leading-relaxed break-words">{data.coreOutcome}</p>
                </div>
              )}
              {data.launchScope && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-indigo-200/80 font-semibold">Launch focus</p>
                  <p className="text-indigo-50 text-sm leading-relaxed break-words">{data.launchScope}</p>
                </div>
              )}
              {data.primaryRisk && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-indigo-200/80 font-semibold">Biggest risk</p>
                  <p className="text-indigo-50 text-sm leading-relaxed break-words">{data.primaryRisk}</p>
                </div>
              )}

              {typeof data.onOpenKickoffDialog === "function" && (
                <div className="pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-indigo-100 hover:text-white hover:bg-white/20"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      data.onOpenKickoffDialog?.();
                    }}
                  >
                    Edit idea details
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {(data.buttonText || data.secondaryButtonText) && (
            <div className="space-y-2">
              {data.buttonText && (
                <Button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof data.buttonAction === "function") {
                      data.buttonAction();
                    }
                  }}
                  className="w-full bg-white hover:bg-indigo-50 text-indigo-600 shadow-lg hover:shadow-xl transition-all h-9 text-sm pointer-events-auto nopan nodrag"
                >
                  {data.buttonText}
                </Button>
              )}
              {data.secondaryButtonText && (
                <Button
                  type="button"
                  variant="outline"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof data.secondaryButtonAction === "function") {
                      data.secondaryButtonAction();
                    }
                  }}
                  className="w-full bg-white/15 hover:bg-white/25 text-white border border-white/40 transition-all h-9 text-sm pointer-events-auto nopan nodrag"
                >
                  {data.secondaryButtonText}
                </Button>
              )}
            </div>
          )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

CenterNode.displayName = "CenterNode";
