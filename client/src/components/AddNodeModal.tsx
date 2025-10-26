import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
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
import { Layers, Layout, Server, FileText, BookOpen, X, Briefcase, Package, Code, Brain, Settings, Users } from "lucide-react";
import { 
  DomainType, 
  getDepartmentsForDomain, 
  getRecommendedDepartment,
  DOMAIN_CONFIG 
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
  initialType?: string;
}

const nodeTypes = [
  { value: "root", label: "Root", icon: Layers, color: "text-purple-600 hover:bg-gradient-to-br hover:from-purple-50 hover:to-violet-100 border-purple-200" },
  { value: "frontend", label: "Frontend", icon: Layout, color: "text-blue-600 hover:bg-gradient-to-br hover:from-blue-50 hover:to-cyan-100 border-blue-200" },
  { value: "backend", label: "Backend", icon: Server, color: "text-emerald-600 hover:bg-gradient-to-br hover:from-emerald-50 hover:to-green-100 border-emerald-200" },
  { value: "requirement", label: "Requirement", icon: FileText, color: "text-amber-600 hover:bg-gradient-to-br hover:from-amber-50 hover:to-orange-100 border-amber-200" },
  { value: "doc", label: "Documentation", icon: BookOpen, color: "text-pink-600 hover:bg-gradient-to-br hover:from-pink-50 hover:to-rose-100 border-pink-200" },
];

const domainTypes = [
  { value: "business", label: "Business", icon: Briefcase, color: "text-orange-600 hover:bg-gradient-to-br hover:from-orange-50 hover:to-amber-100 border-orange-200" },
  { value: "product", label: "Product", icon: Package, color: "text-blue-600 hover:bg-gradient-to-br hover:from-blue-50 hover:to-cyan-100 border-blue-200" },
  { value: "tech", label: "Tech", icon: Code, color: "text-emerald-600 hover:bg-gradient-to-br hover:from-emerald-50 hover:to-green-100 border-emerald-200" },
  { value: "data-ai", label: "Data/AI", icon: Brain, color: "text-purple-600 hover:bg-gradient-to-br hover:from-purple-50 hover:to-violet-100 border-purple-200" },
  { value: "operations", label: "Operations", icon: Settings, color: "text-gray-600 hover:bg-gradient-to-br hover:from-gray-50 hover:to-slate-100 border-gray-200" },
];

