import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { Layers, Layout, Server, FileText, BookOpen } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onAddNodeType: (type: string) => void;
}

const nodeTypes = [
  { type: "root", icon: Layers, label: "Root", color: "text-purple-600 hover:bg-gradient-to-br hover:from-purple-50 hover:to-violet-100" },
  { type: "frontend", icon: Layout, label: "Frontend", color: "text-blue-600 hover:bg-gradient-to-br hover:from-blue-50 hover:to-cyan-100" },
  { type: "backend", icon: Server, label: "Backend", color: "text-emerald-600 hover:bg-gradient-to-br hover:from-emerald-50 hover:to-green-100" },
  { type: "requirement", icon: FileText, label: "Requirement", color: "text-amber-600 hover:bg-gradient-to-br hover:from-amber-50 hover:to-orange-100" },
  { type: "doc", icon: BookOpen, label: "Doc", color: "text-pink-600 hover:bg-gradient-to-br hover:from-pink-50 hover:to-rose-100" },
];

export function Sidebar({ isOpen, onToggle, onAddNodeType }: SidebarProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="fixed left-4 top-20 z-40">
        <div className="backdrop-blur-md bg-white/90 border border-gray-200/80 rounded-2xl shadow-lg p-2 flex flex-col gap-1 transition-all duration-300 hover:shadow-xl">
          {nodeTypes.map(({ type, icon: Icon, label, color }) => (
            <Tooltip key={type}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onAddNodeType(type)}
                  className={`h-9 w-9 ${color}`}
                >
                  <Icon className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
