import { useMemo, useState } from "react";
import type { FoundationCategory, FoundationNodeTemplate } from "@/config/foundationNodes";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { cn } from "./ui/utils";
import { Sparkles, Layers } from "lucide-react";

interface FoundationNodePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: FoundationCategory[];
  existingLabels: Set<string>;
  onSelectTemplate: (template: FoundationNodeTemplate) => void;
  onUseWizard: () => void;
  onUseCustom?: () => void;
}

export function FoundationNodePicker({
  open,
  onOpenChange,
  categories,
  existingLabels,
  onSelectTemplate,
  onUseWizard,
  onUseCustom,
}: FoundationNodePickerProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<FoundationCategory["id"]>("backend");
  const activeCategory = useMemo(
    () => categories.find((category) => category.id === activeCategoryId) ?? categories[0],
    [categories, activeCategoryId]
  );

  const availableTemplates = activeCategory.templates.filter(
    (template) => !existingLabels.has(template.label)
  );
  const exhausted = availableTemplates.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl bg-white border border-slate-200/70 shadow-2xl rounded-3xl max-h-[calc(100vh-4rem)] overflow-y-auto">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-500" />
            Foundation palette
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600 leading-relaxed">
            Start with the building blocks you need. Each category unlocks curated nodes so you can lay
            down the backbone before diving into the full wizard.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 lg:flex-row">
          <div className="lg:w-56">
            <div className="flex flex-col gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategoryId(category.id)}
                  className={cn(
                    "text-left px-3 py-2 rounded-xl border transition-all",
                    activeCategoryId === category.id
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm"
                      : "border-transparent hover:border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <div className="text-sm font-semibold">{category.label}</div>
                  <p className="text-xs text-slate-500">{category.description}</p>
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-600 space-y-2">
                <p className="font-semibold text-slate-700">Need more context?</p>
                <p>Jump into the wizard for guided prompts.</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full gap-1 text-indigo-600 hover:bg-white"
                  onClick={onUseWizard}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Use wizard
                </Button>
              </div>

              {onUseCustom && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={onUseCustom}
                >
                  Create custom node
                </Button>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">{activeCategory.label}</p>
                <p className="text-xs text-slate-500">{activeCategory.description}</p>
              </div>
              <Badge variant="secondary" className="text-[11px] text-slate-600">
                {exhausted ? "All nodes placed" : `${availableTemplates.length} available`}
              </Badge>
            </div>

            {exhausted ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center text-sm text-slate-500">
                You’ve already placed each node in this category. Switch categories or open the wizard to
                dive deeper.
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
