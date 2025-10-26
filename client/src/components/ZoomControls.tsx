import { Button } from "./ui/button";
import { Plus, Minus, Maximize2, Focus, Crosshair } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onFitSelection?: () => void;
  onCenterCanvas?: () => void;
  hasSelection?: boolean;
  zoomLevel?: number;
}

export function ZoomControls({ 
  onZoomIn, 
  onZoomOut, 
  onFitView, 
  onFitSelection,
  onCenterCanvas,
  hasSelection = false,
  zoomLevel = 1
}: ZoomControlsProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="fixed bottom-20 left-4 z-40">
        <div className="backdrop-blur-md bg-white/90 border border-gray-200/80 rounded-xl shadow-lg p-1.5 flex flex-col gap-0.5 transition-all duration-300 hover:shadow-xl">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onZoomIn}
                className="h-8 w-8 hover:bg-gray-100 text-gray-600"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Zoom In</p>
            </TooltipContent>
          </Tooltip>
          
          <div className="w-full h-px bg-gray-200" />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onZoomOut}
                className="h-8 w-8 hover:bg-gray-100 text-gray-600"
              >
                <Minus className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Zoom Out</p>
            </TooltipContent>
          </Tooltip>
          
          {/* Zoom level indicator */}
          <div className="px-2 py-1 text-xs text-gray-500 text-center">
            {Math.round(zoomLevel * 100)}%
          </div>
          
          <div className="w-full h-px bg-gray-200" />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onFitView}
                className="h-8 w-8 hover:bg-gray-100 text-gray-600"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Fit All Nodes</p>
            </TooltipContent>
          </Tooltip>
          
          {hasSelection && onFitSelection && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onFitSelection}
                    className="h-8 w-8 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 text-indigo-600"
                  >
                    <Focus className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Zoom to Selected</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}
          
          {onCenterCanvas && (
            <>
              <div className="w-full h-px bg-gray-200" />
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onCenterCanvas}
                    className="h-8 w-8 hover:bg-gray-100 text-gray-600"
                  >
                    <Crosshair className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Center Canvas</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
