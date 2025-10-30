// @ts-nocheck
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { ReactFlow, 
  Background,
  BackgroundVariant,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  NodeTypes,
  EdgeTypes,
  Node,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";
import { AnimatePresence } from "motion/react";
import { updateEdgesWithOptimalHandles } from "./utils/edgeRouting";
import { applyRadialLayout } from "./utils/autoLayout";
import { applyDomainRadialLayout, calculateNewNodePosition, getDomainForNodeType } from "./utils/domainLayout";
import { devOutlineCollisions, resolveCollisions } from "./utils/collision";
import { captureNodeDimensions as measureNodes } from "@/utils/measure";
import seed from "./fixtures/collision_seed.json";
import { alignNodes, distributeNodes, AlignmentType } from "./utils/alignment";
import { HistoryManager } from "./utils/history";
import { exportToPNG, exportToSVG, exportToMarkdown, downloadMarkdown, exportNodeAsJSON, exportNodeAsMarkdown, copyNodeToClipboard, exportBatchAsJSON, exportBatchAsMarkdown, exportSubgraphAsJSON, exportSubgraphAsMarkdown } from "./utils/export";
import { importNodeFromJSON, importMultipleNodesFromJSON } from "./utils/import";
import { getNodesBounds, getViewportForBounds } from '@xyflow/react';

import { Toolbar } from "./components/Toolbar";
import { Sidebar } from "./components/Sidebar";
import { StatusBar } from "./components/StatusBar";
import { ZoomControls } from "./components/ZoomControls";
import { NodeHierarchy } from "./components/NodeHierarchy";
import { AIButton } from "./components/AIButton";
import { CustomNode, CustomNodeData } from "./components/CustomNode";
import { CenterNode, CenterNodeData } from "./components/CenterNode";
import { StartWizard } from "./components/StartWizard";
import { SuggestionPanel } from "./components/SuggestionPanel";
import type { SuggestedNode } from "./types/ai";
import { EditableCardData } from "./components/EditableCard";
import { CustomEdge } from "./components/CustomEdge";
import { DragPreviewOverlay } from "./components/DragPreviewOverlay";
import { AddNodeModal } from "./components/AddNodeModal";
import { AISuggestPanel } from "./components/AISuggestPanel";
import { SaveLoadDialog } from "./components/SaveLoadDialog";
import { UserSettingsDialog } from "./components/UserSettingsDialog";
import { DetailPanel } from "./components/DetailPanel";
import { ConnectModal } from "./components/ConnectModal";
import { OnboardingOverlay } from "./components/OnboardingOverlay";
import { EmptyState } from "./components/EmptyState";
import { KeyboardShortcutsDialog } from "./components/KeyboardShortcutsDialog";
import { FloatingFormatToolbar } from "./components/FloatingFormatToolbar";
import { CommandPalette } from "./components/CommandPalette";
import { CanvasContextMenu } from "./components/CanvasContextMenu";
import { NodeContextMenu } from "./components/NodeContextMenu";
import { ImportNodeModal } from "./components/ImportNodeModal";
import { AIEnrichmentModal } from "./components/AIEnrichmentModal";
import { SearchPanel } from "./components/SearchPanel";
import { BulkActionsToolbar } from "./components/BulkActionsToolbar";
import { BulkTagEditor } from "./components/BulkTagEditor";
import { BulkTypeEditor } from "./components/BulkTypeEditor";
import { SelectByCriteria } from "./components/SelectByCriteria";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { TemplateGallery } from "./components/TemplateGallery";
import { SaveTemplateDialog } from "./components/SaveTemplateDialog";
import { MinimapPanel } from "./components/MinimapPanel";
import { AnalyticsModal } from "./components/AnalyticsModal";
import { SnapshotsPanel } from "./components/SnapshotsPanel";
import { RelationshipsPanel } from "./components/RelationshipsPanel";
import { CustomConnectionLine } from "./components/CustomConnectionLine";
import { setConnectStart } from "./utils/connectionState";
import { DomainRings } from "./components/DomainRings";
import { EdgeContextMenu } from "./components/EdgeContextMenu";
import { ConnectSourcesModal } from "./components/ConnectSourcesModal";
import { applySuggestions } from "./utils/graphOps";
import { SpecContextDialog } from "./components/SpecContextDialog";
import { applySuggestion, submitFeedback } from "./services/aiSuggestions";
import { workspacesAPI } from "./api/client";
import type { Workspace } from "./types";
import {
  bulkAddTags,
  bulkRemoveTags,
  bulkReplaceTags,
  bulkChangeType,
  bulkDeleteNodes,
  bulkDuplicateNodes,
  bulkUpdateTodos,
  bulkClearCards,
  selectNodesByCriteria,
  BulkSelectionCriteria,
} from "./utils/bulkOperations";
import { Template } from "./utils/templates";
import { calculateAnalytics, getInsights } from "./utils/analytics";
import { createAutoSnapshot, getSnapshots } from "./utils/snapshots";
import { RelationshipType, setRelationshipType, getRelationshipLabel } from "./utils/relationships";

const DEFAULT_WORKSPACE_ID = import.meta.env.VITE_DEFAULT_WORKSPACE_ID || "000000000000000000000001";
const USE_MOCK_SUGGESTIONS = import.meta.env.VITE_MOCK_AI_SUGGESTIONS !== "false";
const WORKSPACE_ID_STORAGE_KEY = "flowforge-active-workspace-id";
const WORKSPACE_NAME_STORAGE_KEY = "flowforge-active-workspace-name";

const DEFAULT_WORKSPACE_NODE = {
  id: "center",
  type: "root",
  position: { x: 0, y: 0 },
  data: {
    title: "Project Root",
    summary: "Seeded workspace entry generated by Strukt.",
  },
};

function generateWorkspaceName(existingNames: Set<string>): string {
  const base = "FlowForge Workspace";
  if (!existingNames.has(base)) {
    return base;
  }
  let counter = 2;
  let candidate = `${base} ${counter}`;
  while (existingNames.has(candidate)) {
    counter += 1;
    candidate = `${base} ${counter}`;
  }
  return candidate;
}

function buildDefaultWorkspacePayload(name: string): Omit<Workspace, "_id" | "createdAt" | "updatedAt"> {
  return {
    name,
    nodes: [
      {
        ...DEFAULT_WORKSPACE_NODE,
      } as any,
    ],
    edges: [],
  };
}

type SerializableWorkspaceNode = {
  id: string;
  type: "root" | "frontend" | "backend" | "requirement" | "doc";
  position: { x: number; y: number };
  data: {
    title: string;
    summary?: string;
    tags?: string[];
    stackHint?: string;
  };
};

type SerializableWorkspaceEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
};

function toFlowNodes(nodes: SerializableWorkspaceNode[]): Node[] {
  const hasRoot = nodes.some((node) => node.type === "root");
  const source = hasRoot ? nodes : [...nodes, DEFAULT_WORKSPACE_NODE as SerializableWorkspaceNode];

  return source.map((workspaceNode) => {
    const isRoot = workspaceNode.type === "root";
    if (isRoot) {
      const rootData = workspaceNode.data || {};
      return {
        id: workspaceNode.id,
        type: "center",
        position: workspaceNode.position || { x: 0, y: 0 },
        draggable: false,
        selectable: false,
        data: {
          label: rootData.title || "Welcome to Strukt",
          description:
            rootData.summary ||
            "This blank canvas is yours. Click the button below to add your first node and start mapping your architecture.",
          icon: (rootData as any).icon,
          buttonText: (rootData as any).buttonText || "Connect your Git or Wiki",
          secondaryButtonText: (rootData as any).secondaryButtonText || "Create your first node",
        },
      } as Node<CenterNodeData>;
    }

    const nodeData = workspaceNode.data || {};
    return {
      id: workspaceNode.id,
      type: "custom",
      position: workspaceNode.position || { x: 0, y: 0 },
      data: {
        label: nodeData.title || workspaceNode.id,
        summary: nodeData.summary,
        tags: Array.isArray(nodeData.tags) ? nodeData.tags : [],
        stackHint: nodeData.stackHint,
        type: workspaceNode.type,
        cards: [],
      },
    } as Node<CustomNodeData>;
  });
}

function toFlowEdges(edges: SerializableWorkspaceEdge[], nodeIds?: Set<string>): Edge[] {
  if (!edges || edges.length === 0) {
    return [];
  }
  return edges
    .filter((edge) => {
      if (!edge.source || !edge.target) return false;
      if (nodeIds && nodeIds.size > 0) {
        return nodeIds.has(edge.source) && nodeIds.has(edge.target);
      }
      return true;
    })
    .map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: "custom",
      data: {
        label: edge.label,
      },
    }));
}

function serializeNode(node: Node): SerializableWorkspaceNode | null {
  const position = node.position || { x: 0, y: 0 };
  const data = (node.data || {}) as any;

  const isCenter = node.id === "center" || node.type === "center";
  const type: SerializableWorkspaceNode["type"] = isCenter
    ? "root"
    : typeof data.type === "string"
    ? (data.type as SerializableWorkspaceNode["type"])
    : "requirement";

  const title =
    (typeof data.label === "string" && data.label.trim().length > 0 && data.label) ||
    (typeof data.title === "string" && data.title.trim().length > 0 && data.title) ||
    (isCenter ? "Project Root" : `Node ${node.id}`);

  const summary =
    typeof data.summary === "string"
      ? data.summary
      : isCenter && typeof data.description === "string"
      ? data.description
      : undefined;

  const tags = Array.isArray(data.tags) ? (data.tags as string[]) : undefined;

  return {
    id: node.id,
    type,
    position: {
      x: Number.isFinite(position.x) ? position.x : 0,
      y: Number.isFinite(position.y) ? position.y : 0,
    },
    data: {
      title,
      summary,
      tags,
      stackHint: typeof data.stackHint === "string" ? data.stackHint : undefined,
    },
  };
}

function serializeEdge(edge: Edge): SerializableWorkspaceEdge | null {
  if (!edge.source || !edge.target) {
    return null;
  }
  const labelCandidate = (edge as any)?.label ?? (edge.data as any)?.label;
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: typeof labelCandidate === "string" ? labelCandidate : undefined,
  };
}

function buildWorkspaceUpdatePayload(
  name: string,
  nodes: Node[],
  edges: Edge[]
): { name: string; nodes: SerializableWorkspaceNode[]; edges: SerializableWorkspaceEdge[] } {
  let serializedNodes = nodes
    .map(serializeNode)
    .filter((node): node is SerializableWorkspaceNode => Boolean(node));
  const rootNodes = serializedNodes.filter((node) => node.type === "root");

  if (rootNodes.length > 1) {
    const [, ...duplicates] = rootNodes;
    const duplicateIds = new Set(duplicates.map((node) => node.id));
    serializedNodes = serializedNodes.filter((node) => !duplicateIds.has(node.id));
  } else if (rootNodes.length === 0) {
    const fallbackCenter = nodes.find(
      (node) => node?.type === "center" || node?.type === "root" || node?.id === "center"
    );
    const serializedCenter = fallbackCenter ? serializeNode(fallbackCenter) : null;
    if (serializedCenter && serializedCenter.type === "root") {
      serializedNodes = [serializedCenter, ...serializedNodes];
    }
  }

  const serializedEdges = edges
    .map(serializeEdge)
    .filter((edge): edge is SerializableWorkspaceEdge => Boolean(edge));
  return {
    name,
    nodes: serializedNodes,
    edges: serializedEdges,
  };
}
const nodeTypes: NodeTypes = {
  custom: CustomNode,
  center: CenterNode,
};

const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};

const LAYOUT_VERSION_KEY = "flowforge-layout-version";
const CURRENT_LAYOUT_VERSION = "radial-v2";
const RESET_WORKSPACE_ON_LOAD = (import.meta as any)?.env?.VITE_RESET_WORKSPACE_ON_LOAD !== "false";

const haveDimensionsChanged = (prev = {}, next = {}) => {
  const prevKeys = Object.keys(prev);
  const nextKeys = Object.keys(next);
  if (prevKeys.length !== nextKeys.length) {
    return true;
  }
  for (const key of nextKeys) {
    const prevValue = prev[key];
    const nextValue = next[key];
    if (!prevValue) {
      return true;
    }
    // 1px tolerance to avoid re-layout due to measurement jitter
    const dw = Math.abs((prevValue.width ?? 0) - (nextValue.width ?? 0));
    const dh = Math.abs((prevValue.height ?? 0) - (nextValue.height ?? 0));
    if (dw > 1 || dh > 1) {
      return true;
    }
  }
  return false;
};

const buildPositionMap = (nodes: Node[]) => {
  const map: Record<string, { x: number; y: number }> = {};
  nodes.forEach((node) => {
    if (!node?.id) return;
    const { x = 0, y = 0 } = node?.position || {};
    map[node.id] = { x: Math.round(x), y: Math.round(y) };
  });
  return map;
};

const didCanonicalPositionsChange = (
  previous: Record<string, { x: number; y: number }> | null | undefined,
  next: Record<string, { x: number; y: number }>
) => {
  if (!previous) return true;
  const prevKeys = Object.keys(previous);
  const nextKeys = Object.keys(next);
  if (prevKeys.length !== nextKeys.length) {
    return true;
  }
  for (const key of nextKeys) {
    const prevPos = previous[key];
    const nextPos = next[key];
    if (!prevPos || prevPos.x !== nextPos.x || prevPos.y !== nextPos.y) {
      return true;
    }
  }
  return false;
};

const DEFAULT_CARD_WIDTH = 280;
const DEFAULT_CARD_HEIGHT = 200;
const MAX_CARD_HEIGHT_CAP = 720;
const DEFAULT_CARD_HEIGHT_CAP = 640;
const CARD_HEIGHT_MARGIN = 48;

const parseDimensionValue = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
};

const getNodeSizeEstimate = (
  node: Node,
  dimensions?: Record<string, { width: number; height: number }>
) => {
  const fromMap = dimensions?.[node.id];
  if (fromMap) {
    const width = parseDimensionValue(fromMap.width) ?? DEFAULT_CARD_WIDTH;
    const height = parseDimensionValue(fromMap.height) ?? DEFAULT_CARD_HEIGHT;
    return {
      width: Math.max(1, Math.round(width)),
      height: Math.max(1, Math.round(height)),
    };
  }

  const width =
    parseDimensionValue((node as any).width) ??
    parseDimensionValue(node.style?.width) ??
    DEFAULT_CARD_WIDTH;
  const height =
    parseDimensionValue((node as any).height) ??
    parseDimensionValue(node.style?.height) ??
    DEFAULT_CARD_HEIGHT;

  return {
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
  };
};

const rangesOverlap = (aStart: number, aEnd: number, bStart: number, bEnd: number) =>
  Math.max(aStart, bStart) <= Math.min(aEnd, bEnd);

const computeNodeHeightCaps = (
  nodes: Node[],
  dimensions?: Record<string, { width: number; height: number }>
): Record<string, number> => {
  const boxes = nodes.map((node) => {
    const { width, height } = getNodeSizeEstimate(node, dimensions);
    const left = node.position?.x ?? 0;
    const top = node.position?.y ?? 0;
    return {
      id: node.id,
      type: node.type,
      left,
      top,
      right: left + width,
      bottom: top + height,
      width,
      height,
    };
  });

  const caps: Record<string, number> = {};

  boxes.forEach((box) => {
    if (box.type !== "custom") {
      return;
    }

    const overlappingBelow = boxes.filter((other) => {
      if (other.id === box.id) return false;
      if (!rangesOverlap(box.left, box.right, other.left, other.right)) return false;
      return other.top >= box.top;
    });

    let limit = MAX_CARD_HEIGHT_CAP;
    overlappingBelow.forEach((other) => {
      limit = Math.min(limit, other.top - box.top - CARD_HEIGHT_MARGIN);
    });

    if (!Number.isFinite(limit)) {
      limit = DEFAULT_CARD_HEIGHT_CAP;
    }

    limit = Math.max(220, Math.min(MAX_CARD_HEIGHT_CAP, limit));
    caps[box.id] = limit;
  });

  return caps;
};

const annotateNodesWithHeightCaps = (
  nodes: Node[],
  dimensions?: Record<string, { width: number; height: number }>
) => {
  if (!nodes || nodes.length === 0) return nodes;
  const capMap = computeNodeHeightCaps(nodes, dimensions);
  return nodes.map((node) => {
    if (node.type !== "custom") return node;
    const cap = capMap[node.id];
    if (!cap || !Number.isFinite(cap)) return node;
    return {
      ...node,
      data: {
        ...(node.data || {}),
        maxNodeHeight: cap,
      },
    };
  });
};

const initialNodes = [
  {
    id: "center",
    type: "center",
    position: { x: 0, y: 0 },
    style: { width: 360, height: 240 },
    draggable: false,
    selectable: false,
    data: {
      label: "Welcome to Strukt",
      description: "Describe the mission for this workspace so every node orbits the same north star.",
      icon: "🧭",
      link: "",
      buttonText: "Launch AI Blueprint Wizard",
      secondaryButtonText: "Create Your First Node",
      // buttonAction will be added dynamically in nodesWithCallbacks
    } as CenterNodeData,
    positionAbsolute: { x: 0, y: 0 },
  },
];

const initialEdges: Edge[] = [];

// Migration function: convert old handle IDs to new format
const migrateEdgeHandles = (edges: Edge[]): Edge[] => {
  const oldToNewHandleMap: Record<string, string> = {
    'top': 'top-target',
    'right': 'right-target',
    'bottom': 'bottom-target',
    'left': 'left-target',
  };

  return edges.map(edge => {
    let updated = { ...edge };
    
    // Migrate targetHandle if it's in old format
    if (edge.targetHandle && oldToNewHandleMap[edge.targetHandle]) {
      updated = { ...updated, targetHandle: oldToNewHandleMap[edge.targetHandle] };
    }
    
    // Migrate sourceHandle if needed (source handles might also be old format)
    if (edge.sourceHandle) {
      const sourceHandleNewFormat = edge.sourceHandle.replace(/^(top|right|bottom|left)$/, (match: string) => `${match}-source`);
      if (sourceHandleNewFormat !== edge.sourceHandle) {
        updated = { ...updated, sourceHandle: sourceHandleNewFormat };
      }
    }
    
    return updated;
  });
};

