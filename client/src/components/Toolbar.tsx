import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Plus,
  Link2,
  Sparkles,
  Lightbulb,
  Save,
  FolderOpen,
  Undo,
  Redo,
  Settings,
  LogOut,
  LayoutGrid,
  AlignLeft,
  AlignRight,
  AlignCenterHorizontal,
  AlignStartVertical,
  AlignEndVertical,
  AlignCenterVertical,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  Keyboard,
  Upload,
  Download,
  Search,
  BarChart3,
  Network,
  CircleDot,
  ArrowRight,
  FileCode,
  FileText,
  HeartPulse,
} from "lucide-react";
import { AlignmentType } from "../utils/alignment";
import { ExportMenu } from "./ExportMenu";

interface ToolbarProps {
  onAddNode: () => void;
  onConnect: () => void;
  onAISuggest: () => void;
  onSave: () => void;
  onLoad: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onSettings: () => void;
  onAutoLayout: () => void;
  selectedNodeCount?: number;
  onAlign?: (alignmentType: AlignmentType) => void;
  onKeyboardShortcuts?: () => void;
  onExportPNG?: () => void;
  onExportSVG?: () => void;
  onExportMarkdown?: () => void;
  onExportCSV?: () => void;
  onExportConnectionsCSV?: () => void;
  onImport?: () => void;
  onExportBatch?: () => void;
  onSearch?: () => void;
  onAnalytics?: () => void;
  onRelationships?: () => void;
  viewMode?: "radial" | "process";
  onViewModeChange?: (mode: "radial" | "process") => void;
  onStartWizard?: () => void;
  onSpecContext?: () => void;
  onDocumentationPreview?: () => void;
  onWorkspaceHealth?: () => void;
}

