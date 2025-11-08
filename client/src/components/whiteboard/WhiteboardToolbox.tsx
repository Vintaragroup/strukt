import { useMemo } from "react";
import { Eraser, LassoSelect, Square, PencilLine, ToggleLeft, ToggleRight } from "lucide-react";
import { useUIPreferences } from "@/store/useUIPreferences";
import type { WhiteboardTool } from "@/types/whiteboard";
import { cn } from "../ui/utils";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

const TOOL_CONFIG: Array<{ id: WhiteboardTool; label: string; icon: React.ComponentType<any>; hint: string }> = [
  { id: "eraser", label: "Eraser", icon: Eraser, hint: "Scratch out nodes or edges" },
  { id: "lasso", label: "Lasso", icon: LassoSelect, hint: "Freehand select nodes" },
  { id: "rectangle", label: "Rectangle", icon: Square, hint: "Draw layout blocks" },
  { id: "freehand", label: "Freehand", icon: PencilLine, hint: "Sketch annotations" },
];

export function WhiteboardToolbox() {
  const { whiteboardTool, setWhiteboardTool, lassoMode, setLassoMode } = useUIPreferences();

  const activeLabel = useMemo(() => {
    const active = TOOL_CONFIG.find((tool) => tool.id === whiteboardTool);
    return active?.hint ?? "Select a tool to enable whiteboard gadgets.";
  }, [whiteboardTool]);

  const toggleTool = (tool: WhiteboardTool) => {
    if (whiteboardTool === tool) {
      setWhiteboardTool("none");
    } else {
      setWhiteboardTool(tool);
    }
  };

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-2">
      <div className="rounded-3xl border border-slate-200 bg-white/90 backdrop-blur shadow-lg p-3 space-y-3 w-48">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-800">Whiteboard tools</p>
          <p className="text-xs text-slate-500 leading-relaxed">{activeLabel}</p>
        </div>
        <div className="flex flex-col gap-2">
          {TOOL_CONFIG.map(({ id, label, icon: Icon, hint }) => (
            <button
              key={id}
              type="button"
              className={cn(
                "flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm transition-all",
                whiteboardTool === id
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
              onClick={() => toggleTool(id)}
            >
              <Icon className={cn("w-4 h-4", whiteboardTool === id ? "text-indigo-600" : "text-slate-400")} />
              <span>{label}</span>
              <Badge
                variant="secondary"
                className={cn(
                  "ml-auto text-[10px]",
                  whiteboardTool === id ? "bg-white text-indigo-700" : "text-slate-500"
                )}
              >
                {whiteboardTool === id ? "On" : "Off"}
              </Badge>
            </button>
          ))}
        </div>
        {whiteboardTool === "lasso" && (
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 px-3 py-2 space-y-2">
            <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Lasso mode</div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={lassoMode === "full" ? "default" : "outline"}
                size="sm"
                className={lassoMode === "full" ? "bg-indigo-600 hover:bg-indigo-700" : ""}
                onClick={() => setLassoMode("full")}
              >
                <ToggleLeft className="w-3.5 h-3.5 mr-1" />
                Full
              </Button>
              <Button
                type="button"
                variant={lassoMode === "partial" ? "default" : "outline"}
                size="sm"
                className={lassoMode === "partial" ? "bg-indigo-600 hover:bg-indigo-700" : ""}
                onClick={() => setLassoMode("partial")}
              >
                <ToggleRight className="w-3.5 h-3.5 mr-1" />
                Partial
              </Button>
            </div>
            <p className="text-[11px] text-slate-500">
              Full requires the entire node to sit inside the loop. Partial selects if the outline clips any side.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