function FlowCanvas() {
  const [nodes, setNodesInternal, onNodesChangeInternal] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(migrateEdgeHandles(initialEdges));
  
  // Safe wrapper for setNodes that validates node structure
  const setNodes = useCallback((updater: any) => {
    setNodesInternal((prevNodes) => {
      const newNodes = typeof updater === 'function' ? updater(prevNodes) : updater;
      // Validate all nodes have required structure
      const validatedNodes = newNodes.map((node: any) => {
        if (!node || !node.id) {
          console.error('Attempted to set invalid node:', node);
          return null;
        }
        if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
          console.error('Node with invalid position:', node);
          return {
            ...node,
            position: { x: 0, y: 0 },
          };
        }
        return node;
      }).filter(Boolean); // Remove null nodes
      
      return validatedNodes;
    });
  }, [setNodesInternal]);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAddNodeModalOpen, setIsAddNodeModalOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isAISuggestPanelOpen, setIsAISuggestPanelOpen] = useState(false);
  const [isSpecContextDialogOpen, setIsSpecContextDialogOpen] = useState(false);
  const [isSaveLoadDialogOpen, setIsSaveLoadDialogOpen] = useState(false);
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<{ nodeId: string; card: EditableCardData } | null>(null);
  const [saveLoadMode, setSaveLoadMode] = useState<"save" | "load">("save");
  const [workspaceName, setWorkspaceName] = useState(() => {
    if (typeof window === "undefined") return "My Workspace";
    return localStorage.getItem(WORKSPACE_NAME_STORAGE_KEY) || "My Workspace";
  });
  const [workspaceId, setWorkspaceId] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_WORKSPACE_ID;
    return localStorage.getItem(WORKSPACE_ID_STORAGE_KEY) || DEFAULT_WORKSPACE_ID;
  });
  const [isWorkspaceReady, setIsWorkspaceReady] = useState(false);
  const [workspaceLoadError, setWorkspaceLoadError] = useState<string | null>(null);
  const [wizardSessionId, setWizardSessionId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(true);
  const [nodeTypeToAdd, setNodeTypeToAdd] = useState<string | undefined>();
  const [edgePosition, setEdgePosition] = useState<{ x: number; y: number } | null>(null);
  const [dragSourceNodeId, setDragSourceNodeId] = useState<string | null>(null);
  const [dragPreview, setDragPreview] = useState<{ 
    start: { x: number; y: number }; 
    end: { x: number; y: number } 
  } | null>(null);
  const [isAutoLayouting, setIsAutoLayouting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPlacingNode, setIsPlacingNode] = useState(false);
  const [isUserDragging, setIsUserDragging] = useState(false);
  const [placingNodeInfo, setPlacingNodeInfo] = useState<{
    nodeId: string;
    startPos: { x: number; y: number };
  } | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardInitialPrompt, setWizardInitialPrompt] = useState<string | null>(null);
  const [pendingWizardPrompt, setPendingWizardPrompt] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isKeyboardShortcutsOpen, setIsKeyboardShortcutsOpen] = useState(false);
  const [isEditingText, setIsEditingText] = useState(false);