export function Toolbar({
  onAddNode,
  onConnect,
  onAISuggest,
  onStartWizard,
  onSave,
  onLoad,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onSettings,
  onAutoLayout,
  selectedNodeCount = 0,
  onAlign,
  onKeyboardShortcuts,
  onExportPNG,
  onExportSVG,
  onExportMarkdown,
  onExportCSV,
  onExportConnectionsCSV,
  onImport,
  onExportBatch,
  onSearch,
  onAnalytics,
  onRelationships,
  viewMode = "radial",
  onViewModeChange,
  onSpecContext,
  onDocumentationPreview,
  onWorkspaceHealth,
}: ToolbarProps) {
  const showAlignmentTools = selectedNodeCount >= 2;
  
  return (
    <TooltipProvider delayDuration={300}>
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
        <div className="backdrop-blur-md bg-white/90 border border-gray-200/80 rounded-2xl shadow-lg px-2 py-2 flex items-center gap-0.5 transition-all duration-300 hover:shadow-xl">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onAddNode}
                className="h-8 w-8 hover:bg-gray-100 text-gray-700"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add Node</p>
            </TooltipContent>
          </Tooltip>
          
          <div className="w-px h-5 bg-gray-200 mx-1" />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onConnect}
                className="h-8 w-8 hover:bg-gray-100 text-gray-700"
              >
                <Link2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Connect</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onAISuggest}
                className="h-8 w-8 hover:bg-gray-100 text-gray-700"
              >
                <Sparkles className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>AI Suggest</p>
            </TooltipContent>
          </Tooltip>

          {onSpecContext && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onSpecContext}
                  className="h-8 w-8 hover:bg-gray-100 text-emerald-600"
                >
                  <FileCode className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>API Spec Context</p>
              </TooltipContent>
            </Tooltip>
          )}

          {onStartWizard && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onStartWizard}
                  className="h-8 w-8 hover:bg-gray-100 text-gray-700"
                >
                  <Lightbulb className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>AI Builder</p>
              </TooltipContent>
            </Tooltip>
          )}

          {onDocumentationPreview && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDocumentationPreview}
                  className="h-8 w-8 hover:bg-gray-100 text-gray-700"
                >
                  <FileText className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Documentation</p>
              </TooltipContent>
            </Tooltip>
          )}

          {onWorkspaceHealth && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onWorkspaceHealth}
                  className="h-8 w-8 hover:bg-gray-100 text-gray-700"
                >
                  <HeartPulse className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Workspace Health</p>
              </TooltipContent>
            </Tooltip>
          )}
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onAutoLayout}
                className="h-8 w-8 hover:bg-gray-100 text-gray-700"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Arrange (Auto Layout)</p>
            </TooltipContent>
          </Tooltip>
          
          {onViewModeChange && (
            <>
              <div className="w-px h-5 bg-gray-200 mx-1" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === "radial" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => onViewModeChange("radial")}
                    className="h-8 w-8"
                  >
                    <CircleDot className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Radial View</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === "process" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => onViewModeChange("process")}
                    className="h-8 w-8"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Process View</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}
          
          {onSearch && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onSearch}
                  className="h-8 w-8 hover:bg-gray-100 text-gray-700"
                >
                  <Search className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Search (Cmd/Ctrl+F)</p>
              </TooltipContent>
            </Tooltip>
          )}
          
          {onAnalytics && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onAnalytics}
                  className="h-8 w-8 hover:bg-gray-100 text-gray-700"
                >
                  <BarChart3 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Project Analytics</p>
              </TooltipContent>
            </Tooltip>
          )}
          
          {onRelationships && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onRelationships}
                  className="h-8 w-8 hover:bg-gray-100 text-purple-700"
                >
                  <Network className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Relationships (Cmd/Ctrl+Shift+R)</p>
              </TooltipContent>
            </Tooltip>
          )}
          
          {showAlignmentTools && (
            <>
              <div className="w-px h-5 bg-gray-200 mx-1" />
              
              {/* Horizontal Alignment */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onAlign?.("left")}
                    className="h-8 w-8 hover:bg-indigo-50 text-indigo-600"
                  >
                    <AlignLeft className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Align Left</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onAlign?.("centerHorizontal")}
                    className="h-8 w-8 hover:bg-indigo-50 text-indigo-600"
                  >
                    <AlignCenterHorizontal className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Align Center (Horizontal)</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onAlign?.("right")}
                    className="h-8 w-8 hover:bg-indigo-50 text-indigo-600"
                  >
                    <AlignRight className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Align Right</p>
                </TooltipContent>
              </Tooltip>
              
              <div className="w-px h-4 bg-indigo-200 mx-0.5" />
              
              {/* Vertical Alignment */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onAlign?.("top")}
                    className="h-8 w-8 hover:bg-indigo-50 text-indigo-600"
                  >
                    <AlignStartVertical className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Align Top</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onAlign?.("centerVertical")}
                    className="h-8 w-8 hover:bg-indigo-50 text-indigo-600"
                  >
                    <AlignCenterVertical className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Align Center (Vertical)</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onAlign?.("bottom")}
                    className="h-8 w-8 hover:bg-indigo-50 text-indigo-600"
                  >
                    <AlignEndVertical className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Align Bottom</p>
                </TooltipContent>
              </Tooltip>
              
              <div className="w-px h-4 bg-indigo-200 mx-0.5" />
              
              {/* Distribution */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onAlign?.("distributeHorizontal")}
                    className="h-8 w-8 hover:bg-indigo-50 text-indigo-600"
                    disabled={selectedNodeCount < 3}
                  >
                    <AlignHorizontalDistributeCenter className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Distribute Horizontally {selectedNodeCount < 3 && "(3+ nodes)"}</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onAlign?.("distributeVertical")}
                    className="h-8 w-8 hover:bg-indigo-50 text-indigo-600"
                    disabled={selectedNodeCount < 3}
                  >
                    <AlignVerticalDistributeCenter className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Distribute Vertically {selectedNodeCount < 3 && "(3+ nodes)"}</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}
          
          <div className="w-px h-5 bg-gray-200 mx-1" />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onSave}
                className="h-8 w-8 hover:bg-gray-100 text-gray-700"
              >
                <Save className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Save</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onLoad}
                className="h-8 w-8 hover:bg-gray-100 text-gray-700"
              >
                <FolderOpen className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Load</p>
            </TooltipContent>
          </Tooltip>
          
          <div className="w-px h-5 bg-gray-200 mx-1" />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onUndo}
                disabled={!canUndo}
                className="h-8 w-8 hover:bg-gray-100 text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Undo className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Undo {canUndo ? "(⌘Z)" : "(No history)"}</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onRedo}
                disabled={!canRedo}
                className="h-8 w-8 hover:bg-gray-100 text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Redo className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Redo {canRedo ? "(⌘⇧Z)" : "(No history)"}</p>
            </TooltipContent>
          </Tooltip>
          
          {onImport && (
            <>
              <div className="w-px h-5 bg-gray-200 mx-1" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onImport}
                    className="h-8 w-8 hover:bg-gray-100 text-gray-700"
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Import Node</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}

          {onExportPNG && onExportSVG && onExportMarkdown && (
            <>
              {!onImport && <div className="w-px h-5 bg-gray-200 mx-1" />}
              <ExportMenu
                onExportPNG={onExportPNG}
                onExportSVG={onExportSVG}
                onExportMarkdown={onExportMarkdown}
                onExportCSV={onExportCSV}
                onExportConnectionsCSV={onExportConnectionsCSV}
              />
            </>
          )}

          {onExportBatch && selectedNodeCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onExportBatch}
                  className="h-8 w-8 hover:bg-indigo-50 text-indigo-600"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export {selectedNodeCount} Selected {selectedNodeCount === 1 ? 'Node' : 'Nodes'}</p>
              </TooltipContent>
            </Tooltip>
          )}
          
          <div className="w-px h-5 bg-gray-200 mx-1" />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <Avatar className="w-7 h-7">
                  <AvatarFallback className="bg-indigo-500 text-white text-xs">
                    JD
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onSettings}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              {onKeyboardShortcuts && (
                <DropdownMenuItem onClick={onKeyboardShortcuts}>
                  <Keyboard className="w-4 h-4 mr-2" />
                  Keyboard Shortcuts
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </TooltipProvider>
  );
}
