// @ts-nocheck
import { memo, useState } from "react";
import { EdgeProps, getBezierPath, EdgeLabelRenderer, Position, useReactFlow } from "@xyflow/react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { FileText, Plus, MessageSquare, AlertCircle, X, Edit2 } from "lucide-react";
import { getRelationshipColor, getRelationshipLabel, RelationshipType } from "../utils/relationships";

export const CustomEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected,
}: EdgeProps) => {
  // Optional outset adjustment disabled to ensure the path hits handle centers precisely
  const OUTSET = 0;
  const { getViewport, getNode } = useReactFlow();
  const zoom = getViewport()?.zoom ?? 1;
  const outset = OUTSET / (zoom || 1);

  let sX = sourceX;
  let sY = sourceY;
  let tX = targetX;
  let tY = targetY;

  if (sourcePosition === Position.Left) sX -= outset;
  if (sourcePosition === Position.Right) sX += outset;
  if (sourcePosition === Position.Top) sY -= outset;
  if (sourcePosition === Position.Bottom) sY += outset;

  if (targetPosition === Position.Left) tX -= outset;
  if (targetPosition === Position.Right) tX += outset;
  if (targetPosition === Position.Top) tY -= outset;
  if (targetPosition === Position.Bottom) tY += outset;

  const toNumber = (value: unknown): number | null => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = parseFloat(value);
      if (Number.isFinite(parsed)) return parsed;
    }
    return null;
  };

  const measureFromDom = (nodeId: string) => {
    try {
      const element = document.querySelector(
        `[data-id="${nodeId}"]`
      ) as HTMLElement | null;
      if (!element) return null;
      const viewport = getViewport?.() ?? { zoom: 1 };
      const zoom = viewport?.zoom || 1;
      return {
        width: element.offsetWidth / zoom,
        height: element.offsetHeight / zoom,
      };
    } catch {
      return null;
    }
  };

  const resolveNodeSize = (node: any) => {
    const DEFAULT_W = 280;
    const DEFAULT_H = 200;
    if (!node) {
      return { width: DEFAULT_W, height: DEFAULT_H };
    }
    const width =
      toNumber(node.width) ??
      toNumber(node.measured?.width) ??
      toNumber(node.style?.width) ??
      DEFAULT_W;

    const height =
      toNumber(node.height) ??
      toNumber(node.measured?.height) ??
      toNumber(node.style?.height) ??
      DEFAULT_H;

    return {
      width: Math.max(1, Math.round(width)),
      height: Math.max(1, Math.round(height)),
    };
  };

  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

  const adjustEndpointToCardEdge = (
    nodeId: string | undefined,
    position: Position | undefined,
    x: number,
    y: number
  ) => {
    if (!nodeId) {
      return { x, y };
    }
    const node = getNode?.(nodeId);
    if (!node?.position) {
      return { x, y };
    }
    if (!position) {
      return { x, y };
    }

    let { width, height } = resolveNodeSize(node);
    const domSize = measureFromDom(nodeId);
    if (domSize) {
      width = Math.max(width, Math.round(domSize.width));
      height = Math.max(height, Math.round(domSize.height));
    }
    const left = node.position.x;
    const right = left + width;
    const top = node.position.y;
    const bottom = top + height;

    if (position === Position.Left) {
      return { x: left, y: clamp(y, top, bottom) };
    }
    if (position === Position.Right) {
      return { x: right, y: clamp(y, top, bottom) };
    }
    if (position === Position.Top) {
      return { x: clamp(x, left, right), y: top };
    }
    if (position === Position.Bottom) {
      return { x: clamp(x, left, right), y: bottom };
    }
    return { x, y };
  };

  const adjustedSource = adjustEndpointToCardEdge(
    data?.sourceNodeId,
    sourcePosition,
    sX,
    sY
  );
  if (!Number.isFinite(sX) || !Number.isFinite(sY)) {
    sX = adjustedSource.x;
    sY = adjustedSource.y;
  }

  const adjustedTarget = adjustEndpointToCardEdge(
    data?.targetNodeId,
    targetPosition,
    tX,
    tY
  );
  if (!Number.isFinite(tX) || !Number.isFinite(tY)) {
    tX = adjustedTarget.x;
    tY = adjustedTarget.y;
  }

  // Determine if either endpoint node is selected; if none are selected,
  // we switch to 'butt' linecaps to keep the line flush with the node edge (no round overhang).
  const sourceNodeSelected = data?.sourceNodeId ? !!getNode?.(data.sourceNodeId)?.selected : false;
  const targetNodeSelected = data?.targetNodeId ? !!getNode?.(data.targetNodeId)?.selected : false;
  const anyEndpointSelected = sourceNodeSelected || targetNodeSelected;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: sX,
    sourceY: sY,
    sourcePosition,
    targetX: tX,
    targetY: tY,
    targetPosition,
  });

  const [notes, setNotes] = useState<string[]>(data?.notes || []);
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [currentNoteText, setCurrentNoteText] = useState("");
  const [editingNoteIndex, setEditingNoteIndex] = useState<number | null>(null);
  const [isHover, setIsHover] = useState(false);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (data?.onEdgeContextMenu) {
      data.onEdgeContextMenu(e, { id, data });
    }
  };

  const handleAddNode = () => {
    if (data?.onAddNode) {
      // Pass the label position, source node, and target node
      data.onAddNode(labelX, labelY, data.sourceNodeId, data.targetNodeId, id);
    }
  };

  const handleOpenNotesDialog = () => {
    setCurrentNoteText("");
    setEditingNoteIndex(null);
    setIsNotesDialogOpen(true);
  };

  const handleSaveNote = () => {
    if (!currentNoteText.trim()) return;
    
    if (editingNoteIndex !== null) {
      // Edit existing note
      const updatedNotes = [...notes];
      updatedNotes[editingNoteIndex] = currentNoteText;
      setNotes(updatedNotes);
    } else {
      // Add new note
      setNotes([...notes, currentNoteText]);
    }
    
    setCurrentNoteText("");
    setEditingNoteIndex(null);
  };

  const handleEditNote = (index: number) => {
    setCurrentNoteText(notes[index]);
    setEditingNoteIndex(index);
  };

  const handleDeleteNote = (index: number) => {
    setNotes(notes.filter((_, i) => i !== index));
    if (editingNoteIndex === index) {
      setCurrentNoteText("");
      setEditingNoteIndex(null);
    }
  };

  const isSelected = !!selected;
  const relationshipType = data?.relationshipType as RelationshipType | undefined;
  const relationshipColor = relationshipType ? getRelationshipColor(relationshipType) : "#a78bfa";
  
  // Zoom-aware stroke widths to keep hit area and glow consistent in screen pixels
  const HIT_WIDTH_SCREENSIDE = 32; // px
  const GLOW_WIDTH_SCREENSIDE = 12; // px (more subtle)
  const hitStrokeWidth = (HIT_WIDTH_SCREENSIDE / (zoom || 1));
  const glowStrokeWidth = (GLOW_WIDTH_SCREENSIDE / (zoom || 1));

  return (
    <>
      <defs>
        <linearGradient id={`gradient-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={relationshipColor} stopOpacity={isSelected ? "0.6" : "0.3"} />
          <stop offset="50%" stopColor={relationshipColor} stopOpacity={isSelected ? "0.8" : "0.5"} />
          <stop offset="100%" stopColor={relationshipColor} stopOpacity={isSelected ? "0.6" : "0.3"} />
        </linearGradient>
      </defs>
      {/* Subtle hover glow underneath (non-interactive) – only on hover */}
      <path
        d={edgePath}
        stroke={relationshipColor}
        strokeWidth={isHover ? glowStrokeWidth : 0}
  strokeLinecap={anyEndpointSelected ? "round" : "butt"}
        fill="none"
        opacity={isHover ? 0.12 : 0}
        style={{ pointerEvents: 'none', transition: 'opacity 120ms ease, stroke-width 120ms ease' }}
      />

      <motion.path
        id={id}
        style={{
          ...style,
          stroke: isSelected ? relationshipColor : `url(#gradient-${id})`,
          cursor: 'pointer',
          pointerEvents: 'none',
        }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        strokeWidth={isSelected ? 8 : 6}
        strokeLinecap={anyEndpointSelected ? "round" : "butt"}
        fill="none"
        // visible path is non-interactive; hit testing handled by the wider interaction path below
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ 
          pathLength: 1, 
          opacity: 1,
          strokeDasharray: isSelected ? "5,5" : "0",
          strokeDashoffset: isSelected ? [0, -10] : 0
        }}
        transition={{
          pathLength: { duration: 0.5, ease: "easeInOut" },
          opacity: { duration: 0.3 },
          strokeDashoffset: isSelected ? { 
            duration: 1.5, 
            repeat: Infinity, 
            ease: "linear" 
          } : { duration: 0 }
        }}
      />
      {/* Invisible, extra-wide hit area on top to make edge easy to select */}
      <path
        d={edgePath}
        stroke="rgba(0,0,0,0)"
        strokeWidth={hitStrokeWidth}
        strokeLinecap="round"
        fill="none"
        className="react-flow__edge-interaction"
        style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan flex items-center gap-2"
        >
          {relationshipType && relationshipType !== "related-to" && (
            <Badge
              variant="secondary"
              className="text-xs px-2 py-0.5 bg-white shadow-sm"
              style={{ borderColor: relationshipColor, color: relationshipColor }}
            >
              {getRelationshipLabel(relationshipType)}
            </Badge>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outline"
                  size="icon"
                  className="w-8 h-8 rounded-full bg-white shadow-md hover:shadow-lg transition-all border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 relative group"
                >
                {notes.length > 0 ? (
                  <div className="flex items-center justify-center">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white text-[10px] rounded-full flex items-center justify-center">
                      {notes.length}
                    </span>
                  </div>
                ) : (
                  <Plus className="w-3.5 h-3.5 text-gray-600 group-hover:text-indigo-600" />
                )}
                </Button>
              </motion.div>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="center">
              <div className="space-y-1">
                <div className="px-2 py-1.5 text-xs text-gray-500">
                  Connection Actions:
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 h-9 text-sm"
                  onClick={handleAddNode}
                >
                  <Plus className="w-4 h-4 text-indigo-600" />
                  Add Node on Connection
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 h-9 text-sm"
                  onClick={handleOpenNotesDialog}
                >
                  <MessageSquare className="w-4 h-4 text-gray-600" />
                  {notes.length > 0 ? `View Notes (${notes.length})` : 'Add Note'}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </EdgeLabelRenderer>

      {/* Notes Dialog */}
      <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Connection Notes</DialogTitle>
            <DialogDescription>
              Add and manage notes for this connection
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Existing Notes */}
            {notes.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm text-gray-500">Existing Notes:</div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {notes.map((note, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200 group hover:border-indigo-200 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm flex-1 whitespace-pre-wrap">{note}</p>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleEditNote(index)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteNote(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Add/Edit Note Input */}
            <div className="space-y-2">
              <div className="text-sm text-gray-500">
                {editingNoteIndex !== null ? 'Edit Note:' : 'New Note:'}
              </div>
              <Textarea
                placeholder="Add a note about this connection..."
                value={currentNoteText}
                onChange={(e) => setCurrentNoteText(e.target.value)}
                className="min-h-[100px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleSaveNote();
                  }
                }}
              />
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-400">
                  Press ⌘/Ctrl + Enter to save
                </div>
                <div className="flex gap-2">
                  {editingNoteIndex !== null && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCurrentNoteText("");
                        setEditingNoteIndex(null);
                      }}
                    >
                      Cancel Edit
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={handleSaveNote}
                    disabled={!currentNoteText.trim()}
                  >
                    {editingNoteIndex !== null ? 'Update' : 'Add'} Note
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});

CustomEdge.displayName = "CustomEdge";