export function AddNodeModal({ isOpen, onClose, onAdd, initialType }: AddNodeModalProps) {
  const [selectedType, setSelectedType] = useState(initialType || "requirement");
  const [selectedDomain, setSelectedDomain] = useState<string | undefined>("product");
  const [selectedDepartment, setSelectedDepartment] = useState<string | undefined>(undefined);
  const [selectedRing, setSelectedRing] = useState<number>(1);
  const [label, setLabel] = useState("");
  const [summary, setSummary] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [showError, setShowError] = useState(false);
  const labelInputRef = useRef<HTMLInputElement>(null);

  // Get departments for selected domain
  const availableDepartments = selectedDomain 
    ? getDepartmentsForDomain(selectedDomain as DomainType)
    : {};

  // Auto-select department when domain or type changes
  useEffect(() => {
    if (selectedDomain) {
      const recommended = getRecommendedDepartment(selectedDomain as DomainType, selectedType);
      setSelectedDepartment(recommended || undefined);
    }
  }, [selectedDomain, selectedType]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = () => {
    if (label.trim()) {
      onAdd({
        type: selectedType,
        label: label.trim(),
        summary: summary.trim(),
        tags,
        domain: selectedDomain,
        ring: selectedRing,
        department: selectedDepartment,
      });
      setLabel("");
      setSummary("");
      setTags([]);
      setTagInput("");
      setShowError(false);
      onClose();
    } else {
      setShowError(true);
      labelInputRef.current?.focus();
      setTimeout(() => setShowError(false), 500);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] backdrop-blur-md bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/20">
        <DialogHeader>
          <DialogTitle>Add New Node</DialogTitle>
          <DialogDescription>
            Create a new node by selecting a type and providing details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Node Type Selection */}
          <div className="space-y-2.5">
            <Label className="text-sm">Node Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {nodeTypes.map(({ value, label: typeLabel, icon: Icon, color }, index) => (
                <motion.div
                  key={value}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Button
                    variant={selectedType === value ? "default" : "outline"}
                    onClick={() => setSelectedType(value)}
                    className={`w-full justify-start gap-2 h-9 text-sm ${
                      selectedType === value ? "" : color
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {typeLabel}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Domain Selection */}
          <div className="space-y-2.5">
            <Label className="text-sm">Domain</Label>
            <div className="grid grid-cols-3 gap-2">
              {domainTypes.map(({ value, label: domainLabel, icon: Icon, color }, index) => (
                <motion.div
                  key={value}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Button
                    variant={selectedDomain === value ? "default" : "outline"}
                    onClick={() => setSelectedDomain(value)}
                    className={`w-full justify-start gap-2 h-9 text-sm ${
                      selectedDomain === value ? "" : color
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {domainLabel}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Department Selection */}
          {selectedDomain && Object.keys(availableDepartments).length > 0 && (
            <motion.div 
              className="space-y-2.5"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <Label className="text-sm flex items-center gap-2">
                <Users className="w-3.5 h-3.5" />
                Department / Team
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(availableDepartments).map(([key, dept], index) => {
                  const domainColor = DOMAIN_CONFIG[selectedDomain as DomainType]?.color || "#6b7280";
                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04, type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <Button
                        variant={selectedDepartment === key ? "default" : "outline"}
                        onClick={() => setSelectedDepartment(key)}
                        className={`w-full justify-center h-9 text-xs ${
                          selectedDepartment === key 
                            ? "" 
                            : "hover:bg-gradient-to-br hover:from-gray-50 hover:to-slate-100"
                        }`}
                        style={selectedDepartment !== key ? {
                          borderColor: `${domainColor}40`,
                          color: domainColor
                        } : undefined}
                      >
                        {dept.name}
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500">
                {selectedDepartment && availableDepartments[selectedDepartment]?.description}
              </p>
            </motion.div>
          )}

          {/* Ring Selection */}
          <div className="space-y-2.5">
            <Label className="text-sm">Ring Position</Label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((ring) => (
                <Button
                  key={ring}
                  variant={selectedRing === ring ? "default" : "outline"}
                  onClick={() => setSelectedRing(ring)}
                  className="w-full justify-center h-9 text-sm"
                >
                  Ring {ring}
                </Button>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              Ring 1: Core concepts • Ring 2: Categories • Ring 3: Details
            </p>
          </div>

          {/* Label Input */}
          <motion.div 
            className="space-y-2"
            animate={showError ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            <Label htmlFor="label" className="text-sm">Title <span className="text-red-500">*</span></Label>
            <Input
              ref={labelInputRef}
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Enter node title..."
              className={`h-9 ${showError ? 'border-red-500 ring-2 ring-red-200' : ''}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit();
                }
              }}
            />
            <AnimatePresence>
              {showError && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-sm text-red-500"
                >
                  Title is required
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Summary Input */}
          <div className="space-y-2">
            <Label htmlFor="summary" className="text-sm">Summary</Label>
            <Textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Enter a brief description..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Tags Input */}
          <div className="space-y-2">
            <Label htmlFor="tags" className="text-sm">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                placeholder="Add tags..."
                className="h-9"
              />
              <Button type="button" onClick={handleAddTag} variant="secondary" className="h-9">
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                <AnimatePresence mode="popLayout">
                  {tags.map((tag) => (
                    <motion.div
                      key={tag}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      layout
                    >
                      <Badge variant="secondary" className="gap-1 pr-1">
                        {tag}
                        <motion.button
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-0.5 hover:bg-gray-300 rounded-full p-0.5"
                        >
                          <X className="w-2.5 h-2.5" />
                        </motion.button>
                      </Badge>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="h-9">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!label.trim()} className="h-9">
            Add Node
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
