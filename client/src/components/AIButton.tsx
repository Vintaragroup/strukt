import { Button } from "./ui/button";
import { Sparkles } from "lucide-react";

interface AIButtonProps {
  onClick: () => void;
}

export function AIButton({ onClick }: AIButtonProps) {
  return (
    <div className="fixed bottom-20 right-4 z-40">
      <Button
        onClick={onClick}
        data-tour="ai-button"
        className="rounded-full h-11 px-5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-800 text-white shadow-md hover:shadow-xl transition-all duration-200 gap-2 animate-gradient-shift bg-[length:200%_200%] relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        <Sparkles className="w-4 h-4 relative z-10" />
        <span className="relative z-10">Ask AI</span>
      </Button>
    </div>
  );
}
