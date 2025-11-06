import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { cn } from "./ui/utils";

export type FoundationDistribution = "marketplace" | "internal";
export type FoundationConfidence = "beginner" | "confident" | "expert";
export type FoundationApproach = "simple" | "scalable" | "aws";

export interface FoundationConfig {
  distribution: FoundationDistribution;
  confidence: FoundationConfidence;
  approach?: FoundationApproach; // only when not beginner
}

export function FoundationSetupDialog({
  open,
  onOpenChange,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (config: FoundationConfig) => void;
}) {
  const [distribution, setDistribution] = useState<FoundationDistribution>("marketplace");
  const [confidence, setConfidence] = useState<FoundationConfidence>("beginner");
  const [approach, setApproach] = useState<FoundationApproach>("simple");

  const canApply = Boolean(distribution && confidence && (confidence === "beginner" || approach));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="text-base">Foundation setup</DialogTitle>
          <DialogDescription className="text-xs">Answer a couple questions and we’ll create the core nodes and connections.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-700">How will this be distributed?</p>
            <div className="flex flex-wrap gap-2">
              {([
                { id: "marketplace", label: "Marketplace (public)" },
                { id: "internal", label: "Internal (private)" },
              ] as const).map((opt) => (
                <Button
                  key={opt.id}
                  type="button"
                  variant={distribution === opt.id ? "default" : "outline"}
                  className={cn("h-8 text-xs", distribution === opt.id ? "bg-indigo-600" : "")}
                  onClick={() => setDistribution(opt.id)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-700">How confident are you building the backend and data layer?</p>
            <div className="flex flex-wrap gap-2">
              {([
                { id: "beginner", label: "Beginner" },
                { id: "confident", label: "Confident" },
                { id: "expert", label: "Expert" },
              ] as const).map((opt) => (
                <Button
                  key={opt.id}
                  type="button"
                  variant={confidence === opt.id ? "default" : "outline"}
                  className={cn("h-8 text-xs", confidence === opt.id ? "bg-indigo-600" : "")}
                  onClick={() => setConfidence(opt.id)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
            {confidence !== "beginner" && (
              <div className="mt-2">
                <p className="text-[11px] text-slate-600 mb-1">What do you prefer for data management and storage?</p>
                <div className="flex flex-wrap gap-2">
                  {([
                    { id: "simple", label: "Simple & cost‑effective" },
                    { id: "scalable", label: "Scalable & modular" },
                    { id: "aws", label: "AWS one‑stop" },
                  ] as const).map((opt) => (
                    <Button
                      key={opt.id}
                      type="button"
                      variant={approach === opt.id ? "default" : "outline"}
                      className={cn("h-8 text-xs", approach === opt.id ? "bg-indigo-600" : "")}
                      onClick={() => setApproach(opt.id)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-[10px]">Auto‑create authentication, onboarding, frontend, backend, and data nodes</Badge>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button
                type="button"
                disabled={!canApply}
                onClick={() => onApply({ distribution, confidence, approach: confidence === "beginner" ? undefined : approach })}
              >
                Create foundation
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
