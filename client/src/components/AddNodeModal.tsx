import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import {
  Layers,
  Layout,
  Server,
  FileText,
  BookOpen,
  X,
  Briefcase,
  Package,
  Code,
  Brain,
  Settings,
  Users,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  DomainType,
  getDepartmentsForDomain,
  getRecommendedDepartment,
  getDomainForNodeType,
  DOMAIN_CONFIG,
} from "../utils/domainLayout";

interface AddNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (nodeData: {
    type: string;
    label: string;
    summary: string;
    tags: string[];
    domain?: string;
    ring?: number;
    department?: string;
  }) => void;
  onUseWizard?: (seed?: string) => void;
  initialType?: string;
  initialPrompt?: string;
}

const nodeTypes = [
  { value: "requirement", label: "Requirement", icon: FileText },
  { value: "frontend", label: "Frontend", icon: Layout },
  { value: "backend", label: "Backend", icon: Server },
  { value: "doc", label: "Documentation", icon: BookOpen },
  { value: "root", label: "Root", icon: Layers },
];

const domainTypes = [
  { value: "business" as DomainType, label: "Business", icon: Briefcase },
  { value: "product" as DomainType, label: "Product", icon: Package },
  { value: "tech" as DomainType, label: "Tech", icon: Code },
  { value: "data-ai" as DomainType, label: "Data / AI", icon: Brain },
  { value: "operations" as DomainType, label: "Operations", icon: Settings },
] as const;

