import { useMemo } from "react";
import type { FoundationNodeTemplate } from "@/config/foundationNodes";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface AssociatedNodePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentLabel: string;
  templates: FoundationNodeTemplate[];
  existingLabels: Set<string>;
  onSelectTemplate: (template: FoundationNodeTemplate) => void;
  onUseCustom?: () => void;
}

export function AssociatedNodePicker({
  open,
  onOpenChange,
  parentLabel,
  templates,
  existingLabels,
  onSelectTemplate,
  onUseCustom,
}: AssociatedNodePickerProps) {
  const availableTemplates = useMemo(
    () => templates.filter((t) => !existingLabels.has(t.label)),
    [existingLabels, templates]
  );

  const exhausted = availableTemplates.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl bg-white border border-slate-200/70 shadow-2xl rounded-3xl max-h-[calc(100vh-4rem)] overflow-y-auto">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="text-2xl font-semibold text-slate-900">
            Associated nodes for {parentLabel}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600 leading-relaxed">
            Pick an associated building block or add a custom node.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-700">Recommended</div>
            <Badge variant="secondary" className="text-[11px] text-slate-600">
              {exhausted ? "All nodes placed" : `${availableTemplates.length} available`}
            </Badge>
          </div>

          {exhausted ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center text-sm text-slate-500">
              You've placed all recommended nodes. You can still add a custom node.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {availableTemplates.map((template) => (
                <div
                  key={template.id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{template.label}</div>
                      {template.subtext && (
                        <p className="text-xs text-slate-500">{template.subtext}</p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wide text-slate-500">
                      {template.nodeType}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">{template.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {template.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <Button
                    type="button"
                    className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => onSelectTemplate(template)}
                  >
                    Add to canvas
                  </Button>
                </div>
              ))}
            </div>
          )}

          {onUseCustom && (
            <div className="pt-2">
              <Button type="button" variant="outline" className="w-full" onClick={onUseCustom}>
                Create custom node
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
