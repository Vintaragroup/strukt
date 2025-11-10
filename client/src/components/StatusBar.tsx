import { CheckCircle2, MousePointerClick, History, LayoutGrid, Brackets, Activity, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { useUIPreferences } from "@/store/useUIPreferences";
import { detectRecipe } from "@/config/layoutRecipes";
import type { Node } from "@xyflow/react";
import { useMemo, useState } from "react";

interface StatusBarProps {
  workspaceName: string;
  nodeCount: number;
  isSaved: boolean;
  selectedCount?: number;
  canUndo?: boolean;
  canRedo?: boolean;
  // Nodes + viewMode for live layout status
  nodes?: Node[];
  viewMode?: "radial" | "process";
  buildInfo?: { sha?: string; branch?: string; time?: string; version?: string };
}

export function StatusBar({ workspaceName, nodeCount, isSaved, selectedCount = 0, canUndo = false, canRedo = false, nodes = [], viewMode = "radial", buildInfo }: StatusBarProps) {
  const { recipeEnabled, setRecipeEnabled } = useUIPreferences();
  const activeRecipe = viewMode === "process" && recipeEnabled ? detectRecipe(nodes.filter(n => n.id !== 'center')) : null;
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);

  // Compute diagnostics: column counts (if recipe) + overlap count
  const diagnostics = useMemo(() => {
    if (viewMode !== 'process') return { mode: 'radial', overlaps: 0, columns: [] as { id: string; count: number }[], total: nodes.length };
    const nonCenter = nodes.filter(n => n.id !== 'center');
    const mode = recipeEnabled ? (activeRecipe ? 'recipe' : 'graph') : 'disabled';
    // Column counts: rely on position.x clustering if recipe active and recipe provides columns length
    let columns: { id: string; count: number }[] = [];
    if (activeRecipe) {
      // Group nodes by nearest recipe column order index using x positions ordering
      const sorted = [...nonCenter].sort((a,b)=>a.position.x-b.position.x);
      const colCount = activeRecipe.columns.length;
  const groups: { id: string; count: number }[] = activeRecipe.columns.map((c,i)=>({ id: c.id || c.label || `col-${i+1}`, count: 0 }));
      sorted.forEach((n, i) => {
        const bucket = Math.min(Math.floor(i / Math.max(1, Math.ceil(sorted.length / colCount))), colCount - 1);
        groups[bucket].count += 1;
      });
      columns = groups;
    }
    // Overlap: naive O(n^2) bounding box intersection check
    let overlaps = 0;
    for (let i=0;i<nonCenter.length;i++) {
      const a = nonCenter[i];
      const aw = (a.width as number) || 180;
      const ah = (a.height as number) || 100;
      const ax1 = a.position.x;
      const ay1 = a.position.y;
      const ax2 = ax1 + aw;
      const ay2 = ay1 + ah;
      for (let j=i+1;j<nonCenter.length;j++) {
        const b = nonCenter[j];
        const bw = (b.width as number) || 180;
        const bh = (b.height as number) || 100;
        const bx1 = b.position.x;
        const by1 = b.position.y;
        const bx2 = bx1 + bw;
        const by2 = by1 + bh;
        const intersect = ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;
        if (intersect) overlaps++;
      }
    }
    return { mode, overlaps, columns, total: nonCenter.length };
  }, [viewMode, recipeEnabled, activeRecipe, nodes]);
  const historyAvailable = canUndo || canRedo;
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
  <div className="backdrop-blur-md bg-white/90 border border-gray-200/80 rounded-xl shadow-lg px-5 py-2 flex items-center gap-4 text-sm transition-all duration-300 hover:shadow-xl">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Workspace:</span>
          <span className="text-gray-800">{workspaceName}</span>
        </div>
        
        <div className="w-px h-4 bg-gray-200" />
        
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Nodes:</span>
          <span className="text-gray-800">{nodeCount}</span>
        </div>
        
        <div className="w-px h-4 bg-gray-200" />
        <button
          type="button"
          onClick={() => setRecipeEnabled(!recipeEnabled)}
          className="flex items-center gap-2 px-2 py-1 rounded-md border text-xs transition-colors hover:bg-indigo-50 hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          title={recipeEnabled ? (activeRecipe ? `Recipe active: ${activeRecipe.title}` : "No recipe detected — using graph structure") : "Recipe matching disabled"}
        >
          {viewMode === 'process' ? (
            <>
              <LayoutGrid className={"w-3.5 h-3.5 " + (recipeEnabled ? "text-indigo-600" : "text-gray-400")} />
              <span className={recipeEnabled ? "text-indigo-700" : "text-gray-500"}>
                {recipeEnabled ? (activeRecipe ? activeRecipe.id : "graph") : "no-recipe"}
              </span>
            </>
          ) : (
            <>
              <Brackets className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-gray-500">radial</span>
            </>
          )}
        </button>

        {viewMode === 'process' && (
          <button
            type="button"
            onClick={() => setDiagnosticsOpen(d => !d)}
            className="flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] transition-colors hover:bg-blue-50 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
            title={`Mode: ${diagnostics.mode}; Overlaps: ${diagnostics.overlaps}`}
          >
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-blue-700">diag</span>
            {diagnostics.overlaps > 0 && <AlertTriangle className="w-3 h-3 text-amber-500" />}
          </button>
        )}

        {viewMode === 'process' && (
          <div className="flex items-center gap-1 text-[10px] text-gray-500">
            {recipeEnabled ? (activeRecipe ? 'Recipe' : 'Graph-aware') : 'Fallback'}
          </div>
        )}

        {selectedCount > 0 && (
          <>
            <div className="w-px h-4 bg-gray-200" />
            <div className="flex items-center gap-2 px-2 py-1 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-md animate-gradient-shift bg-[length:200%_200%]">
              <MousePointerClick className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-indigo-700">{selectedCount} selected</span>
            </div>
          </>
        )}
        
        {historyAvailable && (
          <>
            <div className="w-px h-4 bg-gray-200" />
            <div className="flex items-center gap-2">
              <History className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-gray-500 text-xs">
                {canUndo && canRedo && "Undo/Redo"}
                {canUndo && !canRedo && "Can Undo"}
                {!canUndo && canRedo && "Can Redo"}
              </span>
            </div>
          </>
        )}
        
        <div className="w-px h-4 bg-gray-200" />
        
        <div className="flex items-center gap-2">
          {isSaved ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-gray-500">Saved</span>
            </>
          ) : (
            <span className="text-gray-400">Unsaved changes</span>
          )}
        </div>

        {buildInfo && (
          <>
            <div className="w-px h-4 bg-gray-200" />
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500 cursor-help">
                    <span>{buildInfo.version || '0.0.0'}</span>
                    {buildInfo.sha && (<span className="font-mono">{buildInfo.sha}</span>)}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs space-y-0.5">
                    <div><span className="text-slate-500">Branch:</span> <span className="font-mono">{buildInfo.branch || 'unknown'}</span></div>
                    <div><span className="text-slate-500">Built:</span> <span>{buildInfo.time || 'unknown'}</span></div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        )}
      </div>
      {diagnosticsOpen && viewMode === 'process' && (
        <div className="mt-2 mx-auto w-[380px] backdrop-blur bg-white/90 border border-gray-200 rounded-lg shadow p-3 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">Layout diagnostics</span>
            <button
              type="button"
              onClick={() => setDiagnosticsOpen(false)}
              className="text-slate-400 hover:text-slate-600"
            >✕</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded border border-slate-200 p-2 bg-white">
              <div className="text-[10px] text-slate-500 uppercase">Mode</div>
              <div className="text-slate-700 font-medium">{diagnostics.mode}</div>
            </div>
            <div className="rounded border border-slate-200 p-2 bg-white">
              <div className="text-[10px] text-slate-500 uppercase">Overlaps</div>
              <div className={diagnostics.overlaps > 0 ? 'text-amber-600 font-medium' : 'text-emerald-600 font-medium'}>{diagnostics.overlaps}</div>
            </div>
          </div>
          {activeRecipe && diagnostics.columns.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] text-slate-500 uppercase">Columns ({diagnostics.columns.length})</div>
              <div className="grid grid-cols-3 gap-2">
                {diagnostics.columns.map(c => (
                  <div key={c.id} className="rounded border border-slate-200 p-2 bg-white flex flex-col">
                    <span className="text-[10px] text-slate-500 truncate" title={c.id}>{c.id}</span>
                    <span className="text-slate-700 font-medium">{c.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!activeRecipe && <div className="text-[10px] text-slate-500">No recipe matched; showing graph fallback metrics.</div>}
          <div className="text-[10px] text-slate-500">Nodes considered: {diagnostics.total}</div>
        </div>
      )}
    </div>
  );
}
