import { Button } from "./ui/button";
import { 
  Bold, 
  Italic, 
  Code, 
  List, 
  ListOrdered, 
  Link2 
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface FloatingFormatToolbarProps {
  isVisible: boolean;
}

export function FloatingFormatToolbar({ isVisible }: FloatingFormatToolbarProps) {
  if (!isVisible) return null;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40">
        <div className="backdrop-blur-md bg-white/90 border border-gray-200/80 rounded-xl shadow-lg px-2 py-1.5 flex items-center gap-0.5 animate-in fade-in slide-in-from-top-4 duration-200">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-gray-600 hover:bg-gray-100"
              >
                <Bold className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Bold</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-gray-600 hover:bg-gray-100"
              >
                <Italic className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Italic</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-gray-600 hover:bg-gray-100"
              >
                <Code className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Code</p>
            </TooltipContent>
          </Tooltip>
          
          <div className="w-px h-4 bg-gray-200 mx-1" />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-gray-600 hover:bg-gray-100"
              >
                <List className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Bullet List</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-gray-600 hover:bg-gray-100"
              >
                <ListOrdered className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Numbered List</p>
            </TooltipContent>
          </Tooltip>
          
          <div className="w-px h-4 bg-gray-200 mx-1" />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-gray-600 hover:bg-gray-100"
              >
                <Link2 className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Insert Link</p>
            </TooltipContent>
          </Tooltip>
          
          <div className="w-px h-4 bg-gray-200 mx-1" />
          
          <span className="text-xs text-gray-500 px-2">Text Formatting</span>
        </div>
      </div>
    </TooltipProvider>
  );
}
