// @ts-nocheck
import { useState, useCallback, useEffect, useRef } from "react";
import { ReactFlow, 
  Background,
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
import { applyDomainRadialLayout } from "./utils/domainLayout";
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
import { ImportNodeModal } from "./components/ImportNodeModal";
import { AIEnrichmentModal } from "./components/AIEnrichmentModal";
import { SearchPanel } from "./components/SearchPanel";
import { BulkActionsToolbar } from "./components/BulkActionsToolbar";
import { BulkTagEditor } from "./components/BulkTagEditor";
import { BulkTypeEditor } from "./components/BulkTypeEditor";
import { SelectByCriteria } from "./components/SelectByCriteria";
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

const nodeTypes: NodeTypes = {
  custom: CustomNode,
  center: CenterNode,
};

const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};

const initialNodes = [
  // Center focal node - auto height
  {
    id: "center",
    type: "center",
    position: { x: 500, y: 300 },
    style: { width: 320 },
    data: {
      label: "ASAP Bail",
      description: "An innovative product: ASAP Bail is a unified operational platform for bail bond teams. It ingests jail intakes in real-time.",
      icon: "⚖️",
      link: "https://github.com/acme/asap-bail",
      buttonText: "Clone the Coda/Spring boilerplate",
      // buttonAction will be added dynamically in nodesWithCallbacks
    } as CenterNodeData,
  },
  // Features - Right side
  {
    id: "features",
    type: "custom",
    position: { x: 1000, y: 200 },
    style: { width: 280, height: 450 },
    data: {
      label: "Features",
      type: "frontend" as const,
      domain: "product" as const,
      ring: 1,
      summary: "Core features and functionality",
      cards: [
        { 
          id: "c1", 
          title: "Real-Time Intake Sync", 
          type: "text" as const,
          content: "Automated ingestion of jail intake data across counties. This feature continuously monitors and normalizes data from multiple sources."
        },
        { 
          id: "c2", 
          title: "Case Triage Pipeline", 
          type: "todo" as const,
          todos: [
            { id: "t1", text: "Design case scoring model", completed: true },
            { id: "t2", text: "Build pipeline database schema", completed: false },
            { id: "t3", text: "Develop drag-and-drop Kanban UI", completed: false },
          ]
        },
        { 
          id: "c3", 
          title: "Messaging & Reminders", 
          type: "text" as const,
          content: "Built-in communication with defendants and co-signers via SMS and email."
        },
        { 
          id: "c4", 
          title: "CRM & Compliance", 
          type: "todo" as const,
          todos: [
            { id: "t4", text: "Set up Supabase storage for documents", completed: false },
            { id: "t5", text: "Build compliance checklist schema", completed: false },
            { id: "t6", text: "Implement audit logging with timestamps", completed: false },
          ]
        },
      ],
    } as CustomNodeData,
  },
  // Competitors - Left side
  {
    id: "competitors",
    type: "custom",
    position: { x: -50, y: 200 },
    style: { width: 280, height: 500 },
    data: {
      label: "Competitors",
      type: "requirement" as const,
      domain: "business" as const,
      ring: 1,
      summary: "Market competition and alternatives",
      cards: [
        { id: "c5", title: "Captira", type: "text" as const, content: "Bail bond management software offering case tracking, payment processing..." },
        { id: "c6", title: "TrackGrouping", type: "text" as const, content: "Platform focused on managing bail bond cases, court dates, collections..." },
        { id: "c7", title: "JMTracker", type: "text" as const, content: "Jail management system providing intake, classification offering data..." },
        { id: "c8", title: "Casefile", type: "text" as const, content: "Web-based management and billing platform with fast and document management..." },
        { id: "c9", title: "BondPro", type: "text" as const, content: "Cloud-based software offering defendant tracking, payment..." },
      ],
    } as CustomNodeData,
  },
  // Target Audience - Bottom
  {
    id: "target",
    type: "custom",
    position: { x: 450, y: 750 },
    style: { width: 280, height: 400 },
    data: {
      label: "Target Audience",
      type: "doc" as const,
      domain: "business" as const,
      ring: 2,
      summary: "Who will use this product",
      cards: [
        { id: "c10", title: "Bail Bond Agency Owners", type: "text" as const, content: "Need a centralized system to manage bail teams, monitor cases..." },
        { id: "c11", title: "Bail Bond Agents", type: "text" as const, content: "Require real-time mobile data daily, need single tools to capture..." },
        { id: "c12", title: "Agency Administrative Staff", type: "text" as const, content: "Handle payments, documentation, and compliance tasks..." },
        { id: "c13", title: "Defendant Support Staff", type: "text" as const, content: "Coordinate transportation and on-location monitoring..." },
      ],
    } as CustomNodeData,
  },
  // Top nodes
  {
    id: "pepper",
    type: "custom",
    position: { x: 350, y: -150 },
    style: { width: 280, height: 200 },
    data: {
      label: "Pepper Motion",
      type: "backend" as const,
      domain: "tech" as const,
      ring: 2,
      summary: "Animation Library",
      cards: [],
    } as CustomNodeData,
  },
  {
    id: "wings",
    type: "custom",
    position: { x: 670, y: -150 },
    style: { width: 280, height: 200 },
    data: {
      label: "Wings",
      type: "backend" as const,
      domain: "tech" as const,
      ring: 2,
      summary: "Payments & Subscriptions",
      cards: [],
    } as CustomNodeData,
  },
  {
    id: "vapor",
    type: "custom",
    position: { x: 200, y: -50 },
    style: { width: 280, height: 200 },
    data: {
      label: "Vapor",
      type: "frontend" as const,
      domain: "product" as const,
      ring: 2,
      summary: "Onboarding Platform",
      cards: [],
    } as CustomNodeData,
  },
  {
    id: "mapbox",
    type: "custom",
    position: { x: 900, y: 400 },
    style: { width: 280, height: 200 },
    data: {
      label: "Mapbox",
      type: "backend" as const,
      domain: "tech" as const,
      ring: 1,
      summary: "GPS Details to auto-update Service",
      cards: [],
    } as CustomNodeData,
  },
  {
    id: "roads",
    type: "custom",
    position: { x: 900, y: 520 },
    style: { width: 280, height: 200 },
    data: {
      label: "Roads",
      type: "frontend" as const,
      domain: "data-ai" as const,
      ring: 1,
      summary: "Real-time Data Caching and node synchronization",
      cards: [],
    } as CustomNodeData,
  },
];