export function AddNodeModal({
  isOpen,
  onClose,
  onAdd,
  onUseWizard,
  initialType,
  initialPrompt,
}: AddNodeModalProps) {
  const defaultType = initialType || "requirement";
  const defaultDomain = getDomainForNodeType(defaultType);
  const defaultDepartment = getRecommendedDepartment(defaultDomain, defaultType);

  const [selectedType, setSelectedType] = useState(defaultType);
  const [selectedDomain, setSelectedDomain] = useState<DomainType | undefined>(defaultDomain);
  const [selectedDepartment, setSelectedDepartment] = useState<string | undefined>(
    defaultDepartment || undefined
  );
  const [selectedRing, setSelectedRing] = useState<number>(1);
  const [label, setLabel] = useState("");
  const [summary, setSummary] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [showError, setShowError] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const labelInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const nextType = initialType || "requirement";
    const nextDomain = getDomainForNodeType(nextType);
    const recommendedDept = getRecommendedDepartment(nextDomain, nextType);

    setSelectedType(nextType);
    setSelectedDomain(nextDomain);
    setSelectedDepartment(recommendedDept || undefined);
    setSelectedRing(1);
    setLabel("");
    setSummary(initialPrompt ?? "");
    setTags([]);
    setTagInput("");
    setShowAdvanced(false);

    requestAnimationFrame(() => labelInputRef.current?.focus());
  }, [initialPrompt, initialType, isOpen]);

  useEffect(() => {
    const recommendedDomain = getDomainForNodeType(selectedType);
    setSelectedDomain((current) =>
      showAdvanced ? current ?? recommendedDomain : recommendedDomain
    );

    if (!showAdvanced) {
      const recommendedDept = getRecommendedDepartment(recommendedDomain, selectedType);
      setSelectedDepartment(recommendedDept || undefined);
    }
  }, [selectedType, showAdvanced]);

  const availableDepartments =
    selectedDomain && showAdvanced ? getDepartmentsForDomain(selectedDomain) : {};

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    setTags((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setTagInput("");
  };

  const handleRemoveTag = (value: string) => {
    setTags((prev) => prev.filter((tag) => tag !== value));
  };

  const handleSubmit = () => {
    const trimmedLabel = label.trim();
    if (!trimmedLabel) {
      setShowError(true);
      requestAnimationFrame(() => labelInputRef.current?.focus());
      setTimeout(() => setShowError(false), 350);
      return;
    }

    onAdd({
      type: selectedType,
      label: trimmedLabel,
      summary: summary.trim(),
      tags,
      domain: selectedDomain,
      ring: selectedRing,
      department: selectedDepartment,
    });
    onClose();
  };

  const handleWizardClick = () => {
    if (!onUseWizard) return;
    const seed = summary.trim() || label.trim() || initialPrompt;
    onUseWizard(seed);
  };

  const toggleAdvanced = () => setShowAdvanced((prev) => !prev);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px] bg-white border border-slate-200/60 shadow-2xl rounded-3xl max-h-[calc(100vh-4rem)] overflow-y-auto">
        <DialogHeader className="space-y-2.5 pb-3">
          <DialogTitle className="text-xl font-semibold text-slate-900">Quick add node</DialogTitle>
          <DialogDescription className="text-sm text-slate-600 leading-relaxed">
            Capture the essentials now and refine later. Switch to the AI wizard anytime for a guided
            build.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-1">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              Node type
            </Label>
            <div className="flex flex-wrap gap-2">
              {nodeTypes.map(({ value, label: typeLabel, icon: Icon }) => (
                <Button
                  key={value}
                  variant={selectedType === value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(value)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm ${
                    selectedType === value
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {typeLabel}
                </Button>
              ))}
            </div>
          </div>

          <motion.div
            className="space-y-2"
            animate={showError ? { x: [-6, 6, -4, 4, 0] } : {}}
            transition={{ duration: 0.25 }}
          >
            <Label className="text-sm font-medium text-slate-700 flex items-center gap-1">
              Title <span className="text-rose-500">*</span>
            </Label>
            <Input
              ref={labelInputRef}
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="What’s the name of this node?"
              className="h-11 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </motion.div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 flex items-center gap-1">
              Summary <span className="text-slate-400 text-xs">(optional)</span>
            </Label>
            <Textarea
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="Add helpful context so teammates understand the goal."
              rows={3}
              className="resize-none border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
            <div className="text-xs text-slate-600">
              Need AI to expand this idea with templates and follow-up questions?
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleWizardClick}
              className="h-8 px-3 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Use wizard
            </Button>
          </div>

          <div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={toggleAdvanced}
              className="w-full justify-between text-slate-600 hover:text-slate-800 hover:bg-slate-50"
            >
              Advanced options
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>

            <AnimatePresence initial={false}>
              {showAdvanced && (
                <motion.div
                  key="advanced-section"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="pl-1 mt-4 space-y-4"
                >
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Domain</Label>
                    <div className="flex flex-wrap gap-2">
                      {domainTypes.map(({ value, label: domainLabel, icon: Icon }) => (
                        <Button
                          key={value}
                          variant={selectedDomain === value ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedDomain(value)}
                          className={`gap-1.5 ${
                            selectedDomain === value
                              ? "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600"
                              : "border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {domainLabel}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {selectedDomain && Object.keys(availableDepartments).length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        Department / team
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(availableDepartments).map(([key, dept]) => {
                          const domainColor =
                            selectedDomain ? DOMAIN_CONFIG[selectedDomain]?.color || "#4b5563" : "#4b5563";
                          const isActive = selectedDepartment === key;
                          return (
                            <Button
                              key={key}
                              size="sm"
                              variant={isActive ? "default" : "outline"}
                              onClick={() => setSelectedDepartment(key)}
                              className={`justify-start ${
                                isActive
                                  ? "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600"
                                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                              style={!isActive ? { color: domainColor } : undefined}
                            >
                              {dept.name}
                            </Button>
                          );
                        })}
                      </div>
                      {selectedDepartment && availableDepartments[selectedDepartment]?.description && (
                        <p className="text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-md">
                          {availableDepartments[selectedDepartment].description}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Ring position</Label>
                    <div className="flex gap-2">
                      {[1, 2, 3].map((ring) => (
                        <Button
                          key={ring}
                          size="sm"
                          variant={selectedRing === ring ? "default" : "outline"}
                          onClick={() => setSelectedRing(ring)}
                          className="w-full"
                        >
                          Ring {ring}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500">
                      Ring 1: Core concepts • Ring 2: Supporting detail • Ring 3: Deep dive
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Tags</Label>
                    <div className="flex gap-2">
                      <Input
                        value={tagInput}
                        onChange={(event) => setTagInput(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            handleAddTag();
                          }
                        }}
                        placeholder="Press enter to add"
                        className="h-10 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                      />
                      <Button type="button" variant="secondary" size="sm" onClick={handleAddTag}>
                        Add
                      </Button>
                    </div>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <AnimatePresence>
                          {tags.map((tag) => (
                            <motion.div
                              key={tag}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.85 }}
                            >
                              <Badge variant="secondary" className="gap-1">
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTag(tag)}
                                  className="rounded-full bg-slate-200/70 hover:bg-slate-300 p-0.5"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </Badge>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <DialogFooter className="pt-6 border-t border-slate-100">
          <Button
            variant="outline"
            onClick={onClose}
            className="h-11 px-5 border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!label.trim()}
            className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-100"
          >
            Create node
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