const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
const [canvasContextMenu, setCanvasContextMenu] = useState<{
  isOpen: boolean;
  position: { x: number; y: number };
}>({ isOpen: false, position: { x: 0, y: 0 } });
const [nodeContextMenu, setNodeContextMenu] = useState<{
  isOpen: boolean;
  position: { x: number; y: number };
  nodeId: string | null;
}>({ isOpen: false, position: { x: 0, y: 0 }, nodeId: null });
const [isAIEnrichmentModalOpen, setIsAIEnrichmentModalOpen] = useState(false);
  const [enrichmentNodeId, setEnrichmentNodeId] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [edgeToReplace, setEdgeToReplace] = useState<{ id: string; targetNodeId?: string } | null>(null);
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false);
  const [isBulkTagEditorOpen, setIsBulkTagEditorOpen] = useState(false);
  const [isBulkTypeEditorOpen, setIsBulkTypeEditorOpen] = useState(false);
  const [isSelectByCriteriaOpen, setIsSelectByCriteriaOpen] = useState(false);
  const [isTemplateGalleryOpen, setIsTemplateGalleryOpen] = useState(false);
  const [isSaveTemplateDialogOpen, setIsSaveTemplateDialogOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [isSnapshotsPanelOpen, setIsSnapshotsPanelOpen] = useState(false);
  const [isRelationshipsPanelOpen, setIsRelationshipsPanelOpen] = useState(false);
  const [isConnectSourcesOpen, setIsConnectSourcesOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"radial" | "process">("radial");
  const [showDomainRings, setShowDomainRings] = useState(true);
  const [suggestionPanelRefresh, setSuggestionPanelRefresh] = useState(0);
  const [isSuggestionPanelOpen, setIsSuggestionPanelOpen] = useState(false);
  const centerNodeIdRef = useRef<string>("center");
  const isCenterNode = useCallback(
    (node: { id?: string; type?: string } | null | undefined) =>
      Boolean(node && (node.type === "center" || node.id === centerNodeIdRef.current)),
    []
  );
const [edgeContextMenu, setEdgeContextMenu] = useState<{
  isOpen: boolean;
  position: { x: number; y: number };
  edgeId: string | null;
  relationshipType?: RelationshipType;
}>({ isOpen: false, position: { x: 0, y: 0 }, edgeId: null });
const lastPersistedWorkspaceNameRef = useRef<string>("");

const hasCustomNodes = useMemo(
  () => nodes.some((node) => node.type !== "center"),
  [nodes]
);

const openWizard = useCallback(
  (prompt?: string | null) => {
    setWizardInitialPrompt(prompt ?? null);
    setPendingWizardPrompt(null);
    setIsWizardOpen(true);
  },
  []
);

const openQuickAddModal = useCallback(
  (options?: {
    type?: string;
    prompt?: string;
    position?: { x: number; y: number } | null;
    sourceNodeId?: string | null;
    edgeToReplace?: { id: string; targetNodeId?: string } | null;
  }) => {
    setNodeTypeToAdd(options?.type);
    setEdgePosition(options?.position ?? null);
    setDragSourceNodeId(options?.sourceNodeId ?? null);
    setEdgeToReplace(options?.edgeToReplace ?? null);
    setPendingWizardPrompt(options?.prompt ?? null);
    setIsAddNodeModalOpen(true);
  },
  []
);

const launchNodeCreator = useCallback(
  (options?: {
    type?: string;
    prompt?: string;
    position?: { x: number; y: number } | null;
    sourceNodeId?: string | null;
    edgeToReplace?: { id: string; targetNodeId?: string } | null;
    forceWizard?: boolean;
  }) => {
    if (!hasCustomNodes || options?.forceWizard) {
      openWizard(options?.prompt ?? pendingWizardPrompt ?? null);
      return;
    }

    openQuickAddModal({
      type: options?.type,
      prompt: options?.prompt,
      position: options?.position ?? null,
      sourceNodeId: options?.sourceNodeId ?? null,
      edgeToReplace: options?.edgeToReplace ?? null,
    });
  },
  [hasCustomNodes, openQuickAddModal, openWizard, pendingWizardPrompt]
);

const handleAddNodeFromSidebar = useCallback(
  (type: string) => {
    launchNodeCreator({ type });
  },
  [launchNodeCreator]
);

const handleAddNodeFromEdge = useCallback(
  (x: number, y: number, sourceNodeId?: string, targetNodeId?: string, originalEdgeId?: string) => {
    launchNodeCreator({
      position: { x, y },
      sourceNodeId: sourceNodeId ?? null,
      edgeToReplace: originalEdgeId ? { id: originalEdgeId, targetNodeId } : null,
    });
  },
  [launchNodeCreator]
);

const handleSwitchToWizard = useCallback(
  (prompt?: string) => {
    setIsAddNodeModalOpen(false);
    openWizard(prompt ?? pendingWizardPrompt ?? null);
  },
  [openWizard, pendingWizardPrompt]
);

  const bootstrapWorkspace = useCallback(async () => {
    if (isWorkspaceReady) {
      return;
    }
    try {
      const storedId = typeof window !== "undefined" ? localStorage.getItem(WORKSPACE_ID_STORAGE_KEY) : null;
      const storedName = typeof window !== "undefined" ? localStorage.getItem(WORKSPACE_NAME_STORAGE_KEY) : null;

      const workspaces = await workspacesAPI.list();
      const byId = storedId ? workspaces.find((workspace) => workspace._id === storedId) : undefined;
      const byName = storedName ? workspaces.find((workspace) => workspace.name === storedName) : undefined;

      let active: Workspace | undefined = byId || byName;
      if (!active && workspaces.length > 0) {
        active = workspaces[0];
      }

      if (!active) {
        const existingNames = new Set(workspaces.map((workspace) => workspace.name));
        const name = generateWorkspaceName(existingNames);
        active = await workspacesAPI.create(buildDefaultWorkspacePayload(name));
      }

      if (!active) {
        throw new Error("Workspace bootstrap returned no workspace");
      }

      const resolvedId = active._id || DEFAULT_WORKSPACE_ID;
      const resolvedName = active.name || "My Workspace";
      setWorkspaceId(resolvedId);
      setWorkspaceName(resolvedName);
      lastPersistedWorkspaceNameRef.current = resolvedName;
      let flowNodes = toFlowNodes((active.nodes as unknown as SerializableWorkspaceNode[]) || []);
      const centerFromNodes = flowNodes.find((node) => node?.type === "center");
      if (centerFromNodes?.id) {
        centerNodeIdRef.current = centerFromNodes.id;
      } else {
        centerNodeIdRef.current = "center";
      }
      let nodeIdSet = new Set(flowNodes.map((node) => node.id));
      let flowEdges = toFlowEdges((active.edges as unknown as SerializableWorkspaceEdge[]) || [], nodeIdSet);

      if (RESET_WORKSPACE_ON_LOAD && flowNodes.length > 1) {
        const centerNode =
          flowNodes.find((node) => node?.type === "center") ??
          toFlowNodes([DEFAULT_WORKSPACE_NODE as SerializableWorkspaceNode]).find((node) => node?.type === "center");
        flowNodes = centerNode ? [centerNode] : [];
        nodeIdSet = new Set(flowNodes.map((node) => node.id));
        flowEdges = [];
      }

      if (flowNodes.length === 0) {
        flowNodes = toFlowNodes([DEFAULT_WORKSPACE_NODE as SerializableWorkspaceNode]);
        nodeIdSet = new Set(flowNodes.map((node) => node.id));
      }
      setEdges(flowEdges);
      setNodes(flowNodes as any);
      historyManager.current.initialize({ nodes: flowNodes, edges: flowEdges });
      setCanUndo(historyManager.current.canUndo());
      setCanRedo(historyManager.current.canRedo());

      const baselineSnapshot = buildWorkspaceUpdatePayload(resolvedName, flowNodes, flowEdges);
      lastPersistSnapshotRef.current = JSON.stringify(baselineSnapshot);
      setIsSaved(true);

      if (typeof window !== "undefined") {
        localStorage.setItem(WORKSPACE_ID_STORAGE_KEY, resolvedId);
        localStorage.setItem(WORKSPACE_NAME_STORAGE_KEY, resolvedName);
      }
      setWorkspaceLoadError(null);
      setIsWorkspaceReady(true);
    } catch (error) {
      console.error("Failed to bootstrap workspace", error);
      if (!workspaceLoadError) {
        toast.error("Couldn't load your workspace", {
          description: "Check your connection and try again.",
        });
      }
      setWorkspaceLoadError("failed");
      setIsWorkspaceReady(true);
    }
  }, [isWorkspaceReady, workspaceLoadError]);

  useEffect(() => {
    bootstrapWorkspace();
  }, [bootstrapWorkspace]);

  const persistWorkspace = useCallback(
    async (options?: { renameTo?: string; toastOnSuccess?: boolean; force?: boolean }) => {
      if (!isWorkspaceReady || !workspaceId) {
        return;
      }

      const desiredName =
        typeof options?.renameTo === "string" ? options.renameTo.trim() : workspaceName;
      if (!desiredName) {
        return;
      }

      const payload = buildWorkspaceUpdatePayload(desiredName, nodes, edges);
      const snapshot = JSON.stringify({
        name: desiredName,
        nodes: payload.nodes,
        edges: payload.edges,
      });

      if (!options?.force && !options?.renameTo && snapshot === lastPersistSnapshotRef.current) {
        return;
      }

      if (isPersistingWorkspaceRef.current) {
        return;
      }

      isPersistingWorkspaceRef.current = true;
      const previousName =
        lastPersistedWorkspaceNameRef.current || workspaceName;

      try {
        const updated = await workspacesAPI.update(previousName, payload);
        lastPersistSnapshotRef.current = snapshot;
        setIsSaved(true);
        setWorkspaceLoadError(null);

        const resolvedName = updated?.name || desiredName;
        const resolvedId = updated?._id || workspaceId;

        if (options?.renameTo) {
          setWorkspaceName(resolvedName);
        }
        lastPersistedWorkspaceNameRef.current = resolvedName;
       setWorkspaceId(resolvedId);

       if (typeof window !== "undefined") {
         localStorage.setItem(WORKSPACE_NAME_STORAGE_KEY, resolvedName);
         localStorage.setItem(WORKSPACE_ID_STORAGE_KEY, resolvedId);
       }

        if (options?.toastOnSuccess) {
          toast.success("Workspace saved", {
            description: `Saved as "${resolvedName}"`,
          });
        }
      } catch (error: any) {
        console.error("Failed to persist workspace", error);
        const message =
          error?.response?.message ||
          error?.message ||
          "Unable to save workspace right now.";
        toast.error("Failed to save workspace", {
          description: typeof message === "string" ? message : undefined,
        });
        throw error;
      } finally {
        isPersistingWorkspaceRef.current = false;
      }
    },
    [edges, isWorkspaceReady, nodes, workspaceId, workspaceName]
  );

  useEffect(() => {
    if (!selectedNodeId) return;
    if (!nodes.some((node) => node.id === selectedNodeId)) {
      setSelectedNodeId(null);
    }
  }, [nodes, selectedNodeId]);

  const reactFlowInstance = useReactFlow();
  const historyManager = useRef(new HistoryManager(50));
  const isUndoRedoAction = useRef(false);
  // Track connection lifecycle to decide between edge vs new node
  const connectStartInfoRef = useRef<{ nodeId: string | null; handleId?: string | null } | null>(null);
  const didConnectRef = useRef(false);
  const lastAutoSnapshotTime = useRef<number>(0);
  const autoLayoutOnLoadRef = useRef<boolean>(false);
  const nodeDimensionsRef = useRef<Record<string, { width: number; height: number }>>({});
  const [dimensionVersion, setDimensionVersion] = useState(0);
  const initialCenterFitRef = useRef(false);
  const persistTimeoutRef = useRef<number | null>(null);
  const lastPersistSnapshotRef = useRef<string | null>(null);
  const isPersistingWorkspaceRef = useRef(false);
  const layoutDebug = useMemo(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('layoutDebug') === '1';
      const env = (import.meta as any)?.env?.VITE_LAYOUT_DEBUG === 'on';
      return q || env;
    } catch {
      return false;
    }
  }, []);

  // Optional d3-force relaxer behind VITE_FEATURE_D3_RELAX (default off)
  const maybeD3Relax = useCallback(async (nodesIn: Node[]): Promise<Node[]> => {
    try {
      const flag = (import.meta as any)?.env?.VITE_FEATURE_D3_RELAX;
      if (!flag || String(flag).toLowerCase() === 'off') return nodesIn;
      const mod = await import('./utils/d3Relax');
      return await mod.relaxLayoutWithD3(nodesIn as any, [] as any, { maxTicks: 100 });
    } catch {
      return nodesIn;
    }
  }, []);

  // --- Layout + Relaxation Orchestrator ---
  const [relaxPadding, setRelaxPadding] = useState(12);
  // Pinned nodes that should not be moved by radial base layout or relaxor
  const pinnedRef = useRef<Set<string>>(new Set());
  const reactFlowWrapperRef = useRef<HTMLDivElement | null>(null);
  const lastRadialBaseRef = useRef<Record<string, { x: number; y: number }> | null>(null);
  const clearPins = useCallback(() => {
    pinnedRef.current.clear();
  }, []);
  const recordRadialBaseline = useCallback((layoutNodes: Node[]) => {
    lastRadialBaseRef.current = buildPositionMap(layoutNodes);
  }, []);
  const hasRadialBaselineChanged = useCallback((layoutNodes: Node[]) => {
    const nextMap = buildPositionMap(layoutNodes);
    return didCanonicalPositionsChange(lastRadialBaseRef.current, nextMap);
  }, []);
  const relaxRetryRef = useRef(0);
  const relaxCooldownRef = useRef<number>(0);
  const layoutCooldownRef = useRef<number>(0);

  const waitTwoFrames = useCallback(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }), []);

  const applyLayoutAndRelax = useCallback(async (
    baseNodes: Node[],
    {
      padding = 12,
      maxPasses = 10,
      fit = true,
      fixedIds = [],
    }: { padding?: number; maxPasses?: number; fit?: boolean; fixedIds?: string[] }
  ) => {
    layoutCooldownRef.current = Date.now();
    if (!reactFlowInstance) return;
    const centerId = centerNodeIdRef.current || "center";

    // 1) Set base positions
    setNodes(baseNodes);
    // Ensure internals refreshed for measurement
    try {
      reactFlowInstance.updateNodeInternals(baseNodes.map(n => n.id));
    } catch {}

    // 2) Wait for React Flow to measure nodes
    await waitTwoFrames();

  // 3) Fetch fresh nodes with width/height populated
    let fresh = typeof reactFlowInstance.getNodes === 'function' ? (reactFlowInstance.getNodes() as Node[]) : baseNodes;

    // If any node still lacks size, retry once after ~16ms
    const missingSize = fresh.some((n) => !isCenterNode(n) && (!n.width || !n.height));
    if (missingSize) {
      // eslint-disable-next-line no-console
      console.debug('[layout] sizes not ready; retrying measurement in 16ms');
      await new Promise(r => setTimeout(r, 16));
      fresh = typeof reactFlowInstance.getNodes === 'function' ? (reactFlowInstance.getNodes() as Node[]) : baseNodes;
    }

    const dimensionSnapshot: Record<string, { width: number; height: number }> = {};
    fresh.forEach((node) => {
      const width =
        parseDimensionValue(node.width) ??
        parseDimensionValue(node.style?.width) ??
        DEFAULT_CARD_WIDTH;
      const height =
        parseDimensionValue(node.height) ??
        parseDimensionValue(node.style?.height) ??
        DEFAULT_CARD_HEIGHT;
      dimensionSnapshot[node.id] = {
        width: Math.max(1, Math.round(width)),
        height: Math.max(1, Math.round(height)),
      };
    });

    // 4) Run deterministic collision resolver using graph units (no DOM)
    // Always keep center + any pinned nodes fixed during relaxation
    const pinnedFromNodes = baseNodes.filter(n => (n as any)?.data?.pinned).map(n => n.id);
    const fixedSet = Array.from(new Set<string>([centerId, ...fixedIds, ...pinnedFromNodes]));

    // Dev visibility
    if (process.env.NODE_ENV !== 'production') {
      const c0 = baseNodes.find(isCenterNode)?.position;
      console.debug('[layout] fixedIds:', fixedSet, 'center@', c0);
    }

    const info = resolveCollisions(fresh as any, {
      padding,
      maxPasses,
      measure: nodeDimensionsRef.current,
      fixedIds: fixedSet,
    });
    if (info.pendingMeasurement && relaxRetryRef.current < 3) {
      relaxRetryRef.current += 1;
      // Try again on next tick
      await waitTwoFrames();
      return applyLayoutAndRelax(baseNodes, { padding, maxPasses, fit, fixedIds });
    }
    relaxRetryRef.current = 0;

    // 5) Log movement stats when debugging layout
    if (layoutDebug) {
      // Retain optional debug hook without spamming console in production
      if (typeof window !== "undefined" && window?.localStorage?.getItem("layoutVerbose") === "1") {
        // eslint-disable-next-line no-console
        console.log(`[layout] relax moved ${info.movedCount}/${fresh.length}`);
      }
    }

    // 6) Apply relaxed positions and refresh
    let nextNodes = info.nodes as any;
    // Restore center position from base to guarantee it never budges
    const centerFromBase = baseNodes.find(isCenterNode);
    if (centerFromBase) {
      nextNodes = nextNodes.map((n: any) =>
        isCenterNode(n)
          ? { ...n, position: centerFromBase.position }
          : n
      );
    }
    nextNodes = annotateNodesWithHeightCaps(nextNodes, dimensionSnapshot) as any;
    setNodes(nextNodes);
    try {
      reactFlowInstance.updateNodeInternals(nextNodes.map((n: any) => n.id));
    } catch {}

    // 7) Fit and draw debug overlay if enabled
    if (fit) {
      try { reactFlowInstance.fitView({ padding: 0.2, duration: 300 }); } catch {}
      if (layoutDebug) requestAnimationFrame(() => devOutlineCollisions(padding));
    }

    // 8) Update edges after positions change
  setEdges((prevEdges) => updateEdgesWithOptimalHandles(nextNodes as any, prevEdges, centerId));

    // 9) Re-measure for subsequent operations
    window.requestAnimationFrame(() => refreshDimensions());
  }, [reactFlowInstance, setNodes, setEdges, layoutDebug, waitTwoFrames, relaxPadding, isCenterNode]);

  // Relax-only pass that respects pinnedRef (and center) without recomputing base layout
  const relaxRespectingPins = useCallback(async (
    nodesIn: Node[],
    { padding = relaxPadding, maxPasses = 6 }: { padding?: number; maxPasses?: number }
  ) => {
    if (!reactFlowInstance) return;
    const centerId = centerNodeIdRef.current || "center";
    const now = Date.now();
    if (now - relaxCooldownRef.current < 350) {
      return;
    }
    relaxCooldownRef.current = now;

    // Apply current positions as base
    setNodes(nodesIn);
    try { reactFlowInstance.updateNodeInternals(nodesIn.map((n) => n.id)); } catch {}

    // Wait for measurement to stabilize
    await waitTwoFrames();
    let fresh = typeof reactFlowInstance.getNodes === 'function' ? (reactFlowInstance.getNodes() as Node[]) : nodesIn;

    const dimensionSnapshot: Record<string, { width: number; height: number }> = {};
    fresh.forEach((node) => {
      const width =
        parseDimensionValue(node.width) ??
        parseDimensionValue(node.style?.width) ??
        DEFAULT_CARD_WIDTH;
      const height =
        parseDimensionValue(node.height) ??
        parseDimensionValue(node.style?.height) ??
        DEFAULT_CARD_HEIGHT;
      dimensionSnapshot[node.id] = {
        width: Math.max(1, Math.round(width)),
        height: Math.max(1, Math.round(height)),
      };
    });

    // Mark pinned from ref
    const withPins = fresh.map((n) =>
      pinnedRef.current.has(n.id) ? ({ ...n, data: { ...(n.data || {}), pinned: true } } as Node) : n
    );

    if (process.env.NODE_ENV !== 'production') {
      console.debug('[layout] calling relax', { fit: false, padding, pinned: Array.from(pinnedRef.current) });
    }
    const info = resolveCollisions(withPins as any, {
      padding,
      maxPasses,
      measure: nodeDimensionsRef.current,
      fixedIds: [centerId, ...Array.from(pinnedRef.current)],
    });

    // Ensure integer positions to avoid sub-pixel measurement jitter
    const snapped = (info.nodes as any).map((n: any) => ({ ...n, position: { x: Math.round(n.position?.x ?? 0), y: Math.round(n.position?.y ?? 0) } }))
    const annotated = annotateNodesWithHeightCaps(snapped as any, dimensionSnapshot) as any;
    setNodes(annotated);
    try { reactFlowInstance.updateNodeInternals(annotated.map((n: any) => n.id)); } catch {}
    setEdges((prevEdges) => updateEdgesWithOptimalHandles(annotated as any, prevEdges, centerId));
    window.requestAnimationFrame(() => refreshDimensions());
  }, [reactFlowInstance, setNodes, setEdges, waitTwoFrames, relaxPadding]);

  // Safe wrapper for onNodesChange with validation
  const onNodesChange = useCallback((changes: any[]) => {
    try {
      onNodesChangeInternal(changes);
    } catch (error) {
      console.error('Error in onNodesChange:', error);
      // Silently fail to prevent crashes
    }
  }, [onNodesChangeInternal]);

  // Ensure center node is always non-draggable and non-selectable, even when nodes are loaded/restored
  useEffect(() => {
    const centerNode = nodes.find((n) => n?.type === "center" || n?.id === centerNodeIdRef.current);
    if (centerNode) {
      centerNodeIdRef.current = centerNode.id;
    }
  }, [nodes]);

  useEffect(() => {
    setNodes((nds) => {
      let changed = false;
      const next = nds.map((n) => {
        if (!(n?.type === "center" || n.id === centerNodeIdRef.current)) return n;
        const d = n as any;
        const shouldUpdate = d.draggable !== false || d.selectable !== false;
        if (shouldUpdate) {
          changed = true;
          return { ...n, draggable: false, selectable: false } as any;
        }
        return n;
      });
      return changed ? next : nds;
    });
  }, [setNodes, nodes.length]);

  // Safe wrapper for onEdgesChange with validation
  const onEdgesChange = useCallback((changes: any[]) => {
    try {
      onEdgesChangeInternal(changes);
    } catch (error) {
      console.error('Error in onEdgesChange:', error);
      // Silently fail to prevent crashes
    }
  }, [onEdgesChangeInternal]);

  function refreshDimensions() {
    if (!reactFlowInstance) return;
    const measuredNodes = typeof reactFlowInstance.getNodes === 'function'
      ? (reactFlowInstance.getNodes() as Node[])
      : [];

    if (!Array.isArray(measuredNodes) || measuredNodes.length === 0) {
      return;
    }

    const next = measureNodes(measuredNodes);

    if (Object.keys(next).length === 0) {
      return;
    }

    if (haveDimensionsChanged(nodeDimensionsRef.current, next)) {
      nodeDimensionsRef.current = next;
      setDimensionVersion((version) => version + 1);
    }
  }

  const allNodesMeasured = useMemo(() => {
    if (!nodes || nodes.length === 0) {
      return false;
    }
    const centerId = centerNodeIdRef.current;
    return nodes.every((node) => {
      if (node.type === "center" || node.id === centerId) return true;
      const entry = nodeDimensionsRef.current[node.id];
      return entry && entry.width && entry.height;
    });
  }, [nodes, dimensionVersion]);

  useEffect(() => {
    if (!nodeContextMenu.isOpen || !nodeContextMenu.nodeId) return;
    const exists = nodes.some((n) => n.id === nodeContextMenu.nodeId);
    if (!exists) {
      setNodeContextMenu({ isOpen: false, position: { x: 0, y: 0 }, nodeId: null });
    }
  }, [nodeContextMenu, nodes]);

  const activeContextNode = useMemo(() => {
    if (!nodeContextMenu.isOpen || !nodeContextMenu.nodeId) return null;
    return nodes.find((n) => n.id === nodeContextMenu.nodeId) || null;
  }, [nodeContextMenu, nodes]);

  // Undo handler
  const handleUndo = useCallback(() => {
    const previousState = historyManager.current.undo();
    if (previousState) {
      isUndoRedoAction.current = true;
      setNodes(previousState.nodes);
      setEdges(previousState.edges);
      setCanUndo(historyManager.current.canUndo());
      setCanRedo(historyManager.current.canRedo());
      toast.success("Undone", {
        description: "Canvas restored to previous state",
      });
    } else {
      toast.info("Nothing to undo");
    }
  }, [setNodes, setEdges]);

  // Redo handler
  const handleRedo = useCallback(() => {
    const nextState = historyManager.current.redo();
    if (nextState) {
      isUndoRedoAction.current = true;
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setCanUndo(historyManager.current.canUndo());
      setCanRedo(historyManager.current.canRedo());
      toast.success("Redone", {
        description: "Canvas restored to next state",
      });
    } else {
      toast.info("Nothing to redo");
    }
  }, [setNodes, setEdges]);

  // Duplicate selected nodes
  const handleDuplicateSelected = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected && !isCenterNode(n));
    if (selectedNodes.length === 0) {
      toast.info("No nodes selected");
      return;
    }

    const offset = 50;
    const newNodes = selectedNodes.map((node, index) => ({
      ...node,
      id: `${Date.now()}-${index}`,
      position: {
        x: node.position.x + offset,
        y: node.position.y + offset,
      },
      selected: false,
      data: {
        ...node.data,
        label: `${node.data.label} (Copy)`,
        isNew: true,
      },
    }));

    setNodes((nds) => [...nds, ...newNodes]);
    setIsSaved(false);
    toast.success(`Duplicated ${selectedNodes.length} node${selectedNodes.length > 1 ? 's' : ''}`, {
      description: "New copies created with offset",
    });
  }, [nodes, setNodes, isCenterNode]);

  // Bulk operation handlers
  const handleBulkAddTags = useCallback((tags: string[]) => {
    const result = bulkAddTags(nodes, tags);
    setNodes(result.nodes);
    setIsSaved(false);
    toast.success(result.result.message);
  }, [nodes, setNodes]);

  const handleBulkRemoveTags = useCallback((tags: string[]) => {
    const result = bulkRemoveTags(nodes, tags);
    setNodes(result.nodes);
    setIsSaved(false);
    toast.success(result.result.message);
  }, [nodes, setNodes]);

  const handleBulkReplaceTags = useCallback((tags: string[]) => {
    const result = bulkReplaceTags(nodes, tags);
    setNodes(result.nodes);
    setIsSaved(false);
    toast.success(result.result.message);
  }, [nodes, setNodes]);

  const handleBulkChangeType = useCallback((newType: string) => {
    const result = bulkChangeType(nodes, newType);
    setNodes(result.nodes);
    setIsSaved(false);
    toast.success(result.result.message);
  }, [nodes, setNodes]);

  const handleBulkDelete = useCallback(() => {
    const selectedCount = nodes.filter((n) => n.selected && !isCenterNode(n)).length;
    if (selectedCount === 0) {
      toast.info("No nodes selected");
      return;
    }

    const result = bulkDeleteNodes(nodes, edges);
    setNodes(result.nodes);
    setEdges(result.edges);
    setIsSaved(false);
    toast.success(result.result.message);
  }, [nodes, edges, setNodes, setEdges, isCenterNode]);

  const handleBulkCompleteAllTodos = useCallback(() => {
    const result = bulkUpdateTodos(nodes, true);
    setNodes(result.nodes);
    setIsSaved(false);
    toast.success(result.result.message);
  }, [nodes, setNodes]);

  const handleBulkIncompleteAllTodos = useCallback(() => {
    const result = bulkUpdateTodos(nodes, false);
    setNodes(result.nodes);
    setIsSaved(false);
    toast.success(result.result.message);
  }, [nodes, setNodes]);

  const handleBulkClearCards = useCallback(() => {
    const result = bulkClearCards(nodes);
    setNodes(result.nodes);
    setIsSaved(false);
    toast.success(result.result.message);
  }, [nodes, setNodes]);

  const handleSelectByCriteria = useCallback((criteria: BulkSelectionCriteria) => {
    const updatedNodes = selectNodesByCriteria(nodes, criteria, edges);
    setNodes(updatedNodes);
    
    const selectedCount = updatedNodes.filter((n) => n.selected && !isCenterNode(n)).length;
    toast.success(`Selected ${selectedCount} node${selectedCount !== 1 ? 's' : ''}`);
  }, [nodes, edges, setNodes, isCenterNode]);

  const handleDeselectAll = useCallback(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        selected: false,
      }))
    );
  }, [setNodes, isCenterNode]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    if (!reactFlowInstance) return;
    reactFlowInstance.zoomIn({ duration: 200 });
  }, [reactFlowInstance]);

  const handleZoomOut = useCallback(() => {
    if (!reactFlowInstance) return;
    reactFlowInstance.zoomOut({ duration: 200 });
  }, [reactFlowInstance]);

  const handleFitView = useCallback(() => {
    if (!reactFlowInstance) return;
    
    // Calculate dynamic max zoom based on node count
    // More nodes = allow more zoom out
    const nodeCount = nodes.length;
    let maxZoom = 1.5;
    if (nodeCount > 20) maxZoom = 2.0;
    if (nodeCount > 50) maxZoom = 2.5;
    if (nodeCount > 100) maxZoom = 3.0;
    
    reactFlowInstance.fitView({ 
      padding: 0.2, 
      duration: 400,
      maxZoom
    });
    if (layoutDebug) {
      requestAnimationFrame(() => devOutlineCollisions(12));
    }
    toast.success("Fit all nodes", {
      description: "Canvas adjusted to show all nodes",
    });
  }, [reactFlowInstance, nodes.length, layoutDebug]);

  const handleFitSelection = useCallback(() => {
    const selectedNodes = nodes.filter(n => n.selected);
    if (selectedNodes.length === 0) {
      toast.info("No nodes selected");
      return;
    }

    if (!reactFlowInstance) return;
    // Get the bounding box of selected nodes
    const nodeIds = selectedNodes.map(n => n.id);
    
    // Calculate dynamic max zoom based on selection count
    let maxZoom = 2.0;
    if (selectedNodes.length > 10) maxZoom = 2.5;
    if (selectedNodes.length > 20) maxZoom = 3.0;
    
    reactFlowInstance.fitView({
      padding: 0.3,
      duration: 400,
      maxZoom,
      nodes: selectedNodes,
    });
    if (layoutDebug) {
      requestAnimationFrame(() => devOutlineCollisions(12));
    }
    
    toast.success("Zoomed to selection", {
      description: `Focused on ${selectedNodes.length} node${selectedNodes.length > 1 ? 's' : ''}`,
    });
  }, [reactFlowInstance, nodes, layoutDebug]);

  const handleCenterCanvas = useCallback(() => {
    if (!reactFlowInstance) return;
    // Find center node and focus on it
    const centerNode = nodes.find((n) => isCenterNode(n));
    if (centerNode) {
      const measured = nodeDimensionsRef.current?.[centerNode.id];
      const width =
        parseDimensionValue(measured?.width) ??
        parseDimensionValue(centerNode.width) ??
        parseDimensionValue(centerNode.style?.width) ??
        360;
      const height =
        parseDimensionValue(measured?.height) ??
        parseDimensionValue(centerNode.height) ??
        parseDimensionValue(centerNode.style?.height) ??
        240;
      reactFlowInstance.setCenter(
        (centerNode.position?.x ?? 0) + width / 2,
        (centerNode.position?.y ?? 0) + height / 2,
        { duration: 400, zoom: 1 }
      );
      toast.success("Centered", {
        description: "Canvas centered on main node",
      });
    }
  }, [reactFlowInstance, nodes, isCenterNode]);

  const handleNodeFocus = useCallback((nodeId: string) => {
    if (!reactFlowInstance) return;
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      const measured = nodeDimensionsRef.current?.[node.id];
      const width =
        parseDimensionValue(measured?.width) ??
        parseDimensionValue(node.width) ??
        parseDimensionValue(node.style?.width) ??
        DEFAULT_CARD_WIDTH;
      const height =
        parseDimensionValue(measured?.height) ??
        parseDimensionValue(node.height) ??
        parseDimensionValue(node.style?.height) ??
        DEFAULT_CARD_HEIGHT;
      reactFlowInstance.setCenter(
        (node.position?.x ?? 0) + width / 2,
        (node.position?.y ?? 0) + height / 2,
        { duration: 400, zoom: 1.2 }
      );

      // Select the node
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          selected: n.id === nodeId,
        }))
      );
      setSelectedNodeId(nodeId);
    }
  }, [reactFlowInstance, nodes, setNodes]);

  // Track zoom level changes
  useEffect(() => {
    if (!reactFlowInstance) return;
    
    const updateZoom = () => {
      if (!reactFlowInstance) return;
      const viewport = reactFlowInstance.getViewport();
      setZoomLevel(viewport.zoom);
    };

    // Update on mount
    updateZoom();

    // Listen to zoom changes
    const unsubscribe = reactFlowInstance.onMove?.(updateZoom);
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [reactFlowInstance]);

  // Reset zoom to 100% on component mount (every reload)
  const hasResetZoom = useRef(false);
  useEffect(() => {
    if (!reactFlowInstance || hasResetZoom.current) return;
    
    hasResetZoom.current = true;
    
    // Delay to ensure ReactFlow is fully mounted and ready
    const timeoutId = setTimeout(() => {
      try {
        // Find center node
        const centerNode = nodes.find((n) => isCenterNode(n));
        if (centerNode) {
          // Log the center node details for debugging
          console.log('Center node:', {
            position: centerNode.position,
            width: centerNode.width,
            height: centerNode.height,
            style: centerNode.style,
            styleWidthType: typeof centerNode.style?.width,
            styleHeightType: typeof centerNode.style?.height
          });
          
          // Get actual dimensions - ensure we convert strings to numbers
          let nodeWidth: number;
          if (centerNode.width) {
            nodeWidth = centerNode.width;
          } else if (centerNode.style?.width) {
            // Handle both string ("320") and number (320) cases
            const widthValue = centerNode.style.width;
            nodeWidth = typeof widthValue === 'string' ? parseInt(widthValue, 10) : widthValue;
          } else {
            nodeWidth = 320;
          }
          
          let nodeHeight: number;
          if (centerNode.height) {
            nodeHeight = centerNode.height;
          } else if (centerNode.style?.height) {
            // Handle both string and number cases
            const heightValue = centerNode.style.height;
            nodeHeight = typeof heightValue === 'string' ? parseInt(heightValue, 10) : heightValue;
          } else {
            nodeHeight = 200;
          }
          
          console.log('Parsed dimensions:', { nodeWidth, nodeHeight, nodeWidthType: typeof nodeWidth, nodeHeightType: typeof nodeHeight });
          
          // Calculate center of the node in flow coordinates
          const nodeCenterX = centerNode.position.x + nodeWidth / 2;
          const nodeCenterY = centerNode.position.y + nodeHeight / 2;
          
          console.log('Calculated center:', { 
            nodeCenterX, 
            nodeCenterY,
            nodePositionX: centerNode.position.x,
            nodePositionY: centerNode.position.y,
            calculation: `x: ${centerNode.position.x} + ${nodeWidth}/2 = ${nodeCenterX}, y: ${centerNode.position.y} + ${nodeHeight}/2 = ${nodeCenterY}`
          });
          
          // Use setCenter to properly center the node on screen
          reactFlowInstance.setCenter(nodeCenterX, nodeCenterY, { 
            zoom: 1,
            duration: 0 
          });
          
          console.log('✅ Canvas centered at 100% zoom');
        }
      } catch (err) {
        console.error('Centering error:', err);
      }
    }, 150);
    
    return () => clearTimeout(timeoutId);
  }, [reactFlowInstance, nodes, isCenterNode]);

  useEffect(() => {
    refreshDimensions();
    const timeoutId = window.setTimeout(refreshDimensions, 120);
    return () => window.clearTimeout(timeoutId);
  }, [nodes]);

  useEffect(() => {
    const handleResize = () => refreshDimensions();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Remove edges that reference nodes we no longer have (avoids React Flow errors)
  useEffect(() => {
    setEdges((eds) => {
      if (!Array.isArray(nodes) || nodes.length === 0) return eds;
      const validIds = new Set(nodes.map((node) => node.id));
      let changed = false;
      const filtered = eds.filter((edge) => {
        const keep = validIds.has(edge.source) && validIds.has(edge.target);
        if (!keep) changed = true;
        return keep;
      });
      return changed ? filtered : eds;
    });
  }, [nodes, setEdges]);



  // Initialize history with initial state
  useEffect(() => {
    historyManager.current.initialize({ nodes, edges });
    setCanUndo(historyManager.current.canUndo());
    setCanRedo(historyManager.current.canRedo());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-apply layout once on first load unless the user explicitly disables it
  useEffect(() => {
    if (autoLayoutOnLoadRef.current) return;
    if (!allNodesMeasured) return;
    if (isUserDragging) return;
    if (nodes.length <= 1) return;

    const storageAvailable = typeof window !== 'undefined';
    const pref = storageAvailable ? localStorage.getItem('flowforge-auto-layout-on-load') : null;
    if (pref !== 'true') return;

    const t = setTimeout(() => {
      try {
        if (nodes && nodes.length > 1) {
          const centerId = centerNodeIdRef.current || "center";
          autoLayoutOnLoadRef.current = true;
          let layoutedNodes = applyDomainRadialLayout(nodes, {
            centerNodeId: centerId,
            viewMode,
            viewportDimensions: { width: window.innerWidth, height: window.innerHeight },
            dimensions: nodeDimensionsRef.current,
          });
          // Apply layout and then perform relaxation with measurement-awareness
          if (process.env.NODE_ENV !== 'production') {
            console.debug('[layout] calling relax', { fit: true, padding: relaxPadding, pinned: Array.from(pinnedRef.current) });
          }
          setIsAutoLayouting(true);
          if (viewMode === 'radial') {
            recordRadialBaseline(layoutedNodes);
          } else {
            lastRadialBaseRef.current = null;
          }
          applyLayoutAndRelax(layoutedNodes, {
            padding: relaxPadding,
            maxPasses: 10,
            fit: true,
            fixedIds: [centerId, ...Array.from(pinnedRef.current)],
          }).then(() => {
            if (storageAvailable) {
              localStorage.setItem('flowforge-initial-layout-applied', 'true');
              localStorage.setItem(LAYOUT_VERSION_KEY, CURRENT_LAYOUT_VERSION);
            }
          }).finally(() => {
            setTimeout(() => setIsAutoLayouting(false), 600);
          });
        }
      } catch (e) {
        console.warn('Auto-layout on load failed:', e);
      }
    }, 250);

    return () => clearTimeout(t);
  }, [allNodesMeasured, nodes, viewMode, applyLayoutAndRelax, relaxPadding, isUserDragging, recordRadialBaseline]);

  // Keep radial layout spacing in sync with live node dimensions
  // Debounced dimension watcher for radial view: throttle via requestAnimationFrame
  useEffect(() => {
    if (viewMode !== "radial") return;
    if (!allNodesMeasured) return;
    if (!nodeDimensionsRef.current || Object.keys(nodeDimensionsRef.current).length === 0) return;
    if (isUserDragging) return;
    if (isAutoLayouting) return;
    if (Date.now() - layoutCooldownRef.current < 450) return;

    let rafId = 0;
    rafId = requestAnimationFrame(() => {
      // If there are pinned nodes, skip full recompute and only relax respecting pins
      if (pinnedRef.current.size > 0) {
        const current = typeof reactFlowInstance?.getNodes === 'function'
          ? (reactFlowInstance!.getNodes() as Node[])
          : nodes;
        relaxRespectingPins(current, { padding: relaxPadding, maxPasses: 4 });
        return;
      }

      const centerId = centerNodeIdRef.current || "center";
      const layoutedNodes = applyDomainRadialLayout(nodes, {
        centerNodeId: centerId,
        viewMode: "radial",
        viewportDimensions: { width: window.innerWidth, height: window.innerHeight },
        dimensions: nodeDimensionsRef.current,
        pinnedIds: pinnedRef.current,
      });

      if (!hasRadialBaselineChanged(layoutedNodes)) {
        return;
      }

      recordRadialBaseline(layoutedNodes);
      setIsAutoLayouting(true);
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[layout] calling relax', { fit: false, padding: relaxPadding, pinned: Array.from(pinnedRef.current) });
      }
      applyLayoutAndRelax(layoutedNodes, {
        padding: relaxPadding,
        maxPasses: 10,
        fit: false,
        fixedIds: [centerId, ...Array.from(pinnedRef.current)],
      }).finally(() => {
        setTimeout(() => setIsAutoLayouting(false), 480);
      });
    });
    return () => cancelAnimationFrame(rafId);
  }, [dimensionVersion, viewMode, allNodesMeasured, nodes, applyLayoutAndRelax, relaxPadding, isUserDragging, isAutoLayouting, reactFlowInstance, relaxRespectingPins, hasRadialBaselineChanged, recordRadialBaseline]);

  // Track changes to nodes/edges for history (with debounce to avoid tracking every drag)
  useEffect(() => {
    // Skip if this change was caused by undo/redo
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }

    // Debounce to avoid saving too frequently (e.g., during drag)
    const timeoutId = setTimeout(() => {
      historyManager.current.push({ nodes, edges });
      setCanUndo(historyManager.current.canUndo());
      setCanRedo(historyManager.current.canRedo());
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [nodes, edges]);

  // Check for first visit and show onboarding
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("flowforge-onboarding-seen");
    // Show onboarding on first visit with minimal nodes (center node only or one additional)
    if (!hasSeenOnboarding && nodes.length <= 1) {
      setShowOnboarding(true);
    }
    
    // Show empty state if only center node exists
    if (nodes.length <= 1 && hasSeenOnboarding) {
      setShowEmptyState(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update empty state when nodes change
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("flowforge-onboarding-seen");
    // Only show empty state when there's truly just the center node (or nothing)
    setShowEmptyState(nodes.length <= 1 && hasSeenOnboarding === "true");
    if (nodes.length > 1) {
      initialCenterFitRef.current = false;
    }
  }, [nodes.length]);

  useEffect(() => {
    if (!isWorkspaceReady || !workspaceId) {
      return;
    }

    const payload = buildWorkspaceUpdatePayload(workspaceName, nodes, edges);
    const snapshot = JSON.stringify({
      name: workspaceName,
      nodes: payload.nodes,
      edges: payload.edges,
    });

    if (snapshot === lastPersistSnapshotRef.current) {
      return;
    }

    if (persistTimeoutRef.current) {
      window.clearTimeout(persistTimeoutRef.current);
      persistTimeoutRef.current = null;
    }

    persistTimeoutRef.current = window.setTimeout(() => {
      persistWorkspace()
        .catch(() => {
          /* handled inside persistWorkspace */
        })
        .finally(() => {
          persistTimeoutRef.current = null;
        });
    }, 1200);

    return () => {
      if (persistTimeoutRef.current) {
        window.clearTimeout(persistTimeoutRef.current);
        persistTimeoutRef.current = null;
      }
    };
  }, [edges, nodes, workspaceId, workspaceName, isWorkspaceReady, persistWorkspace]);

  const hasSingleCenterNode = nodes.length === 1 && isCenterNode(nodes[0]);

  const centerViewportOnCenterNode = useCallback(() => {
    if (!reactFlowInstance) return;
    const wrapper = reactFlowWrapperRef.current;
    if (!wrapper) return;
    const centerNode = nodes.find((n) => isCenterNode(n));
    if (!centerNode) return;

    const { clientWidth, clientHeight } = wrapper;
    if (!clientWidth || !clientHeight) return;

    const measured = nodeDimensionsRef.current?.[centerNode.id];
    const width =
      parseDimensionValue(measured?.width) ??
      parseDimensionValue(centerNode.style?.width) ??
      parseDimensionValue((centerNode as any).width) ??
      360;
    const height =
      parseDimensionValue(measured?.height) ??
      parseDimensionValue(centerNode.style?.height) ??
      parseDimensionValue((centerNode as any).height) ??
      240;

    const posX = centerNode.position?.x ?? 0;
    const posY = centerNode.position?.y ?? 0;

    const targetX = clientWidth / 2 - (posX + width / 2);
    const targetY = clientHeight / 2 - (posY + height / 2);

    try {
      reactFlowInstance.setViewport({ x: targetX, y: targetY, zoom: 1 }, { duration: 0 });
      initialCenterFitRef.current = true;
    } catch {}
  }, [reactFlowInstance, nodes]);

  useEffect(() => {
    if (!reactFlowInstance) return;
    if (hasSingleCenterNode && !initialCenterFitRef.current) {
      requestAnimationFrame(() => centerViewportOnCenterNode());
    }
  }, [hasSingleCenterNode, reactFlowInstance, centerViewportOnCenterNode, dimensionVersion, showEmptyState]);

  useEffect(() => {
    if (!hasSingleCenterNode) return;
    const handleResize = () => {
      initialCenterFitRef.current = false;
      requestAnimationFrame(() => centerViewportOnCenterNode());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [hasSingleCenterNode, centerViewportOnCenterNode]);

  // Keyboard shortcuts for multi-select and actions
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? event.metaKey : event.ctrlKey;

      // Undo (Cmd/Ctrl + Z)
      if (cmdOrCtrl && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        handleUndo();
      }

      // Redo (Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y)
      if ((cmdOrCtrl && event.shiftKey && event.key === 'z') || (cmdOrCtrl && event.key === 'y')) {
        event.preventDefault();
        handleRedo();
      }

      // Fit View (Cmd/Ctrl + 0)
      if (cmdOrCtrl && event.key === '0') {
        event.preventDefault();
        handleFitView();
      }

      // Zoom to Selection (Cmd/Ctrl + Shift + 0 or F)
      if ((cmdOrCtrl && event.shiftKey && event.key === '0') || event.key === 'f') {
        const hasSelection = nodes.some(n => n.selected);
        if (hasSelection) {
          event.preventDefault();
          handleFitSelection();
        }
      }

      // Center Canvas (Cmd/Ctrl + .)
      if (cmdOrCtrl && event.key === '.') {
        event.preventDefault();
        handleCenterCanvas();
      }

      // Command Palette (Cmd/Ctrl + K)
      if (cmdOrCtrl && event.key === 'k') {
        event.preventDefault();
        setIsCommandPaletteOpen(true);
      }

      // Keyboard Shortcuts (?)
      if (event.key === '?' && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        setIsKeyboardShortcutsOpen(true);
      }

      // Select All (Cmd/Ctrl + A)
      if (cmdOrCtrl && event.key === 'a') {
        event.preventDefault();
        setNodes((nds) =>
          nds.map((node) => ({
            ...node,
            selected: true,
          }))
        );
        toast.success("All nodes selected");
      }

      // Deselect All (Escape)
      if (event.key === 'Escape') {
        setNodes((nds) =>
          nds.map((node) => ({
            ...node,
            selected: false,
          }))
        );
      }

      // Duplicate Selected (Cmd/Ctrl + D)
      if (cmdOrCtrl && event.key === 'd') {
        event.preventDefault();
        handleDuplicateSelected();
      }

      // Select by Criteria (Cmd/Ctrl + Shift + F)
      if (cmdOrCtrl && event.shiftKey && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        setIsSelectByCriteriaOpen(true);
      }

      // Delete Selected (Delete/Backspace)
      if ((event.key === 'Delete' || event.key === 'Backspace') && !event.metaKey && !event.ctrlKey) {
        const selectedNodeCount = nodes.filter((n) => n.selected && !isCenterNode(n)).length;
        const selectedEdgeIds = edges.filter(e => e.selected).map(e => e.id);

        // If nodes are selected, handle via our bulk delete (prevents deleting the center)
        if (selectedNodeCount > 0) {
          event.preventDefault();
          handleBulkDelete();
          return;
        }

        // If only edges are selected:
        if (selectedEdgeIds.length > 0) {
          if (event.key === 'Backspace') {
            // Support Backspace on macOS where Delete key often maps to Backspace
            event.preventDefault();
            setEdges(eds => eds.filter(e => !selectedEdgeIds.includes(e.id)));
            toast.success(`Deleted ${selectedEdgeIds.length} connection${selectedEdgeIds.length > 1 ? 's' : ''}`);
            return;
          }
          // For the actual Delete key, let React Flow handle it (don't preventDefault)
        }
      }

    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [setNodes, handleUndo, handleRedo, handleFitView, handleFitSelection, handleCenterCanvas, nodes, setIsKeyboardShortcutsOpen, setIsCommandPaletteOpen, handleDuplicateSelected, handleBulkDelete, isCenterNode]);
  

  // Update edges with optimal handles whenever nodes change
  useEffect(() => {
    // Skip if currently editing text or placing a node to avoid interference
    if (isEditingText || isPlacingNode) {
      return;
    }
    
    try {
      const updatedEdges = updateEdgesWithOptimalHandles(nodes, edges, centerNodeIdRef.current || "center");
      // Only update if edges actually changed to avoid infinite loop
      const edgesChanged = updatedEdges.some((edge, i) => {
        const originalEdge = edges[i];
        return (
          edge.sourceHandle !== originalEdge?.sourceHandle ||
          edge.targetHandle !== originalEdge?.targetHandle
        );
      });
      
      if (edgesChanged) {
        setEdges(updatedEdges);
      }
    } catch (error) {
      console.error('Error updating edges with optimal handles:', error);
    }
  }, [nodes, isEditingText, isPlacingNode]); // Only depend on nodes and editing state, not edges

  const onConnect = useCallback(
    (params: Edge | Connection) => {
      // Normalize handle ids to our side-suffixed scheme and ensure source uses -source and target uses -target
      const normalizeHandle = (h: string | null | undefined, desired: 'source' | 'target') => {
        if (!h) return h;
        const m = String(h).match(/^(top|right|bottom|left)(?:-(?:source|target))?$/);
        if (m) return `${m[1]}-${desired}`;
        return h;
      };
      const normalized = {
        ...params,
        sourceHandle: normalizeHandle((params as any).sourceHandle, 'source'),
        targetHandle: normalizeHandle((params as any).targetHandle, 'target'),
      } as Edge | Connection;
      const newEdge = { ...normalized, type: "custom" };
      const centerId = centerNodeIdRef.current || "center";
      setEdges((eds) => {
        const updatedEdges = addEdge(newEdge, eds);
        return updateEdgesWithOptimalHandles(nodes, updatedEdges, centerId);
      });
      setIsSaved(false);
      didConnectRef.current = true;
      setIsConnecting(false);
    },
    [setEdges, nodes]
  );

  const onConnectStart = useCallback((event: any, params: any) => {
    setIsConnecting(true);
    didConnectRef.current = false;
    connectStartInfoRef.current = { nodeId: params?.nodeId ?? null, handleId: params?.handleId ?? null };
    setConnectStart(connectStartInfoRef.current);
  }, []);

  const onConnectEnd = useCallback((event: any) => {
    setIsConnecting(false);
    setConnectStart(null);
    // If no valid connection was made, interpret as "create new node" drop
    if (!didConnectRef.current && connectStartInfoRef.current?.nodeId && reactFlowInstance) {
      const { clientX, clientY } = event as MouseEvent;
      const pos = reactFlowInstance.screenToFlowPosition({ x: clientX, y: clientY });
      // Open Add Node modal at drop position, pre-linking source node
      launchNodeCreator({
        position: pos,
        sourceNodeId: connectStartInfoRef.current.nodeId,
      });
    }
    // Reset flags
    didConnectRef.current = false;
    connectStartInfoRef.current = null;
  }, [reactFlowInstance, launchNodeCreator]);

  const handleExpandCard = useCallback((nodeId: string, cardId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    const card = node?.data.cards?.find((c: EditableCardData) => c.id === cardId);
    if (card) {
      setSelectedCard({ nodeId, card });
      setIsDetailPanelOpen(true);
    }
  }, [nodes]);

  const handleUpdateCardInPanel = useCallback((updatedCard: EditableCardData) => {
    if (!selectedCard) return;
    
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedCard.nodeId) {
          const updatedCards = node.data.cards?.map((c: EditableCardData) =>
            c.id === updatedCard.id ? updatedCard : c
          );
          return {
            ...node,
            data: {
              ...node.data,
              cards: updatedCards,
            },
          };
        }
        return node;
      })
    );
    setSelectedCard({ ...selectedCard, card: updatedCard });
    setIsSaved(false);
  }, [selectedCard, setNodes]);

  const handleAddCard = useCallback((nodeId: string, type: "text" | "todo") => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          const newCard: EditableCardData = {
            id: `c${Date.now()}`,
            title: type === "text" ? "New Text Card" : "New To-Do List",
            type,
            content: type === "text" ? "" : undefined,
            todos: type === "todo" ? [] : undefined,
          };
          return {
            ...node,
            data: {
              ...node.data,
              cards: [...(node.data.cards || []), newCard],
            },
          };
        }
        return node;
      })
    );
    setIsSaved(false);
    toast.success("Card added");
  }, [setNodes]);

  const handleUpdateCard = useCallback((nodeId: string, cardId: string, updatedCard: EditableCardData) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          const updatedCards = node.data.cards?.map((c: EditableCardData) =>
            c.id === cardId ? updatedCard : c
          );
          return {
            ...node,
            data: {
              ...node.data,
              cards: updatedCards,
            },
          };
        }
        return node;
      })
    );
    setIsSaved(false);
  }, [setNodes]);

  const handleDeleteCard = useCallback((nodeId: string, cardId: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          const updatedCards = node.data.cards?.filter((c: EditableCardData) => c.id !== cardId);
          return {
            ...node,
            data: {
              ...node.data,
              cards: updatedCards,
            },
          };
        }
        return node;
      })
    );
    setIsSaved(false);
    toast.success("Card deleted");
  }, [setNodes]);

  // Center node update handler
  const handleUpdateCenterNode = useCallback((updates: Partial<CenterNodeData>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (isCenterNode(node)) {
          return {
            ...node,
            data: {
              ...node.data,
              ...updates,
            },
          };
        }
        return node;
      })
    );
    setIsSaved(false);
    toast.success("Center node updated");
  }, [setNodes]);

  // AI Enrichment handlers
  const handleOpenEnrichment = useCallback((nodeId: string) => {
    setEnrichmentNodeId(nodeId);
    setIsAIEnrichmentModalOpen(true);
  }, []);

  const handleOpenConnectSources = useCallback(() => {
    setShowEmptyState(false);
    setIsConnectSourcesOpen(true);
  }, []);

  const handleConnectGitRepo = useCallback(() => {
    setIsConnectSourcesOpen(false);
    setIsImportModalOpen(true);
    setIsAddNodeModalOpen(false);
    toast.info("Connect your Git repository", {
      description: "Import commit history or documentation to populate your workspace.",
    });
  }, [setIsImportModalOpen]);

  const handleConnectWiki = useCallback(() => {
    setIsConnectSourcesOpen(false);
    setIsAISuggestPanelOpen(true);
    setIsAddNodeModalOpen(false);
    toast.info("Connect a wiki or knowledge base", {
      description: "Use AI enrichment to pull context from your documentation.",
    });
  }, []);

  const handleAddEnrichedContent = useCallback((
    nodeId: string,
    textCards: EditableCardData[],
    todoCards: EditableCardData[],
    tags: string[],
    enhancedSummary: string
  ) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          // Merge new cards with existing ones
          const existingCards = node.data.cards || [];
          const newCards = [...textCards, ...todoCards];
          
          // Merge tags (avoid duplicates)
          const existingTags = node.data.tags || [];
          const mergedTags = Array.from(new Set([...existingTags, ...tags]));
          
          // Increment enrichment count
          const enrichmentCount = (node.data.enrichmentCount || 0) + 1;
          
          return {
            ...node,
            data: {
              ...node.data,
              cards: [...existingCards, ...newCards],
              tags: mergedTags,
              summary: enhancedSummary || node.data.summary,
              enrichmentCount,
            },
          };
        }
        return node;
      })
    );
    setIsSaved(false);
    toast.success("Content enriched with AI ✨", {
      description: `Added ${textCards.length + todoCards.length} cards and ${tags.length} tags`,
    });
  }, [setNodes]);

  const handleDragNewNode = useCallback(
    (sourceNodeId: string, position: { x: number; y: number }) => {
      setDragPreview(null); // Clear preview when opening modal
      setIsPlacingNode(false); // Clear placing mode
      setPlacingNodeInfo(null); // Clear placing info
      launchNodeCreator({
        position,
        sourceNodeId,
      });
    },
    [launchNodeCreator]
  );

  const handleDragPreviewUpdate = useCallback((start: { x: number; y: number } | null, end: { x: number; y: number } | null) => {
    if (start && end) {
      setDragPreview({ start, end });
    } else {
      setDragPreview(null);
    }
  }, []);

  const handlePlacingModeChange = useCallback((isPlacing: boolean, nodeId: string, startPos: { x: number; y: number } | null) => {
    setIsPlacingNode(isPlacing);
    if (isPlacing && startPos) {
      setPlacingNodeInfo({ nodeId, startPos });
    } else {
      setPlacingNodeInfo(null);
      setDragPreview(null);
    }
  }, []);

  // Duplicate node handler
  const handleDuplicateNode = useCallback((nodeId: string) => {
    const nodeToDuplicate = nodes.find(n => n.id === nodeId);
    if (!nodeToDuplicate || isCenterNode(nodeToDuplicate)) {
      toast.error("Cannot duplicate this node");
      return;
    }

    const newNodeId = `${Date.now()}-duplicate`;
    const offset = 50;
    const newNode = {
      ...nodeToDuplicate,
      id: newNodeId,
      position: {
        x: nodeToDuplicate.position.x + offset,
        y: nodeToDuplicate.position.y + offset,
      },
      selected: false,
      data: {
        ...nodeToDuplicate.data,
        label: `${nodeToDuplicate.data.label} (Copy)`,
        isNew: true,
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setIsSaved(false);
    toast.success("Node duplicated", {
      description: `Created a copy of "${nodeToDuplicate.data.label}"`,
    });
  }, [nodes, setNodes, isCenterNode]);

  const handleToggleNodeCollapse = useCallback((nodeId: string) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id !== nodeId) return n;
        return {
          ...n,
          data: {
            ...(n.data || {}),
            collapsed: !(n.data?.collapsed),
          },
        };
      })
    );
    setIsSaved(false);
  }, [setNodes]);

  // Delete node handler
  const handleDeleteNode = useCallback((nodeId: string) => {
    if (nodeId && nodeId === centerNodeIdRef.current) {
      toast.error("Cannot delete the center node");
      return;
    }
    const nodeToDelete = nodes.find(n => n.id === nodeId);
    if (isCenterNode(nodeToDelete)) {
      toast.error("Cannot delete the center node");
      return;
    }

    setNodes((nds) => nds.filter(n => n.id !== nodeId));
    setEdges((eds) => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    setIsSaved(false);
    toast.success("Node deleted", {
      description: `Removed "${nodeToDelete?.data.label}"`,
    });
  }, [nodes, setNodes, setEdges, isCenterNode]);

  // Command palette node selection
  const handleNodeSelectFromPalette = useCallback((nodeId: string) => {
    if (nodeId === "fit-all") {
      handleFitView();
      return;
    }
    if (nodeId === "fit-selection") {
      handleFitSelection();
      return;
    }
    if (nodeId === centerNodeIdRef.current) {
      handleCenterCanvas();
      return;
    }

    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      // Deselect all nodes first
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          selected: n.id === nodeId,
        }))
      );
      
      // Focus on the node
      reactFlowInstance.setCenter(
        node.position.x + (node.width || 280) / 2,
        node.position.y + (node.height || 200) / 2,
        { duration: 400, zoom: 1 }
      );
      
      toast.success("Focused on node", {
        description: node.data.label,
      });
    }
  }, [nodes, setNodes, reactFlowInstance, handleFitView, handleFitSelection, handleCenterCanvas]);

  // Update nodes with callbacks - Optimized with useMemo for performance
  const nodesWithCallbacks = useMemo(() => {
    return nodes.map((node) => {
      // Ensure node is valid
      if (!node || !node.id) {
        console.error('Invalid node detected:', node);
        // Return a minimal valid node to prevent crashes
        return {
          id: 'error-node',
          type: 'custom',
          position: { x: 0, y: 0 },
          data: {},
        };
      }
      
      // If node has a parentNode, verify the parent exists
      const hasValidParent = !node.parentNode || nodes.some(n => n && n.id === node.parentNode);
      
      const isCenter = node.type === "center";
      const primaryText = isCenter ? (node.data?.buttonText ?? "Connect your Git or Wiki") : node.data?.buttonText;
      const secondaryText = isCenter ? (node.data?.secondaryButtonText ?? "Create your first node") : node.data?.secondaryButtonText;

      return {
        ...node,
        ...(isCenterNode(node) ? { draggable: false, selectable: false, dragHandle: undefined } : {}),
        // Ensure position is valid
        position: node.position || { x: 0, y: 0 },
        // Clear parentNode if parent doesn't exist to prevent ReactFlow errors
        parentNode: hasValidParent ? node.parentNode : undefined,
        // Add callbacks to data
        data: {
          ...(node.data || {}),
          onToggleCollapse: () => {
            setNodes((nds) => nds.map((n) => n.id === node.id ? {
              ...n,
              data: { ...(n.data || {}), collapsed: !n.data?.collapsed }
            } : n));
          },
          // Hide interactive overlays while a built-in connection is in progress
          isConnecting,
          // Keep source node's handles visible while connecting from it
          isConnectSource: isConnecting && connectStartInfoRef.current?.nodeId === node.id,
          connectStartHandleId: isConnecting && connectStartInfoRef.current?.nodeId === node.id ? (connectStartInfoRef.current?.handleId || null) : null,
          onAddCard: (type: "text" | "todo") => handleAddCard(node.id, type),
          onUpdateCard: (cardId: string, data: EditableCardData) => handleUpdateCard(node.id, cardId, data),
          onDeleteCard: (cardId: string) => handleDeleteCard(node.id, cardId),
          onExpandCard: (cardId: string) => handleExpandCard(node.id, cardId),
          onDragNewNode: handleDragNewNode,
          onDragPreviewUpdate: handleDragPreviewUpdate,
          onPlacingModeChange: handlePlacingModeChange,
          onEditingChange: (isEditing: boolean) => setIsEditingText(isEditing),
          onDuplicate: () => handleDuplicateNode(node.id),
          onDelete: () => handleDeleteNode(node.id),
          onExportJSON: () => handleExportNodeJSON(node.id),
          onExportMarkdown: () => handleExportNodeMarkdown(node.id),
          onCopyData: () => handleCopyNodeData(node.id),
          onExportSubgraphJSON: () => handleExportSubgraphJSON(node.id),
          onExportSubgraphMarkdown: () => handleExportSubgraphMarkdown(node.id),
          onEnrichWithAI: () => handleOpenEnrichment(node.id),
          onOpenSuggestionPanel: () => {
            setSelectedNodeId(node.id);
            setIsWizardOpen(false);
            setSuggestionPanelRefresh(Date.now());
            setIsSuggestionPanelOpen(true);
            setNodes((nds) =>
              nds.map((n) => ({
                ...n,
                selected: n.id === node.id,
              }))
            );
          },
          isPlacingFromThisNode: isPlacingNode && placingNodeInfo?.nodeId === node.id,
          // Add button actions and updater for the center node
          ...(isCenter
            ? {
                buttonText: primaryText,
                buttonAction: () => {
                  handleOpenConnectSources();
                },
                secondaryButtonText: secondaryText,
                secondaryButtonAction: () => {
                  const centerId = centerNodeIdRef.current || "center";
                  setShowEmptyState(false);
                  launchNodeCreator({
                    sourceNodeId: centerId,
                  });
                },
                onUpdateCenterNode: handleUpdateCenterNode,
                isConnectSource: true,
              }
            : {}),
        },
      };
    });
  }, [
    nodes,
    isConnecting,
    connectStartInfoRef,
    setNodes,
    handleAddCard,
    handleUpdateCard,
    handleDeleteCard,
    handleExpandCard,
    handleDragNewNode,
    handleDragPreviewUpdate,
    handlePlacingModeChange,
    setIsEditingText,
    handleDuplicateNode,
    handleDeleteNode,
    handleOpenEnrichment,
    isPlacingNode,
    placingNodeInfo,
    handleUpdateCenterNode,
    handleOpenConnectSources,
    setShowEmptyState,
    launchNodeCreator,
    setSelectedNodeId,
    setIsWizardOpen,
    isCenterNode
    // Note: Export/copy handlers intentionally omitted from deps to avoid hoisting issues
    // These functions are stable and don't need to trigger re-computation
  ]);

  const handleAddNode = useCallback(
    (nodeData: { type: string; label: string; summary: string; tags: string[]; domain?: string; ring?: number; department?: string }) => {
      const newNodeId = `${nodes.length + 1}`;
      const centerId = centerNodeIdRef.current || "center";
      const normalizedDomain = nodeData.domain ?? getDomainForNodeType(nodeData.type);
      const normalizedRing = Math.max(1, nodeData.ring ?? 1);
      const calculatedPosition = calculateNewNodePosition(nodes, centerId, {
        domain: normalizedDomain,
        type: nodeData.type,
        ring: normalizedRing,
      });
      const newNode = {
        id: newNodeId,
        type: "custom",
        position: edgePosition ?? calculatedPosition,
        data: {
          label: nodeData.label,
          type: nodeData.type as any,
          summary: nodeData.summary,
          tags: nodeData.tags,
          domain: normalizedDomain,
          ring: normalizedRing,
          department: nodeData.department,
          cards: [],
          isNew: true,
        } as CustomNodeData,
      };

      // Add the new node first
      const updatedNodes = [...nodes, newNode];
      setNodes(updatedNodes);
      
      // Remove isNew flag after animation completes
      setTimeout(() => {
        setNodes((nds) =>
          nds.map((node) =>
            node.id === newNodeId
              ? { ...node, data: { ...node.data, isNew: false } }
              : node
          )
        );
      }, 2000);
      
      // If this was dragged from a source node or added from an edge, create connections
      if (dragSourceNodeId) {
        const newEdge = {
          id: `e${dragSourceNodeId}-${newNodeId}`,
          source: dragSourceNodeId,
          target: newNodeId,
          type: "custom",
        };
        
        setEdges((eds) => {
          let updatedEdges = [...eds];
          
          // If this was added from an edge button (we have edgeToReplace info)
          if (edgeToReplace) {
            // Option 1: Insert node into the edge (source -> new node -> original target)
            // Remove the original edge
            updatedEdges = updatedEdges.filter(e => e.id !== edgeToReplace.id);
            
            // Add edge from source to new node
            updatedEdges.push(newEdge);
            
            // Add edge from new node to original target (if target exists)
            if (edgeToReplace.targetNodeId) {
              updatedEdges.push({
                id: `e${newNodeId}-${edgeToReplace.targetNodeId}`,
                source: newNodeId,
                target: edgeToReplace.targetNodeId,
                type: "custom",
              });
            }
          } else {
            // Regular node creation from drag handle
          updatedEdges.push(newEdge);
          }
          
          // Use the updated nodes array that includes the new node
          return updateEdgesWithOptimalHandles(updatedNodes, updatedEdges, centerId);
        });
      }
      
      setIsSaved(false);
      setEdgePosition(null);
      setDragSourceNodeId(null);
      setEdgeToReplace(null); // Clear edge replacement info
      setDragPreview(null); // Clear the locked preview after node is added
      setIsPlacingNode(false);
      setPlacingNodeInfo(null);
      setPendingWizardPrompt(null);
      toast.success("Node added successfully");
    },
    [nodes, setNodes, edgePosition, dragSourceNodeId, edgeToReplace, setEdges]
  );

  // Edge context menu handler
  const onEdgeContextMenuHandler = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    const relationshipType = edge.data?.relationshipType as RelationshipType | undefined;
    setEdgeContextMenu({
      isOpen: true,
      position: { x: event.clientX, y: event.clientY },
      edgeId: edge.id,
      relationshipType,
    });
  }, []);

  const handleSave = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) {
        toast.error("Workspace name is required", {
          description: "Please enter a workspace name before saving.",
        });
        return;
      }
      try {
        await persistWorkspace({ renameTo: trimmed, toastOnSuccess: true, force: true });
      } catch {
        // Errors are toasted inside persistWorkspace
      }
    },
    [persistWorkspace]
  );

  const handleLoad = useCallback((id: string) => {
    toast.success("Workspace loaded", {
      description: "Your workspace has been restored",
    });
    setIsSaved(true);
    setWorkspaceId(id);
    if (typeof window !== "undefined") {
      localStorage.setItem(WORKSPACE_ID_STORAGE_KEY, id);
    }
  }, []);

  const handleAutoLayout = useCallback(async () => {
    let layoutedNodes;
    const centerId = centerNodeIdRef.current || "center";
    
    if (viewMode === "radial") {
      // Optional: clear pins so layout can reposition all nodes again
      clearPins();
      setNodes((nds) => nds.map((n) => (n?.data?.pinned ? { ...n, data: { ...(n.data || {}), pinned: false } } : n)));
      // Use domain-based radial layout
      const source = nodes.map((n) =>
        !isCenterNode(n) && (n as any)?.data?.pinned
          ? { ...n, data: { ...(n.data || {}), pinned: false } }
          : n
      );
      layoutedNodes = applyDomainRadialLayout(source, {
        centerNodeId: centerId,
        viewMode: "radial",
        viewportDimensions: { width: window.innerWidth, height: window.innerHeight },
        dimensions: nodeDimensionsRef.current,
      });
      recordRadialBaseline(layoutedNodes);
    } else {
      // Use process layout
      layoutedNodes = applyDomainRadialLayout(nodes, {
        centerNodeId: centerId,
        viewMode: "process",
        viewportDimensions: { width: window.innerWidth, height: window.innerHeight },
        dimensions: nodeDimensionsRef.current,
        padding: relaxPadding,
      });
      lastRadialBaseRef.current = null;
    }
    
    // Enable smooth transitions
    setIsAutoLayouting(true);
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[layout] calling relax', { fit: true, padding: relaxPadding, pinned: Array.from(pinnedRef.current) });
    }
    await applyLayoutAndRelax(layoutedNodes, {
      padding: relaxPadding,
      maxPasses: 10,
      fit: true,
      fixedIds: [centerId, ...Array.from(pinnedRef.current)],
    });
    setIsSaved(false);
    
    // Disable transitions after animation completes
    setTimeout(() => {
      setIsAutoLayouting(false);
    }, 600);
    
    toast.success("Layout applied", {
      description: viewMode === "radial" 
        ? "Nodes organized by domain in radial layout" 
        : "Nodes organized in process flow",
    });
  }, [nodes, viewMode, applyLayoutAndRelax, relaxPadding, recordRadialBaseline, isCenterNode]);

  const handleAlign = useCallback((alignmentType: AlignmentType) => {
    // Enable smooth transitions
    setIsAutoLayouting(true);
    
    if (alignmentType === "distributeHorizontal") {
      const distributedNodes = distributeNodes(nodes, "horizontal");
      setNodes(distributedNodes);
      toast.success("Nodes distributed horizontally");
    } else if (alignmentType === "distributeVertical") {
      const distributedNodes = distributeNodes(nodes, "vertical");
      setNodes(distributedNodes);
      toast.success("Nodes distributed vertically");
    } else {
      const alignedNodes = alignNodes(nodes, alignmentType);
      setNodes(alignedNodes);
      const alignmentNames: Record<string, string> = {
        left: "left",
        right: "right",
        top: "top",
        bottom: "bottom",
        centerHorizontal: "center (horizontal)",
        centerVertical: "center (vertical)",
      };
      toast.success(`Nodes aligned ${alignmentNames[alignmentType]}`);
    }
    
    // Disable transitions after animation completes
    setTimeout(() => {
      setIsAutoLayouting(false);
    }, 600);
    
    setIsSaved(false);
  }, [nodes, setNodes]);

  // Add callbacks to edges - Optimized with useMemo for performance
  const edgesWithCallbacks = useMemo(() => {
    return edges
      .filter(edge => {
        // Only keep edges where both source and target nodes exist
        if (!edge || !edge.id || !edge.source || !edge.target) {
          console.warn('Invalid edge filtered:', edge);
          return false;
        }
        const sourceExists = nodes.some(n => n && n.id === edge.source);
        const targetExists = nodes.some(n => n && n.id === edge.target);
        if (!sourceExists || !targetExists) {
          console.warn('Edge references non-existent node:', edge);
          return false;
        }
        return true;
      })
      .map((edge) => ({
        ...edge,
        data: {
          ...edge.data,
          sourceNodeId: edge.source,
          targetNodeId: edge.target,
          onAddNode: handleAddNodeFromEdge,
          onEdgeContextMenu: onEdgeContextMenuHandler,
        },
      }));
  }, [edges, nodes, handleAddNodeFromEdge, onEdgeContextMenuHandler]);

  const handleCompleteOnboarding = useCallback(() => {
    localStorage.setItem("flowforge-onboarding-seen", "true");
    setShowOnboarding(false);
    toast.success("Welcome to FlowForge! 🎉", {
      description: "Start building your visual requirements board",
    });
  }, []);

  const handleSkipOnboarding = useCallback(() => {
    localStorage.setItem("flowforge-onboarding-seen", "true");
    setShowOnboarding(false);
  }, []);

  const handleStartTutorial = useCallback(() => {
    setShowEmptyState(false);
    setShowOnboarding(true);
  }, []);

  const handleResetDemo = useCallback(() => {
    // Reset to just the center node
    initialCenterFitRef.current = false;
    setNodes([{
      id: "center",
      type: "center",
      position: { x: 0, y: 0 },
      style: { width: 360, height: 240 },
      draggable: false,
      selectable: false,
      data: {
        label: "Welcome to Strukt",
        description: "This blank canvas is yours. Click the button below to add your first node and start mapping your architecture.",
        icon: "🧭",
        link: "",
        buttonText: "Connect your Git or Wiki",
        secondaryButtonText: "Create your first node",
        // buttonAction will be added dynamically in nodesWithCallbacks
      } as CenterNodeData,
      positionAbsolute: { x: 0, y: 0 },
    }]);
    setEdges([]);
    
    // Clear onboarding flag to show tutorial again
    localStorage.removeItem("flowforge-onboarding-seen");
    
    // Show onboarding overlay
    setShowOnboarding(true);
    setShowEmptyState(false);
    
    toast.success("Demo reset!", {
      description: "Canvas cleared and onboarding will start",
    });
  }, [setNodes, setEdges]);

  // Track selection changes to show helpful hints
  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: Node[] }) => {
      if (selectedNodes.length > 1) {
        // Show hint on first multi-select (only once per session)
        const hasShownHint = sessionStorage.getItem('multiSelectHintShown');
        if (!hasShownHint) {
          toast.info("Multi-select active", {
            description: "Hold Shift to select more nodes",
          });
          sessionStorage.setItem('multiSelectHintShown', 'true');
        }
      }
      
      // Show alignment tools hint when 2+ nodes selected
      if (selectedNodes.length >= 2) {
        const hasShownAlignHint = sessionStorage.getItem('alignmentHintShown');
        if (!hasShownAlignHint) {
          toast.info("Alignment tools available", {
            description: "Use the toolbar to align selected nodes",
          });
          sessionStorage.setItem('alignmentHintShown', 'true');
        }
      }

      if (selectedNodes.length === 1) {
        setSelectedNodeId(selectedNodes[0].id);
      } else if (selectedNodes.length === 0) {
        setSelectedNodeId(null);
      }
    },
    []
  );

  const handleMarkIncorrectSuggestion = useCallback(
    async (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      try {
        await submitFeedback({
          nodeId,
          reason: "wrong",
          context: {
            label: (node.data as any)?.label,
            type: (node.data as any)?.type,
            summary: (node.data as any)?.summary,
          },
        });
        toast.success("Feedback noted", {
          description: "We’ll tune future suggestions.",
        });
      } catch (error) {
        console.error("Failed to submit feedback", error);
        toast.error("Could not send feedback", {
          description: "Please try again shortly.",
        });
      }
    },
    [nodes]
  );

  const handleAcceptSuggestions = useCallback(
    async (
      suggestions: SuggestedNode[],
      options?: {
        suggestionId?: string;
        renameTo?: string;
        centerSummary?: string;
        parentNodeId?: string;
      }
    ) => {
      if (!suggestions || suggestions.length === 0) {
        return;
      }

      try {
        let acceptedNodes = suggestions;

        if (!USE_MOCK_SUGGESTIONS && options?.suggestionId) {
          try {
            const applied = await applySuggestion(options.suggestionId);
            acceptedNodes = applied.nodes.length > 0 ? applied.nodes : suggestions;
          } catch (error) {
            console.error("Failed to confirm suggestion application", error);
          }
        }

        const centerId = centerNodeIdRef.current || "center";
        const { nodes: nodeResult, edges: edgeResult, createdNodeIds } = applySuggestions(
          acceptedNodes,
          nodes,
          edges,
          centerId,
          options?.parentNodeId
        );

        setEdges(edgeResult);

        const renameTo = options?.renameTo?.trim();
        const rawSummary = options?.centerSummary?.trim();
        const normalizedSummary = rawSummary
          ? rawSummary.replace(/\s+/g, " ").trim()
          : undefined;
        const summaryText = normalizedSummary && normalizedSummary.length > 320
          ? `${normalizedSummary.slice(0, 317)}…`
          : normalizedSummary;

        const viewportDimensions =
          typeof window !== "undefined"
            ? { width: window.innerWidth, height: window.innerHeight }
            : undefined;

        let layouted = applyDomainRadialLayout(nodeResult, {
          centerNodeId: centerId,
          viewMode: "radial",
          viewportDimensions,
        });

        if (renameTo || summaryText) {
          layouted = layouted.map((node) => {
            if (!isCenterNode(node)) return node;
            return {
              ...node,
              data: {
                ...(node.data || {}),
                ...(renameTo ? { label: renameTo } : {}),
                ...(summaryText ? { description: summaryText } : {}),
              },
            };
          });
        }

        await applyLayoutAndRelax(layouted, { padding: 12, maxPasses: 10, fit: true });

        if (createdNodeIds.length > 0) {
          setSelectedNodeId(createdNodeIds[createdNodeIds.length - 1]);
          setTimeout(() => {
            setNodes((nds: Node[]) =>
              nds.map((node) =>
                createdNodeIds.includes(node.id)
                  ? { ...node, data: { ...(node.data || {}), isNew: false } }
                  : node
              )
            );
          }, 2000);
        }

        if (renameTo && renameTo !== workspaceName) {
          setWorkspaceName(renameTo);
          if (typeof window !== "undefined") {
            localStorage.setItem(WORKSPACE_NAME_STORAGE_KEY, renameTo);
          }
          try {
            await persistWorkspace({ renameTo, force: true });
          } catch (err) {
            console.warn("Failed to persist renamed workspace", err);
          }
        }

        setIsSaved(false);
        setIsWizardOpen(false);
        setIsSuggestionPanelOpen(false);
      } catch (error) {
        console.error("Failed to apply AI suggestions", error);
        toast.error("Unable to apply AI suggestions", {
          description: "Please try again in a moment.",
        });
      }
    },
    [nodes, edges, applyLayoutAndRelax, setNodes, isCenterNode, persistWorkspace, setWorkspaceName, workspaceName]
  );

  const selectedNode = useMemo(
    () =>
      selectedNodeId ? nodes.find((node) => node.id === selectedNodeId) || null : null,
    [nodes, selectedNodeId]
  );

  useEffect(() => {
    if (!selectedNode) {
      setIsSuggestionPanelOpen(false);
    }
  }, [selectedNode]);

  // Track zoom changes
  const handleMove = useCallback(
    (_event: any, viewport: { x: number; y: number; zoom: number }) => {
      setZoomLevel(viewport.zoom);
    },
    []
  );



  // Canvas click handler for placing nodes
  const handlePaneClick = useCallback((event: React.MouseEvent) => {
    try {
      if (isPlacingNode && placingNodeInfo && reactFlowInstance) {
        // Stop event propagation to prevent React Flow's drag handlers from interfering
        event.stopPropagation();
        event.preventDefault();
        
        // LOCK the preview at the clicked position (don't clear it yet)
        // This keeps the ghost visible while user fills in modal
        const clickedPosition = { x: event.clientX, y: event.clientY };
        setDragPreview({
          start: placingNodeInfo.startPos,
          end: clickedPosition
        });
        
        // Stop tracking mouse movement
        setIsPlacingNode(false);
        setPlacingNodeInfo(null);
        
        // Place the node at cursor position
        const position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
        
        // Open the add node modal with the position
        handleDragNewNode(placingNodeInfo.nodeId, position);
      }
    } catch (error) {
      console.error('Error in handlePaneClick:', error);
      // Cleanup placing mode on error
      setIsPlacingNode(false);
      setPlacingNodeInfo(null);
      setDragPreview(null);
    }
  }, [isPlacingNode, placingNodeInfo, reactFlowInstance, handleDragNewNode]);

  // Canvas context menu handler
  const handlePaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setNodeContextMenu({ isOpen: false, position: { x: 0, y: 0 }, nodeId: null });
    setCanvasContextMenu({
      isOpen: true,
      position: { x: event.clientX, y: event.clientY },
    });
  }, []);

  const handleNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    event.stopPropagation();
    if (!node) return;

    setCanvasContextMenu({ isOpen: false, position: { x: 0, y: 0 } });
    setEdgeContextMenu({ isOpen: false, position: { x: 0, y: 0 }, edgeId: null });
    setNodeContextMenu({
      isOpen: true,
      position: { x: event.clientX, y: event.clientY },
      nodeId: node.id,
    });

    setNodes((nds) => {
      const target = nds.find((n) => n.id === node.id);
      if (target?.selected) {
        return nds;
      }
      return nds.map((n) => ({
        ...n,
        selected: n.id === node.id,
      }));
    });
  }, [setNodes]);

  const handleCloseContextMenu = useCallback(() => {
    setCanvasContextMenu({ isOpen: false, position: { x: 0, y: 0 } });
    setNodeContextMenu({ isOpen: false, position: { x: 0, y: 0 }, nodeId: null });
  }, []);

  const handleCloseNodeContextMenu = useCallback(() => {
    setNodeContextMenu({ isOpen: false, position: { x: 0, y: 0 }, nodeId: null });
  }, []);

  const handleCloseEdgeContextMenu = useCallback(() => {
    setEdgeContextMenu({ isOpen: false, position: { x: 0, y: 0 }, edgeId: null });
  }, []);

  // Change relationship type
  const handleChangeRelationshipType = useCallback((edgeId: string, type: RelationshipType) => {
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.id === edgeId) {
          return setRelationshipType(edge, type);
        }
        return edge;
      })
    );
    toast.success("Relationship updated", {
      description: `Changed to: ${getRelationshipLabel(type)}`,
    });
    history.current.addState(nodes, edges);
  }, [nodes, edges, setEdges]);

  // Delete edge
  const handleDeleteEdge = useCallback((edgeId: string) => {
    setEdges((eds) => eds.filter((edge) => edge.id !== edgeId));
    toast.success("Connection deleted");
    history.current.addState(nodes, edges);
  }, [nodes, edges, setEdges]);

  // Drag handlers to prevent errors during drag operations
  const handleNodeDragStart = useCallback((_event: React.MouseEvent, node: Node) => {
    try {
      if (!node || !node.id) {
        console.warn('Invalid node in drag start');
        return;
      }
      if (isCenterNode(node)) return;
      setIsUserDragging(true);
      // Immediately pin the node so subsequent relax/layout passes won’t move it
      setNodes((nds) => nds.map((n) => (n.id === node.id ? { ...n, data: { ...(n.data || {}), pinned: true } } : n)));
    } catch (error) {
      console.error('Error in handleNodeDragStart:', error);
    }
  }, [setNodes, isCenterNode]);

  const handleNodeDrag = useCallback((_event: React.MouseEvent, node: Node) => {
    try {
      // Validate node exists
      if (!node || !node.id) {
        console.warn('Invalid node in drag');
        return;
      }
      if (isCenterNode(node)) return;
      // Safe no-op handler during drag
    } catch (error) {
      console.error('Error in handleNodeDrag:', error);
    }
  }, [isCenterNode]);

  const handleNodeDragStop = useCallback(
    async (_event: React.MouseEvent, node: Node) => {
      try {
        if (!node || !node.id) return;
        if (isCenterNode(node)) return;

        // Mark as unsaved after drag completes
        setIsSaved(false);
        setIsUserDragging(false);

        // In radial mode, persist pin in memory and on node data so relax/layout skip moving it
        if (viewMode === 'radial') {
          pinnedRef.current.add(node.id);
          setNodes((nds) =>
            nds.map((n) => (n.id === node.id ? { ...n, data: { ...(n.data || {}), pinned: true } } : n))
          );
        }

        // Relax-only pass respecting pins: do not recompute base layout, just space neighbors
        const current =
          typeof reactFlowInstance?.getNodes === 'function'
            ? (reactFlowInstance!.getNodes() as Node[])
            : nodes;
        await relaxRespectingPins(current, { padding: relaxPadding, maxPasses: 6 });
      } catch (error) {
        console.error('Error in handleNodeDragStop:', error);
      }
    },
    [reactFlowInstance, setNodes, relaxRespectingPins, relaxPadding, viewMode, nodes, isCenterNode]
  );

  // Context menu action handlers
  const handleContextMenuAddNode = useCallback(() => {
    launchNodeCreator();
  }, [launchNodeCreator]);

  const handleContextMenuSelectAll = useCallback(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        selected: isCenterNode(node) ? false : true,
      }))
    );
    toast.success("All nodes selected");
  }, [setNodes, isCenterNode]);

  const handleContextMenuDeleteSelected = useCallback(() => {
    const selectedNodes = nodes.filter(n => n.selected);
    if (selectedNodes.length === 0) {
      toast.info("No nodes selected");
      return;
    }

    // Don't allow deleting the center node
    const nodesToDelete = selectedNodes.filter((n) => !isCenterNode(n));
    if (nodesToDelete.length === 0) {
      toast.error("Cannot delete the center node");
      return;
    }

    setNodes((nds) => nds.filter((n) => !n.selected || isCenterNode(n)));
    setEdges((eds) => eds.filter(e => {
      const sourceSelected = selectedNodes.find(n => n.id === e.source);
      const targetSelected = selectedNodes.find(n => n.id === e.target);
      return !sourceSelected && !targetSelected;
    }));
    setIsSaved(false);
    toast.success(`Deleted ${nodesToDelete.length} node${nodesToDelete.length > 1 ? 's' : ''}`, {
      description: "Removed selected nodes",
    });
  }, [nodes, setNodes, setEdges, isCenterNode]);

  // Export handlers
  const handleExportPNG = useCallback(async () => {
    try {
      const nodesBounds = getNodesBounds(nodes);
      const viewport = reactFlowInstance.getViewport();
      const transform: [number, number, number] = [viewport.x, viewport.y, viewport.zoom];
      
      await exportToPNG(nodesBounds, transform, {
        fileName: `${workspaceName.replace(/\s+/g, '-').toLowerCase()}.png`,
        backgroundColor: '#f9fafb',
        imageWidth: 2400,
        imageHeight: 1600,
      });
      
      toast.success("Exported as PNG", {
        description: "Canvas saved successfully",
      });
    } catch (error) {
      toast.error("Export failed", {
        description: "Could not export canvas as PNG",
      });
    }
  }, [nodes, reactFlowInstance, workspaceName]);

  const handleExportSVG = useCallback(async () => {
    try {
      const nodesBounds = getNodesBounds(nodes);
      const viewport = reactFlowInstance.getViewport();
      const transform: [number, number, number] = [viewport.x, viewport.y, viewport.zoom];
      
      await exportToSVG(nodesBounds, transform, {
        fileName: `${workspaceName.replace(/\s+/g, '-').toLowerCase()}.svg`,
        backgroundColor: '#f9fafb',
        imageWidth: 2400,
        imageHeight: 1600,
      });
      
      toast.success("Exported as SVG", {
        description: "Canvas saved successfully",
      });
    } catch (error) {
      toast.error("Export failed", {
        description: "Could not export canvas as SVG",
      });
    }
  }, [nodes, reactFlowInstance, workspaceName]);

  const handleExportMarkdown = useCallback(() => {
    try {
      const markdown = exportToMarkdown(nodes, edges, workspaceName);
      downloadMarkdown(markdown, `${workspaceName.replace(/\s+/g, '-').toLowerCase()}-docs.md`);
      
      toast.success("Exported as Markdown", {
        description: "Documentation generated successfully",
      });
    } catch (error) {
      toast.error("Export failed", {
        description: "Could not generate markdown documentation",
      });
    }
  }, [nodes, edges, workspaceName]);

  // Individual node export handlers
  const handleExportNodeJSON = useCallback((nodeId: string) => {
    try {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) {
        toast.error("Node not found");
        return;
      }
      
      exportNodeAsJSON(node, edges);
      
      toast.success("Exported as JSON", {
        description: `${node.data.label} data saved`,
      });
    } catch (error) {
      toast.error("Export failed", {
        description: "Could not export node as JSON",
      });
    }
  }, [nodes, edges]);

  const handleExportNodeMarkdown = useCallback((nodeId: string) => {
    try {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) {
        toast.error("Node not found");
        return;
      }
      
      exportNodeAsMarkdown(node, edges, nodes);
      
      toast.success("Exported as Markdown", {
        description: `${node.data.label} documentation saved`,
      });
    } catch (error) {
      toast.error("Export failed", {
        description: "Could not export node as Markdown",
      });
    }
  }, [nodes, edges]);

  const handleCopyNodeData = useCallback(async (nodeId: string) => {
    try {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) {
        toast.error("Node not found");
        return;
      }
      
      await copyNodeToClipboard(node, edges, nodes);
      
      toast.success("Copied to clipboard", {
        description: `${node.data.label} data copied`,
      });
    } catch (error) {
      toast.error("Copy failed", {
        description: "Could not copy node data",
      });
    }
  }, [nodes, edges]);

  // CSV export handlers
  const handleExportCSV = useCallback(() => {
    try {
      const { exportAsCSV } = require('./utils/export');
      exportAsCSV(nodes, edges);
      
      toast.success("Exported as CSV", {
        description: "Node data exported for analysis",
      });
    } catch (error) {
      toast.error("Export failed", {
        description: "Could not export as CSV",
      });
    }
  }, [nodes, edges]);

  const handleExportConnectionsCSV = useCallback(() => {
    try {
      const { exportConnectionsAsCSV } = require('./utils/export');
      exportConnectionsAsCSV(edges, nodes);
      
      toast.success("Exported connections as CSV", {
        description: "Edge data exported for analysis",
      });
    } catch (error) {
      toast.error("Export failed", {
        description: "Could not export connections as CSV",
      });
    }
  }, [nodes, edges]);

  // Subgraph export handlers
  const handleExportSubgraphJSON = useCallback((nodeId: string) => {
    try {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) {
        toast.error("Node not found");
        return;
      }
      
      exportSubgraphAsJSON(node, edges, nodes);
      
      toast.success("Exported subgraph as JSON", {
        description: `${node.data.label} and connected nodes saved`,
      });
    } catch (error) {
      toast.error("Export failed", {
        description: "Could not export subgraph as JSON",
      });
    }
  }, [nodes, edges]);

  const handleExportSubgraphMarkdown = useCallback((nodeId: string) => {
    try {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) {
        toast.error("Node not found");
        return;
      }
      
      exportSubgraphAsMarkdown(node, edges, nodes);
      
      toast.success("Exported subgraph as Markdown", {
        description: `${node.data.label} and connected nodes documented`,
      });
    } catch (error) {
      toast.error("Export failed", {
        description: "Could not export subgraph as Markdown",
      });
    }
  }, [nodes, edges]);

  // Batch export handler
  const handleExportBatch = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected && !isCenterNode(n));
    
    if (selectedNodes.length === 0) {
      toast.info("No nodes selected", {
        description: "Select nodes to export them together",
      });
      return;
    }

    try {
      // Export both JSON and Markdown for batch
      exportBatchAsJSON(selectedNodes, edges);
      
      toast.success(`Exported ${selectedNodes.length} nodes`, {
        description: "Batch export completed as JSON",
        action: {
          label: "Also as MD",
          onClick: () => {
            exportBatchAsMarkdown(selectedNodes, edges, nodes);
            toast.success("Markdown export complete");
          },
        },
      });
    } catch (error) {
      toast.error("Batch export failed", {
        description: "Could not export selected nodes",
      });
    }
  }, [nodes, edges, isCenterNode]);

  // Import handler
  const handleImport = useCallback((data: any, importType: 'single' | 'multiple' | 'subgraph') => {
    try {
      const viewport = reactFlowInstance.getViewport();
      const centerX = (window.innerWidth / 2 - viewport.x) / viewport.zoom;
      const centerY = (window.innerHeight / 2 - viewport.y) / viewport.zoom;

      if (importType === 'single') {
        const result = importNodeFromJSON(data, { x: centerX - 140, y: centerY - 100 }, nodes);
        
        if (!result.success) {
          toast.error("Import failed", {
            description: result.error || "Could not import node",
          });
          return;
        }

        setNodes((nds) => [...nds, result.node]);
        setIsSaved(false);
        
        toast.success("Node imported", {
          description: `Added "${result.node.data.label}" to canvas`,
        });
      } else if (importType === 'multiple' || importType === 'subgraph') {
        const dataArray = Array.isArray(data) ? data : data.nodes;
        const result = importMultipleNodesFromJSON(dataArray, { x: centerX - 300, y: centerY - 200 }, nodes);
        
        if (!result.success) {
          toast.error("Import failed", {
            description: result.error || "Could not import nodes",
          });
          return;
        }

        setNodes((nds) => [...nds, ...result.nodes]);
        
        if (result.edges.length > 0) {
          setEdges((eds) => [...eds, ...result.edges]);
        }
        
        setIsSaved(false);
        
        toast.success(`Imported ${result.nodes.length} nodes`, {
          description: importType === 'subgraph' ? "Subgraph restored with connections" : "Nodes added to canvas",
        });
      }
    } catch (error) {
      toast.error("Import failed", {
        description: "An error occurred during import",
      });
    }
  }, [nodes, edges, setNodes, setEdges, reactFlowInstance]);

  // Template handlers
  const handleLoadTemplate = useCallback((template: Template) => {
    try {
      if (
        !template ||
        !Array.isArray(template.nodes) ||
        !Array.isArray(template.edges)
      ) {
        toast.error("Template data is invalid", {
          description: "Unable to apply this template. Please try another one.",
        });
        return;
      }

      // Clear existing nodes and edges (except we'll replace everything)
      setNodes(template.nodes);
      setEdges(template.edges);
      
      const nextName = template.name?.trim() ?? "";
      const shouldRename = Boolean(nextName && nextName !== workspaceName);

      if (shouldRename) {
        setWorkspaceName(nextName);
      }
      
      // Reset saved state
      setIsSaved(false);

      // Persist new structure (and rename if applicable)
      setTimeout(() => {
        persistWorkspace({
          force: true,
          ...(shouldRename ? { renameTo: nextName } : {}),
        }).catch(() => {
          /* errors surfaced by persistWorkspace */
        });
      }, 0);
      
      // Center view on the new template
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2, duration: 400 });
        if (layoutDebug) requestAnimationFrame(() => devOutlineCollisions(12));
      }, 100);
      
      toast.success(`Template "${template.name}" loaded`, {
        description: `${template.nodes.length} nodes, ${template.edges.length} connections`,
      });
    } catch (error) {
      console.error("Error loading template:", error);
      toast.error("Failed to load template");
    }
  }, [setNodes, setEdges, setWorkspaceName, reactFlowInstance, layoutDebug, persistWorkspace, workspaceName]);

  // Auto-snapshot on significant changes
  useEffect(() => {
    const now = Date.now();
    const timeSinceLastSnapshot = now - lastAutoSnapshotTime.current;
    
    // Create auto-snapshot every 5 minutes if there are changes
    if (timeSinceLastSnapshot > 5 * 60 * 1000 && nodes.length > 1) {
      const snapshots = getSnapshots();
      const lastSnapshot = snapshots.find(s => s.isAutoSnapshot);
      
      if (!lastSnapshot || 
          lastSnapshot.metadata.nodeCount !== nodes.length ||
          lastSnapshot.metadata.edgeCount !== edges.length) {
        createAutoSnapshot(nodes, edges);
        lastAutoSnapshotTime.current = now;
      }
    }
  }, [nodes, edges]);

  // Snapshots handler
  const handleRestoreSnapshot = useCallback((restoredNodes: Node[], restoredEdges: Edge[]) => {
    setNodes(restoredNodes);
    setEdges(restoredEdges);
    setIsSaved(false);
    
    // Center view on restored content
    setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.2, duration: 400 });
      if (layoutDebug) requestAnimationFrame(() => devOutlineCollisions(12));
    }, 100);
    
    toast.success("Snapshot restored", {
      description: `${restoredNodes.length} nodes, ${restoredEdges.length} connections`,
    });
  }, [setNodes, setEdges, reactFlowInstance, layoutDebug]);

  // Relationships handlers
  const handleHighlightNodes = useCallback((nodeIds: string[]) => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        selected: nodeIds.includes(node.id),
      }))
    );
  }, [setNodes]);

  const handleUpdateEdgeRelationship = useCallback((edgeId: string, data: Partial<Edge>) => {
    setEdges((eds) =>
      eds.map((edge) =>
        edge.id === edgeId
          ? { ...edge, ...data }
          : edge
      )
    );
    setIsSaved(false);
  }, [setEdges]);

  const handleCreateRelationshipEdge = useCallback((source: string, target: string, type: RelationshipType) => {
    const newEdge: Edge = {
      id: `edge-${source}-${target}-${Date.now()}`,
      source,
      target,
      type: "custom",
      data: { relationshipType: type },
    };
    
    const centerId = centerNodeIdRef.current || "center";
    setEdges((eds) => {
      const updatedEdges = [...eds, newEdge];
      return updateEdgesWithOptimalHandles(nodes, updatedEdges, centerId);
    });
    setIsSaved(false);
    
    toast.success("Relationship created", {
      description: `Added ${type} relationship`,
    });
  }, [setEdges, nodes]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        isEditingText
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const metaKey = isMac ? event.metaKey : event.ctrlKey;

      // Cmd/Ctrl + N - Add Node
      if (metaKey && event.key === 'n') {
        event.preventDefault();
        launchNodeCreator();
      }

      // Cmd/Ctrl + I - Import
      if (metaKey && event.key === 'i') {
        event.preventDefault();
        setIsImportModalOpen(true);
      }

      // Cmd/Ctrl + Shift + T - Template Gallery
      if (metaKey && event.shiftKey && event.key === 'T') {
        event.preventDefault();
        setIsTemplateGalleryOpen(true);
      }

      // Cmd/Ctrl + Shift + S - Save as Template
      if (metaKey && event.shiftKey && event.key === 'S') {
        event.preventDefault();
        setIsSaveTemplateDialogOpen(true);
      }

      // Cmd/Ctrl + E - Export Batch (if nodes selected) OR AI Enrich with Shift
      if (metaKey && !event.shiftKey && event.key === 'e') {
        event.preventDefault();
        const selectedCount = nodes.filter(n => n.selected).length;
        if (selectedCount > 0) {
          handleExportBatch();
        } else {
          toast.info("No nodes selected", {
            description: "Select nodes to export them together",
          });
        }
      }

      // Cmd/Ctrl + Shift + E - AI Enrich (if single node selected)
      if (metaKey && event.shiftKey && event.key === 'E') {
        event.preventDefault();
        const selectedNodes = nodes.filter((n) => n.selected && !isCenterNode(n));
        if (selectedNodes.length === 1) {
          handleOpenEnrichment(selectedNodes[0].id);
        } else if (selectedNodes.length === 0) {
          toast.info("No node selected", {
            description: "Select a node to enrich it with AI",
          });
        } else {
          toast.info("Multiple nodes selected", {
            description: "Select a single node to enrich with AI",
          });
        }
      }

      // Cmd/Ctrl + D - Duplicate Selected
      if (metaKey && event.key === 'd') {
        event.preventDefault();
        handleDuplicateSelected();
      }

      // Cmd/Ctrl + A - Select All
      if (metaKey && event.key === 'a') {
        event.preventDefault();
        handleContextMenuSelectAll();
      }

      // Cmd/Ctrl + 0 - Fit View
      if (metaKey && event.key === '0') {
        event.preventDefault();
        handleFitView();
      }

      // Cmd/Ctrl + K - Command Palette
      if (metaKey && event.key === 'k') {
        event.preventDefault();
        setIsCommandPaletteOpen(true);
      }

      // Cmd/Ctrl + F - Search
      if (metaKey && event.key === 'f') {
        event.preventDefault();
        setIsSearchPanelOpen(true);
      }

      // Cmd/Ctrl + Z - Undo
      if (metaKey && !event.shiftKey && event.key === 'z') {
        event.preventDefault();
        handleUndo();
      }

      // Cmd/Ctrl + Shift + Z - Redo
      if (metaKey && event.shiftKey && event.key === 'z') {
        event.preventDefault();
        handleRedo();
      }

      // Cmd/Ctrl + Shift + V - Snapshots
      if (metaKey && event.shiftKey && event.key === 'V') {
        event.preventDefault();
        setIsSnapshotsPanelOpen(true);
      }

      // Cmd/Ctrl + Shift + R - Relationships
      if (metaKey && event.shiftKey && event.key === 'R') {
        event.preventDefault();
        setIsRelationshipsPanelOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    nodes,
    isEditingText,
    handleExportBatch,
    handleExportPNG,
    handleDuplicateSelected,
    handleContextMenuSelectAll,
    handleFitView,
    handleUndo,
    handleRedo,
    handleOpenEnrichment,
    isCenterNode,
    launchNodeCreator
  ]);

  const handleViewModeChange = useCallback(async (newViewMode: "radial" | "process") => {
    if (isUserDragging) return;
    setViewMode(newViewMode);
    const centerId = centerNodeIdRef.current || "center";

    if (newViewMode === 'radial') {
      // Clear in-memory pins and data flags so base radial layout can reposition everything
      clearPins();
      setNodes((nds) => nds.map((n) => (!isCenterNode(n) && (n as any)?.data?.pinned
        ? { ...n, data: { ...(n.data || {}), pinned: false } }
        : n)));

      const currentRaw = typeof reactFlowInstance?.getNodes === 'function'
        ? (reactFlowInstance!.getNodes() as Node[])
        : nodes;
      const current = currentRaw.map((n) =>
        !isCenterNode(n) && (n as any)?.data?.pinned
          ? { ...n, data: { ...(n.data || {}), pinned: false } }
          : n
      );

      const layouted = applyDomainRadialLayout(current, {
        centerNodeId: centerId,
        viewMode: 'radial',
        viewportDimensions: { width: window.innerWidth, height: window.innerHeight },
        dimensions: nodeDimensionsRef.current,
      });

      if (process.env.NODE_ENV !== 'production') {
        console.debug('[layout] calling relax', { fit: true, padding: relaxPadding, pinned: Array.from(pinnedRef.current) });
      }
      setIsAutoLayouting(true);
      recordRadialBaseline(layouted);
      await applyLayoutAndRelax(layouted, {
        padding: relaxPadding,
        maxPasses: 10,
        fit: true,
        fixedIds: [centerId, ...Array.from(pinnedRef.current)],
      });
      setTimeout(() => setIsAutoLayouting(false), 600);
      setIsSaved(false);
      return;
    }

    // Process layout unchanged
    const layoutedNodes = applyDomainRadialLayout(nodes, {
      centerNodeId: centerId,
      viewMode: 'process',
      viewportDimensions: { width: window.innerWidth, height: window.innerHeight },
      dimensions: nodeDimensionsRef.current,
      padding: relaxPadding,
    });
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[layout] calling relax', { fit: false, padding: relaxPadding, pinned: Array.from(pinnedRef.current) });
    }
    lastRadialBaseRef.current = null;
    await applyLayoutAndRelax(layoutedNodes, {
      padding: relaxPadding,
      maxPasses: 10,
      fit: false,
      fixedIds: [centerId, ...Array.from(pinnedRef.current)],
    });
    setIsSaved(false);
  }, [clearPins, isUserDragging, nodes, reactFlowInstance, relaxPadding, applyLayoutAndRelax, setNodes, recordRadialBaseline, isCenterNode]);

  // Debug: adjust relax padding live and re-run relaxation
  const handleRelaxPaddingChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setRelaxPadding(value);
    const current = typeof reactFlowInstance.getNodes === 'function' ? (reactFlowInstance.getNodes() as Node[]) : nodes;
    // Re-run relaxation on current positions without refit to make change visible in place
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[layout] calling relax', { fit: false, padding: value, pinned: Array.from(pinnedRef.current) });
    }
    const centerId = centerNodeIdRef.current || "center";
    applyLayoutAndRelax(current, {
      padding: value,
      maxPasses: 10,
      fit: false,
      fixedIds: [centerId, ...Array.from(pinnedRef.current)],
    }).then(() => {
      if (layoutDebug) requestAnimationFrame(() => devOutlineCollisions(value));
    });
  }, [reactFlowInstance, nodes, applyLayoutAndRelax, layoutDebug]);

  // DEV: Load a deterministic collision seed and auto-layout it
  const handleLoadCollisionSeed = useCallback(async () => {
    try {
      if (isUserDragging) return;
      const raw: any = seed as any;
      const nodesFromSeed: Node[] = (raw.nodes || []).map((n: any) => ({
        id: n.id,
        type: n.type,
        position: n.position || { x: 0, y: 0 },
        style: n.style,
        data: n.data,
      }));
      const edgesFromSeed: Edge[] = (raw.edges || []).map((e: any) => ({
        id: e.id || `${e.source}-${e.target}`,
        source: e.source,
        target: e.target,
        type: 'custom',
      }));
      const centerId = centerNodeIdRef.current || "center";

      const layouted = applyDomainRadialLayout(nodesFromSeed, {
        centerNodeId: centerId,
        viewMode: 'radial',
        viewportDimensions: { width: window.innerWidth, height: window.innerHeight },
        dimensions: nodeDimensionsRef.current,
      });
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[layout] calling relax', { fit: true, padding: relaxPadding, pinned: Array.from(pinnedRef.current) });
      }
      setIsAutoLayouting(true);
      recordRadialBaseline(layouted);
      await applyLayoutAndRelax(layouted, {
        padding: relaxPadding,
        maxPasses: 10,
        fit: true,
        fixedIds: [centerId, ...Array.from(pinnedRef.current)],
      });
      setTimeout(() => setIsAutoLayouting(false), 600);

      toast.success('Loaded collision seed');
    } catch (err) {
      console.error('Failed to load seed:', err);
      toast.error('Failed to load seed');
    }
  }, [reactFlowInstance, layoutDebug, applyLayoutAndRelax, relaxPadding, isUserDragging, recordRadialBaseline]);

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-slate-50 via-indigo-100/60 to-purple-100/60 animate-gradient-slow bg-[length:200%_200%]">
      <div ref={reactFlowWrapperRef} className="w-full h-full">
        <ReactFlow
          nodes={nodesWithCallbacks}
          edges={edgesWithCallbacks}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
      onConnectStart={onConnectStart}
      onConnectEnd={onConnectEnd}
          isValidConnection={(connection) => {
            // Ensure connections originate from a -source handle and end on a -target handle (if provided)
            const sh = connection.sourceHandle ?? '';
            if (!/^(top|right|bottom|left)-source$/.test(String(sh))) {
              return false;
            }
            if (connection.targetHandle) {
              const th = connection.targetHandle;
              if (!/^(top|right|bottom|left)-target$/.test(String(th))) return false;
            }
            return true;
          }}
          onSelectionChange={handleSelectionChange}
          onMove={handleMove}
          onPaneClick={handlePaneClick}
          onPaneContextMenu={handlePaneContextMenu}
          onEdgeContextMenu={onEdgeContextMenuHandler}
          onNodeContextMenu={handleNodeContextMenu}
          onNodeDragStart={handleNodeDragStart}
          onNodeDrag={handleNodeDrag}
          onNodeDragStop={handleNodeDragStop}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          minZoom={0.1}
          maxZoom={5}
          multiSelectionKeyCode="Shift"
          selectionOnDrag={false}
          panOnDrag={[1, 2]}
          deleteKeyCode="Delete"
          connectOnClick
          connectionMode="loose"
          connectionLineComponent={CustomConnectionLine}
          connectionLineStyle={{
            stroke: '#818cf8',
            strokeWidth: 3,
          }}
          connectionLineType="smoothstep"
          className={`bg-transparent ${isAutoLayouting ? 'auto-layouting' : ''}`}
          nodesDraggable={true}
          nodesConnectable={true}
          elevateNodesOnSelect={false}
          autoPanOnNodeDrag={false}
        >
          <Background
            gap={24}
            size={1.5}
            color="#e0e7ff"
            className="opacity-40"
            variant={BackgroundVariant.Dots}
          />

          <Controls className="!hidden" />

          {/* Domain Rings Overlay */}
          {viewMode === "radial" && showDomainRings && (() => {
            const centerNode = nodes.find((n) => isCenterNode(n));
            if (!centerNode) return null;
            const centerMeasured = nodeDimensionsRef.current?.[centerNode.id];
            const centerWidth =
              parseDimensionValue(centerMeasured?.width) ??
              parseDimensionValue(centerNode.width) ??
              parseDimensionValue(centerNode.style?.width) ??
              360;
            const centerHeight =
              parseDimensionValue(centerMeasured?.height) ??
              parseDimensionValue(centerNode.height) ??
              parseDimensionValue(centerNode.style?.height) ??
              240;
            const centerX = (centerNode.position?.x ?? 0) + centerWidth / 2;
            const centerY = (centerNode.position?.y ?? 0) + centerHeight / 2;
            return <DomainRings centerX={centerX} centerY={centerY} />;
          })()}
        </ReactFlow>
      </div>

      {layoutDebug && (
        <div className="fixed left-4 bottom-4 z-50 rounded-md bg-white/90 backdrop-blur px-3 py-3 shadow border border-indigo-200 w-[260px]">
          <div className="text-[11px] font-semibold text-slate-700 mb-2">Layout Debug</div>
          <label className="block text-[11px] text-slate-600 mb-1">Relax padding: <span className="font-mono">{relaxPadding}px</span></label>
          <input
            type="range"
            min={8}
            max={40}
            step={1}
            value={relaxPadding}
            onChange={handleRelaxPaddingChange}
            className="w-full accent-indigo-600 cursor-pointer"
          />
          <button
            onClick={handleAutoLayout}
            className="mt-3 w-full rounded-md bg-indigo-600 text-white px-3 py-2 shadow hover:bg-indigo-700 text-sm"
          >
            Organize
          </button>
          <button
            onClick={handleLoadCollisionSeed}
            className="mt-3 w-full rounded-md bg-red-600 text-white px-3 py-2 shadow hover:bg-red-700 text-sm"
          >
            Load Collision Seed
          </button>
        </div>
      )}

      {/* Minimap Panel */}
      <MinimapPanel />

      {/* Drag Preview Overlay */}
      <AnimatePresence mode="wait">
        {dragPreview && (
          <DragPreviewOverlay
            key="drag-preview"
            start={dragPreview.start}
            end={dragPreview.end}
          />
        )}
      </AnimatePresence>

      <SuggestionPanel
        node={selectedNode}
        workspaceId={workspaceId}
        sessionId={wizardSessionId}
        onAdd={handleAcceptSuggestions}
        isOpen={isSuggestionPanelOpen}
        onClose={() => setIsSuggestionPanelOpen(false)}
        refreshKey={suggestionPanelRefresh}
      />

      <Toolbar
        onAddNode={() => {
          setShowEmptyState(false);
          launchNodeCreator();
        }}
        onConnect={() => setIsConnectModalOpen(true)}
        onAISuggest={() => setIsAISuggestPanelOpen(true)}
        onStartWizard={() => {
          setShowEmptyState(false);
          launchNodeCreator({ forceWizard: true });
        }}
        onSave={() => {
          setSaveLoadMode("save");
          setIsSaveLoadDialogOpen(true);
        }}
        onLoad={() => {
          setSaveLoadMode("load");
          setIsSaveLoadDialogOpen(true);
        }}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onSettings={() => setIsUserSettingsOpen(true)}
        onAutoLayout={handleAutoLayout}
        selectedNodeCount={nodes.filter(n => n.selected).length}
        onAlign={handleAlign}
        onKeyboardShortcuts={() => setIsKeyboardShortcutsOpen(true)}
        onExportPNG={handleExportPNG}
        onExportSVG={handleExportSVG}
        onExportMarkdown={handleExportMarkdown}
        onExportCSV={handleExportCSV}
        onExportConnectionsCSV={handleExportConnectionsCSV}
        onImport={() => setIsImportModalOpen(true)}
        onExportBatch={handleExportBatch}
        onSearch={() => setIsSearchPanelOpen(true)}
        onAnalytics={() => setIsAnalyticsModalOpen(true)}
        onRelationships={() => setIsRelationshipsPanelOpen(true)}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        onSpecContext={() => setIsSpecContextDialogOpen(true)}
      />

      <FloatingFormatToolbar isVisible={isEditingText} />

      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onAddNodeType={handleAddNodeFromSidebar}
      />

      <StatusBar
        workspaceName={workspaceName}
        nodeCount={nodes.length}
        isSaved={isSaved}
        selectedCount={nodes.filter(n => n.selected).length}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      <ZoomControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitView={handleFitView}
        onFitSelection={handleFitSelection}
        onCenterCanvas={handleCenterCanvas}
        hasSelection={nodes.some(n => n.selected)}
        zoomLevel={zoomLevel}
      />

      <NodeHierarchy
        nodes={nodes}
        selectedNodeIds={nodes.filter(n => n.selected).map(n => n.id)}
        onNodeClick={handleNodeFocus}
        onCenterClick={handleCenterCanvas}
      />

      <AIButton onClick={() => setIsAISuggestPanelOpen(true)} />

      <StartWizard
        isOpen={isWizardOpen}
        onClose={() => {
          setIsWizardOpen(false);
          setWizardInitialPrompt(null);
        }}
        onAccept={handleAcceptSuggestions}
        workspaceId={workspaceId}
        sessionId={wizardSessionId}
        onSession={(sessionId) => setWizardSessionId(sessionId)}
        initialPrompt={wizardInitialPrompt ?? undefined}
        onInitialPromptConsumed={() => setWizardInitialPrompt(null)}
      />

      <AddNodeModal
        isOpen={isAddNodeModalOpen}
        initialType={nodeTypeToAdd}
        initialPrompt={pendingWizardPrompt ?? undefined}
        onClose={() => {
      setIsAddNodeModalOpen(false);
      setNodeTypeToAdd(undefined);
      setDragPreview(null);
      setIsPlacingNode(false);
      setPlacingNodeInfo(null);
      setDragSourceNodeId(null);
      setEdgePosition(null);
      setEdgeToReplace(null);
      setPendingWizardPrompt(null);
    }}
        onAdd={handleAddNode}
        onUseWizard={handleSwitchToWizard}
      />

      <ConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      />

      <ConnectSourcesModal
        open={isConnectSourcesOpen}
        onClose={() => setIsConnectSourcesOpen(false)}
        onConnectGit={handleConnectGitRepo}
        onConnectWiki={handleConnectWiki}
      />

      <AISuggestPanel
        isOpen={isAISuggestPanelOpen}
        onClose={() => setIsAISuggestPanelOpen(false)}
        onAddSuggestion={handleAddNode}
        onLoadTemplate={handleLoadTemplate}
      />

      <SpecContextDialog
        open={isSpecContextDialogOpen}
        onOpenChange={setIsSpecContextDialogOpen}
        workspaceId={workspaceId}
      />

      <SaveLoadDialog
        isOpen={isSaveLoadDialogOpen}
        onClose={() => setIsSaveLoadDialogOpen(false)}
        onSave={handleSave}
        onLoad={handleLoad}
      />

      <UserSettingsDialog
        isOpen={isUserSettingsOpen}
        onClose={() => setIsUserSettingsOpen(false)}
        onShowTutorial={handleStartTutorial}
        onResetDemo={handleResetDemo}
        onOpenSnapshots={() => setIsSnapshotsPanelOpen(true)}
        onOpenRelationships={() => setIsRelationshipsPanelOpen(true)}
      />

      <DetailPanel
        isOpen={isDetailPanelOpen}
        onClose={() => setIsDetailPanelOpen(false)}
        card={selectedCard?.card || null}
        onUpdate={handleUpdateCardInPanel}
        color="teal"
      />

      {/* Empty State */}
      {showEmptyState && !showOnboarding && (
        <EmptyState
          onConnectSources={handleOpenConnectSources}
          onStartTutorial={handleStartTutorial}
          onDismiss={() => setShowEmptyState(false)}
          onLaunchWizard={(prompt) => {
            setShowEmptyState(false);
            setWizardInitialPrompt(prompt ?? null);
            setIsWizardOpen(true);
          }}
        />
      )}

      {/* Onboarding Overlay */}
      {showOnboarding && (
        <OnboardingOverlay
          onComplete={handleCompleteOnboarding}
          onSkip={handleSkipOnboarding}
        />
      )}

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog
        isOpen={isKeyboardShortcutsOpen}
        onClose={() => setIsKeyboardShortcutsOpen(false)}
      />

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        nodes={nodes}
        onNodeSelect={handleNodeSelectFromPalette}
        onDuplicateSelected={handleDuplicateSelected}
        hasSelection={nodes.some(n => n.selected)}
        onSelectByCriteria={() => setIsSelectByCriteriaOpen(true)}
      />

      {/* Search Panel */}
      <SearchPanel
        isOpen={isSearchPanelOpen}
        onClose={() => setIsSearchPanelOpen(false)}
        nodes={nodes}
        onSelectNode={(nodeId) => {
          setNodes((nds) =>
            nds.map((n) => ({
              ...n,
              selected: n.id === nodeId,
            }))
          );
        }}
        onFocusNode={handleNodeFocus}
      />

      {/* Node Context Menu */}
      {nodeContextMenu.isOpen && activeContextNode && (
        <NodeContextMenu
          x={nodeContextMenu.position.x}
          y={nodeContextMenu.position.y}
          nodeLabel={
            typeof activeContextNode.data?.label === "string"
              ? activeContextNode.data.label
              : activeContextNode.id
          }
          isCollapsed={!!activeContextNode.data?.collapsed}
          allowCollapse={!isCenterNode(activeContextNode)}
          allowDuplicate={!isCenterNode(activeContextNode)}
          allowDelete={!isCenterNode(activeContextNode)}
          onClose={handleCloseNodeContextMenu}
          onToggleCollapse={
            !isCenterNode(activeContextNode)
              ? () => handleToggleNodeCollapse(activeContextNode.id)
              : undefined
          }
          onDuplicate={
            !isCenterNode(activeContextNode)
              ? () => handleDuplicateNode(activeContextNode.id)
              : undefined
          }
          onDelete={
            !isCenterNode(activeContextNode)
              ? () => handleDeleteNode(activeContextNode.id)
              : undefined
          }
          onEnrich={
            !isCenterNode(activeContextNode)
              ? () => handleOpenEnrichment(activeContextNode.id)
              : undefined
          }
          onCopyData={
            !isCenterNode(activeContextNode)
              ? () => handleCopyNodeData(activeContextNode.id)
              : undefined
          }
          onMarkIncorrectSuggestion={
            !isCenterNode(activeContextNode)
              ? () => handleMarkIncorrectSuggestion(activeContextNode.id)
              : undefined
          }
          onExportJSON={() => handleExportNodeJSON(activeContextNode.id)}
          onExportMarkdown={() => handleExportNodeMarkdown(activeContextNode.id)}
          onExportSubgraphJSON={
            !isCenterNode(activeContextNode)
              ? () => handleExportSubgraphJSON(activeContextNode.id)
              : undefined
          }
          onExportSubgraphMarkdown={
            !isCenterNode(activeContextNode)
              ? () => handleExportSubgraphMarkdown(activeContextNode.id)
              : undefined
          }
        />
      )}

      {/* Canvas Context Menu */}
      <CanvasContextMenu
        isOpen={canvasContextMenu.isOpen}
        position={canvasContextMenu.position}
        selectedCount={nodes.filter(n => n.selected).length}
        onClose={handleCloseContextMenu}
        onDuplicateSelected={handleDuplicateSelected}
        onDeleteSelected={handleContextMenuDeleteSelected}
        onSelectAll={handleContextMenuSelectAll}
        onAddNode={handleContextMenuAddNode}
        onFitView={handleFitView}
        onImport={() => setIsImportModalOpen(true)}
        onExportBatch={handleExportBatch}
        onExportCanvas={handleExportPNG}
      />

      {/* Edge Context Menu */}
      {edgeContextMenu.isOpen && edgeContextMenu.edgeId && (
        <EdgeContextMenu
          x={edgeContextMenu.position.x}
          y={edgeContextMenu.position.y}
          edgeId={edgeContextMenu.edgeId}
          currentRelationshipType={edgeContextMenu.relationshipType}
          onChangeRelationshipType={handleChangeRelationshipType}
          onDeleteEdge={handleDeleteEdge}
          onClose={handleCloseEdgeContextMenu}
        />
      )}

      {/* Import Node Modal */}
      <ImportNodeModal
        open={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImport}
      />

      {/* AI Enrichment Modal */}
      {enrichmentNodeId && (
        <AIEnrichmentModal
          open={isAIEnrichmentModalOpen}
          onOpenChange={setIsAIEnrichmentModalOpen}
          nodeId={enrichmentNodeId}
          nodeType={(nodes.find(n => n.id === enrichmentNodeId)?.data.type as any) || "requirement"}
          nodeLabel={nodes.find(n => n.id === enrichmentNodeId)?.data.label || ""}
          currentSummary={nodes.find(n => n.id === enrichmentNodeId)?.data.summary}
          onAddContent={(textCards, todoCards, tags, enhancedSummary) =>
            handleAddEnrichedContent(enrichmentNodeId, textCards, todoCards, tags, enhancedSummary)
          }
        />
      )}

      {/* Bulk Actions Toolbar */}
      <BulkActionsToolbar
        nodes={nodes}
        selectedCount={nodes.filter((n) => n.selected && !isCenterNode(n)).length}
        onDuplicate={handleDuplicateSelected}
        onDelete={handleBulkDelete}
        onOpenTagEditor={() => setIsBulkTagEditorOpen(true)}
        onOpenTypeEditor={() => setIsBulkTypeEditorOpen(true)}
        onDeselectAll={handleDeselectAll}
        onCompleteAllTodos={handleBulkCompleteAllTodos}
        onIncompleteAllTodos={handleBulkIncompleteAllTodos}
        onClearCards={handleBulkClearCards}
        onExportBatch={handleExportBatch}
      />

      {/* Bulk Tag Editor */}
      <BulkTagEditor
        isOpen={isBulkTagEditorOpen}
        onClose={() => setIsBulkTagEditorOpen(false)}
        nodes={nodes}
        selectedCount={nodes.filter((n) => n.selected && !isCenterNode(n)).length}
        onAddTags={handleBulkAddTags}
        onRemoveTags={handleBulkRemoveTags}
        onReplaceTags={handleBulkReplaceTags}
      />

      {/* Bulk Type Editor */}
      <BulkTypeEditor
        isOpen={isBulkTypeEditorOpen}
        onClose={() => setIsBulkTypeEditorOpen(false)}
        nodes={nodes}
        selectedCount={nodes.filter((n) => n.selected && !isCenterNode(n)).length}
        onChangeType={handleBulkChangeType}
      />

      {/* Select by Criteria */}
      <SelectByCriteria
        isOpen={isSelectByCriteriaOpen}
        onClose={() => setIsSelectByCriteriaOpen(false)}
        nodes={nodes}
        onApply={handleSelectByCriteria}
      />

      {/* Template Gallery */}
      <TemplateGallery
        open={isTemplateGalleryOpen}
        onOpenChange={setIsTemplateGalleryOpen}
        onLoadTemplate={handleLoadTemplate}
      />

      {/* Save Template Dialog */}
      <SaveTemplateDialog
        open={isSaveTemplateDialogOpen}
        onOpenChange={setIsSaveTemplateDialogOpen}
        nodes={nodes}
        edges={edges}
      />

      {/* Analytics Modal */}
      <AnalyticsModal
        open={isAnalyticsModalOpen}
        onOpenChange={setIsAnalyticsModalOpen}
        analytics={calculateAnalytics(nodes, edges)}
        insights={getInsights(calculateAnalytics(nodes, edges))}
      />

      {/* Snapshots Panel */}
      <SnapshotsPanel
        open={isSnapshotsPanelOpen}
        onOpenChange={setIsSnapshotsPanelOpen}
        currentNodes={nodes}
        currentEdges={edges}
        onRestore={handleRestoreSnapshot}
      />

      {/* Relationships Panel */}
      <RelationshipsPanel
        open={isRelationshipsPanelOpen}
        onOpenChange={setIsRelationshipsPanelOpen}
        nodes={nodes}
        edges={edges}
        onHighlightNodes={handleHighlightNodes}
        onFocusNode={handleNodeFocus}
        onUpdateEdge={handleUpdateEdgeRelationship}
        onCreateEdge={handleCreateRelationshipEdge}
      />
    </div>
  );
}

export default function App() {
  return (
    <>
      <ErrorBoundary>
        <ReactFlowProvider>
          <FlowCanvas />
        </ReactFlowProvider>
      </ErrorBoundary>
      <Toaster 
        position="top-right"
        richColors
        closeButton
        expand={false}
        duration={3000}
      />
    </>
  );
}
