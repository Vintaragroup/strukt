import { CheckCircle2, MousePointerClick, History } from "lucide-react";

interface StatusBarProps {
  workspaceName: string;
  nodeCount: number;
  isSaved: boolean;
  selectedCount?: number;
  canUndo?: boolean;
  canRedo?: boolean;
}

export function StatusBar({ workspaceName, nodeCount, isSaved, selectedCount = 0, canUndo = false, canRedo = false }: StatusBarProps) {
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
      </div>
    </div>
  );
}
