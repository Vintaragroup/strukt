// @ts-nocheck
import { memo, useState, useRef, useEffect } from "react";
import { Handle, Position, NodeProps, NodeResizer, useReactFlow, useUpdateNodeInternals } from "@xyflow/react";
import { Copy, ExternalLink, Settings, Palette, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";

export interface CenterNodeData {
  label: string;
  description: string;
  icon?: string;
  link?: string;
  buttonText?: string;
  buttonAction?: () => void;
  secondaryButtonText?: string;
  secondaryButtonAction?: () => void;
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

export const CenterNode = memo(({ data, selected, id }: NodeProps<CenterNodeData>) => {
  const [isPlacingMode, setIsPlacingMode] = useState(false);
  const [handleHovered, setHandleHovered] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showPulse, setShowPulse] = useState(data.isNew || false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditingIcon, setIsEditingIcon] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [localLabel, setLocalLabel] = useState(data.label);
  const [localDescription, setLocalDescription] = useState(data.description);
  const [localIcon, setLocalIcon] = useState(data.icon || "");
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const { screenToFlowPosition } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  const labelInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  const isCollapsed = !!data.collapsed;
  
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
      className="relative w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Node Resizer - Invisible handles, only width resizing; hidden when collapsed */}
      <NodeResizer
        color="transparent"
        isVisible={selected && !isCollapsed}
        minWidth={320}
        minHeight={isCollapsed ? 0 : undefined}
        handleStyle={{
          width: "12px",
          height: "12px",
          background: "transparent",
          border: "none",
        }}
        lineStyle={{
          borderWidth: "0px",
        }}
        // Only enable left and right handles for width resizing
        handleClassName={{
          top: "hidden",
          bottom: "hidden",
          topLeft: "hidden",
          topRight: "hidden",
          bottomLeft: "hidden",
          bottomRight: "hidden",
        }}
      />
      
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
        className={`
          w-full rounded-3xl bg-gradient-to-br ${data.gradient || "from-indigo-700 via-purple-600 to-violet-700"}
          border-2 border-indigo-400/60
          transition-all duration-300 ease-out flex flex-col
          animate-gradient-shift bg-[length:200%_200%]
          ${showPulse ? "animate-pulse-scale" : ""}
          ${
            selected
              ? "ring-4 ring-indigo-400 ring-opacity-95 ring-offset-4"
              : isHovered
              ? ""
              : ""
          }
        `}
        style={{
          boxShadow: selected
            ? "0 30px 60px -12px rgba(99, 102, 241, 0.6), 0 0 0 4px rgba(99, 102, 241, 0.3), 0 0 60px rgba(99, 102, 241, 0.5)"
            : isHovered
            ? "0 30px 60px -12px rgba(99, 102, 241, 0.4)"
            : "0 25px 50px -12px rgba(99, 102, 241, 0.25)",
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
            <h2 className="text-white text-sm font-medium tracking-tight truncate" title={data.label}>
              {data.label}
            </h2>
          </div>
        )}

        {/* Expandable Content Wrapper: animates height for smooth collapse/expand */}
        <div
          className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'}`}
          onTransitionEnd={stopFollowingHandles}
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
          <div className="px-6 pb-5 text-center">
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
              className="text-white text-xl mb-2 tracking-tight cursor-text hover:opacity-80 transition-opacity"
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
              className="text-center mb-4 bg-white/20 border-white/40 text-white placeholder:text-white/60 text-sm min-h-[60px] nopan nodrag"
            />
          ) : (
            <p 
              className="text-indigo-100 text-sm leading-relaxed mb-4 cursor-text hover:opacity-80 transition-opacity"
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