const initialEdges = [
  // From center to main categories (handles will be calculated dynamically)
  { id: "e-center-features", source: "center", target: "features", type: "custom" },
  { id: "e-center-competitors", source: "center", target: "competitors", type: "custom" },
  { id: "e-center-target", source: "center", target: "target", type: "custom" },
  { id: "e-center-pepper", source: "center", target: "pepper", type: "custom" },
  { id: "e-center-wings", source: "center", target: "wings", type: "custom" },
  { id: "e-center-vapor", source: "center", target: "vapor", type: "custom" },
  { id: "e-center-mapbox", source: "center", target: "mapbox", type: "custom" },
  { id: "e-center-roads", source: "center", target: "roads", type: "custom" },
];

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
  const [isSaveLoadDialogOpen, setIsSaveLoadDialogOpen] = useState(false);
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<{ nodeId: string; card: EditableCardData } | null>(null);
  const [saveLoadMode, setSaveLoadMode] = useState<"save" | "load">("save");
  const [workspaceName, setWorkspaceName] = useState("My Workspace");
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
  const [placingNodeInfo, setPlacingNodeInfo] = useState<{
    nodeId: string;
    startPos: { x: number; y: number };
  } | null>(null);
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
  const [viewMode, setViewMode] = useState<"radial" | "process">("radial");
  const [showDomainRings, setShowDomainRings] = useState(true);
  const [edgeContextMenu, setEdgeContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    edgeId: string | null;
    relationshipType?: RelationshipType;
  }>({ isOpen: false, position: { x: 0, y: 0 }, edgeId: null });

  const reactFlowInstance = useReactFlow();
  const historyManager = useRef(new HistoryManager(50));
  const isUndoRedoAction = useRef(false);
  // Track connection lifecycle to decide between edge vs new node
  const connectStartInfoRef = useRef<{ nodeId: string | null; handleId?: string | null } | null>(null);
  const didConnectRef = useRef(false);
  const lastAutoSnapshotTime = useRef<number>(0);

  // Safe wrapper for onNodesChange with validation
  const onNodesChange = useCallback((changes: any[]) => {
    try {
      onNodesChangeInternal(changes);
    } catch (error) {
      console.error('Error in onNodesChange:', error);
      // Silently fail to prevent crashes
    }
  }, [onNodesChangeInternal]);

  // Safe wrapper for onEdgesChange with validation
  const onEdgesChange = useCallback((changes: any[]) => {
    try {
      onEdgesChangeInternal(changes);
    } catch (error) {
      console.error('Error in onEdgesChange:', error);
      // Silently fail to prevent crashes
    }
  }, [onEdgesChangeInternal]);

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
    const selectedNodes = nodes.filter(n => n.selected && n.id !== "center");
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
  }, [nodes, setNodes]);

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
    const selectedCount = nodes.filter(n => n.selected && n.id !== 'center').length;
    if (selectedCount === 0) {
      toast.info("No nodes selected");
      return;
    }

    const result = bulkDeleteNodes(nodes, edges);
    setNodes(result.nodes);
    setEdges(result.edges);
    setIsSaved(false);
    toast.success(result.result.message);
  }, [nodes, edges, setNodes, setEdges]);

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
    
    const selectedCount = updatedNodes.filter(n => n.selected && n.id !== 'center').length;
    toast.success(`Selected ${selectedCount} node${selectedCount !== 1 ? 's' : ''}`);
  }, [nodes, edges, setNodes]);

  const handleDeselectAll = useCallback(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        selected: false,
      }))
    );
  }, [setNodes]);

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
    toast.success("Fit all nodes", {
      description: "Canvas adjusted to show all nodes",
    });
  }, [reactFlowInstance, nodes.length]);

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
    
    toast.success("Zoomed to selection", {
      description: `Focused on ${selectedNodes.length} node${selectedNodes.length > 1 ? 's' : ''}`,
    });
  }, [reactFlowInstance, nodes]);

  const handleCenterCanvas = useCallback(() => {
    if (!reactFlowInstance) return;
    // Find center node and focus on it
    const centerNode = nodes.find(n => n.id === "center");
    if (centerNode) {
      reactFlowInstance.setCenter(
        centerNode.position.x + (centerNode.width || 320) / 2,
        centerNode.position.y + (centerNode.height || 200) / 2,
        { duration: 400, zoom: 1 }
      );
      toast.success("Centered", {
        description: "Canvas centered on main node",
      });
    }
  }, [reactFlowInstance, nodes]);

  const handleNodeFocus = useCallback((nodeId: string) => {
    if (!reactFlowInstance) return;
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      reactFlowInstance.setCenter(
        node.position.x + (node.width || 280) / 2,
        node.position.y + (node.height || 150) / 2,
        { duration: 400, zoom: 1.2 }
      );
      
      // Select the node
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          selected: n.id === nodeId,
        }))
      );
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
        const centerNode = nodes.find(n => n.id === "center");
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
  }, [reactFlowInstance, nodes]);



  // Initialize history with initial state
  useEffect(() => {
    historyManager.current.initialize({ nodes, edges });
    setCanUndo(historyManager.current.canUndo());
    setCanRedo(historyManager.current.canRedo());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  }, [nodes.length]);

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
        const selectedNodeCount = nodes.filter(n => n.selected && n.id !== 'center').length;
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
  }, [setNodes, handleUndo, handleRedo, handleFitView, handleFitSelection, handleCenterCanvas, nodes, setIsKeyboardShortcutsOpen, setIsCommandPaletteOpen, handleDuplicateSelected, handleBulkDelete]);
  

  // Update edges with optimal handles whenever nodes change
  useEffect(() => {
    // Skip if currently editing text or placing a node to avoid interference
    if (isEditingText || isPlacingNode) {
      return;
    }
    
    try {
      const updatedEdges = updateEdgesWithOptimalHandles(nodes, edges, "center");
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
      setEdges((eds) => {
        const updatedEdges = addEdge(newEdge, eds);
        return updateEdgesWithOptimalHandles(nodes, updatedEdges, "center");
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
      setEdgePosition(pos);
      setNodeTypeToAdd(undefined);
      setDragSourceNodeId(connectStartInfoRef.current.nodeId);
      setIsAddNodeModalOpen(true);
    }
    // Reset flags
    didConnectRef.current = false;
    connectStartInfoRef.current = null;
  }, [reactFlowInstance]);

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
        if (node.id === "center") {
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

  const handleDragNewNode = useCallback((sourceNodeId: string, position: { x: number; y: number }) => {
    setDragSourceNodeId(sourceNodeId);
    setEdgePosition(position);
    setNodeTypeToAdd(undefined);
    setDragPreview(null); // Clear preview when opening modal
    setIsPlacingNode(false); // Clear placing mode
    setPlacingNodeInfo(null); // Clear placing info
    setIsAddNodeModalOpen(true);
  }, []);

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
    if (!nodeToDuplicate || nodeToDuplicate.id === "center") {
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
  }, [nodes, setNodes]);

  // Delete node handler
  const handleDeleteNode = useCallback((nodeId: string) => {
    if (nodeId === "center") {
      toast.error("Cannot delete the center node");
      return;
    }

    const nodeToDelete = nodes.find(n => n.id === nodeId);
    setNodes((nds) => nds.filter(n => n.id !== nodeId));
    setEdges((eds) => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    setIsSaved(false);
    toast.success("Node deleted", {
      description: `Removed "${nodeToDelete?.data.label}"`,
    });
  }, [nodes, setNodes, setEdges]);

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
    if (nodeId === "center") {
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

  // Update nodes with callbacks - DO NOT FILTER to prevent ReactFlow index mismatch errors
  const nodesWithCallbacks = nodes.map((node) => {
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
      
      return {
        ...node,
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
          isPlacingFromThisNode: isPlacingNode && placingNodeInfo?.nodeId === node.id,
          // Add buttonAction and onUpdateCenterNode for center node
          ...(node.type === "center" ? {
            buttonAction: node.data?.buttonText ? () => {
              setIsAddNodeModalOpen(true);
              setDragSourceNodeId(node.id);
              toast.info("Add your first node!", {
                description: "Choose a node type to get started",
              });
            } : undefined,
            onUpdateCenterNode: handleUpdateCenterNode,
          } : {}),
        },
      };
    });

  const handleAddNode = useCallback(
    (nodeData: { type: string; label: string; summary: string; tags: string[]; domain?: string; ring?: number }) => {
      const newNodeId = `${nodes.length + 1}`;
      const newNode = {
        id: newNodeId,
        type: "custom",
        position: edgePosition || {
          x: Math.random() * 500 + 200,
          y: Math.random() * 300 + 100,
        },
        data: {
          label: nodeData.label,
          type: nodeData.type as any,
          summary: nodeData.summary,
          tags: nodeData.tags,
          domain: nodeData.domain,
          ring: nodeData.ring,
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
          return updateEdgesWithOptimalHandles(updatedNodes, updatedEdges, "center");
        });
      }
      
      setIsSaved(false);
      setEdgePosition(null);
      setDragSourceNodeId(null);
      setEdgeToReplace(null); // Clear edge replacement info
      setDragPreview(null); // Clear the locked preview after node is added
      setIsPlacingNode(false);
      setPlacingNodeInfo(null);
      toast.success("Node added successfully");
    },
    [nodes, setNodes, edgePosition, dragSourceNodeId, edgeToReplace, setEdges]
  );

  const handleAddNodeFromSidebar = useCallback((type: string) => {
    setNodeTypeToAdd(type);
    setEdgePosition(null);
    setIsAddNodeModalOpen(true);
  }, []);

  const handleAddNodeFromEdge = useCallback((x: number, y: number, sourceNodeId?: string, targetNodeId?: string, originalEdgeId?: string) => {
    setEdgePosition({ x, y });
    setNodeTypeToAdd(undefined);
    // Store the source node ID so we can create a connection from it to the new node
    if (sourceNodeId) {
      setDragSourceNodeId(sourceNodeId);
      // Store the original edge info to potentially remove or update it
      setEdgeToReplace(originalEdgeId ? { id: originalEdgeId, targetNodeId } : null);
    } else {
      setDragSourceNodeId(null);
      setEdgeToReplace(null);
    }
    setIsAddNodeModalOpen(true);
  }, []);

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

  const handleSave = useCallback((name: string) => {
    setWorkspaceName(name);
    setIsSaved(true);
    toast.success("Workspace saved successfully", {
      description: `Saved as "${name}"`,
    });
  }, []);

  const handleLoad = useCallback((id: string) => {
    toast.success("Workspace loaded", {
      description: "Your workspace has been restored",
    });
    setIsSaved(true);
  }, []);

  const handleAutoLayout = useCallback(() => {
    let layoutedNodes;
    
    if (viewMode === "radial") {
      // Use domain-based radial layout
      layoutedNodes = applyDomainRadialLayout(nodes, {
        centerNodeId: "center",
        viewMode: "radial",
      });
    } else {
      // Use process layout
      layoutedNodes = applyDomainRadialLayout(nodes, {
        centerNodeId: "center",
        viewMode: "process",
      });
    }
    
    // Enable smooth transitions
    setIsAutoLayouting(true);
    setNodes(layoutedNodes);
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
  }, [nodes, setNodes, viewMode]);

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

  // Add callbacks to edges - filter out any undefined edges and validate node references
  const edgesWithCallbacks = edges
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
    setNodes([{
      id: "center",
      type: "center",
      position: { x: 500, y: 300 },
      style: { width: 320 },
      data: {
        label: "My Project",
        description: "Start building your visual requirements board here. Click the handles to add connected nodes.",
        icon: "🎯",
        link: "",
        buttonText: "Get Started",
        // buttonAction will be added dynamically in nodesWithCallbacks
      } as CenterNodeData,
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
    },
    []
  );

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
    setCanvasContextMenu({
      isOpen: true,
      position: { x: event.clientX, y: event.clientY },
    });
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setCanvasContextMenu({ isOpen: false, position: { x: 0, y: 0 } });
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
      // Validate node exists
      if (!node || !node.id) {
        console.warn('Invalid node in drag start');
        return;
      }
      // Prevent any state updates during drag that could cause issues
      // This is a safe no-op handler that prevents errors
    } catch (error) {
      console.error('Error in handleNodeDragStart:', error);
    }
  }, []);

  const handleNodeDrag = useCallback((_event: React.MouseEvent, node: Node) => {
    try {
      // Validate node exists
      if (!node || !node.id) {
        console.warn('Invalid node in drag');
        return;
      }
      // Safe no-op handler during drag
    } catch (error) {
      console.error('Error in handleNodeDrag:', error);
    }
  }, []);

  const handleNodeDragStop = useCallback((_event: React.MouseEvent, node: Node) => {
    try {
      // Validate node exists
      if (!node || !node.id) {
        console.warn('Invalid node in drag stop');
        return;
      }
      // Mark as unsaved after drag completes
      setIsSaved(false);
    } catch (error) {
      console.error('Error in handleNodeDragStop:', error);
    }
  }, []);

  // Context menu action handlers
  const handleContextMenuAddNode = useCallback(() => {
    setIsAddNodeModalOpen(true);
  }, []);

  const handleContextMenuSelectAll = useCallback(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        selected: true,
      }))
    );
    toast.success("All nodes selected");
  }, [setNodes]);

  const handleContextMenuDeleteSelected = useCallback(() => {
    const selectedNodes = nodes.filter(n => n.selected);
    if (selectedNodes.length === 0) {
      toast.info("No nodes selected");
      return;
    }

    // Don't allow deleting the center node
    const nodesToDelete = selectedNodes.filter(n => n.id !== "center");
    if (nodesToDelete.length === 0) {
      toast.error("Cannot delete the center node");
      return;
    }

    setNodes((nds) => nds.filter(n => !n.selected || n.id === "center"));
    setEdges((eds) => eds.filter(e => {
      const sourceSelected = selectedNodes.find(n => n.id === e.source);
      const targetSelected = selectedNodes.find(n => n.id === e.target);
      return !sourceSelected && !targetSelected;
    }));
    setIsSaved(false);
    toast.success(`Deleted ${nodesToDelete.length} node${nodesToDelete.length > 1 ? 's' : ''}`, {
      description: "Removed selected nodes",
    });
  }, [nodes, setNodes, setEdges]);

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
    const selectedNodes = nodes.filter(n => n.selected && n.id !== "center");
    
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
  }, [nodes, edges]);

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
      // Clear existing nodes and edges (except we'll replace everything)
      setNodes(template.nodes);
      setEdges(template.edges);
      
      // Update workspace name to match template
      setWorkspaceName(template.name);
      
      // Reset saved state
      setIsSaved(false);
      
      // Center view on the new template
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2, duration: 400 });
      }, 100);
      
      toast.success(`Template "${template.name}" loaded`, {
        description: `${template.nodes.length} nodes, ${template.edges.length} connections`,
      });
    } catch (error) {
      console.error("Error loading template:", error);
      toast.error("Failed to load template");
    }
  }, [setNodes, setEdges, setWorkspaceName, reactFlowInstance]);

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
    }, 100);
    
    toast.success("Snapshot restored", {
      description: `${restoredNodes.length} nodes, ${restoredEdges.length} connections`,
    });
  }, [setNodes, setEdges, reactFlowInstance]);

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
    
    setEdges((eds) => {
      const updatedEdges = [...eds, newEdge];
      return updateEdgesWithOptimalHandles(nodes, updatedEdges, "center");
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
        setIsAddNodeModalOpen(true);
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
        const selectedNodes = nodes.filter(n => n.selected && n.id !== 'center');
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
  ]);

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-slate-50 via-indigo-100/60 to-purple-100/60 animate-gradient-slow bg-[length:200%_200%]">
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
          variant="dots"
        />
        
        <Controls className="!hidden" />
        
        {/* Domain Rings Overlay */}
        {viewMode === "radial" && showDomainRings && (() => {
          const centerNode = nodes.find(n => n.id === "center");
          const centerX = (centerNode?.position.x || 500) + ((centerNode?.width || centerNode?.style?.width || 320) as number) / 2;
          const centerY = (centerNode?.position.y || 300) + ((centerNode?.height || 200) / 2);
          return <DomainRings centerX={centerX} centerY={centerY} />;
        })()}
      </ReactFlow>

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

      <Toolbar
        onAddNode={() => setIsAddNodeModalOpen(true)}
        onConnect={() => setIsConnectModalOpen(true)}
        onAISuggest={() => setIsAISuggestPanelOpen(true)}
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
        onViewModeChange={setViewMode}
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

      <AddNodeModal
        isOpen={isAddNodeModalOpen}
        onClose={() => {
          setIsAddNodeModalOpen(false);
          setNodeTypeToAdd(undefined);
          setDragPreview(null);
          setIsPlacingNode(false);
          setPlacingNodeInfo(null);
        }}
        onAdd={handleAddNode}
        initialType={nodeTypeToAdd}
      />

      <ConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      />

      <AISuggestPanel
        isOpen={isAISuggestPanelOpen}
        onClose={() => setIsAISuggestPanelOpen(false)}
        onAddSuggestion={handleAddNode}
        onLoadTemplate={handleLoadTemplate}
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
          onAddNode={() => setIsAddNodeModalOpen(true)}
          onOpenAI={() => setIsAISuggestPanelOpen(true)}
          onStartTutorial={handleStartTutorial}
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
        selectedCount={nodes.filter(n => n.selected && n.id !== 'center').length}
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
        selectedCount={nodes.filter(n => n.selected && n.id !== 'center').length}
        onAddTags={handleBulkAddTags}
        onRemoveTags={handleBulkRemoveTags}
        onReplaceTags={handleBulkReplaceTags}
      />

      {/* Bulk Type Editor */}
      <BulkTypeEditor
        isOpen={isBulkTypeEditorOpen}
        onClose={() => setIsBulkTypeEditorOpen(false)}
        nodes={nodes}
        selectedCount={nodes.filter(n => n.selected && n.id !== 'center').length}
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
    <ReactFlowProvider>
      <FlowCanvas />
      <Toaster 
        position="top-right"
        richColors
        closeButton
        expand={false}
        duration={3000}
      />
    </ReactFlowProvider>
  );
}
