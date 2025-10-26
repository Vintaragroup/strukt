import { useState } from "react";
import { motion } from "motion/react";
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
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import {
  Rocket,
  Microscope,
  Palette,
  Code,
  Target,
  Save,
  X,
} from "lucide-react";
import { Node, Edge } from "reactflow";
import { CustomNodeData } from "./CustomNode";
import { CenterNodeData } from "./CenterNode";
import { saveTemplate, Template } from "../utils/templates";
import { toast } from "sonner";

interface SaveTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodes: Node<CustomNodeData | CenterNodeData>[];
  edges: Edge[];
}

const categoryConfig = {
  product: {
    icon: Rocket,
    label: "Product",
    description: "Product launches, roadmaps, feature planning",
  },
  research: {
    icon: Microscope,
    label: "Research",
    description: "Research projects, studies, investigations",
  },
  design: {
    icon: Palette,
    label: "Design",
    description: "Design systems, UI/UX projects, branding",
  },
  development: {
    icon: Code,
    label: "Development",
    description: "Software projects, applications, APIs",
  },
  planning: {
    icon: Target,
    label: "Planning",
    description: "General planning, project management",
  },
};

export function SaveTemplateDialog({
  open,
  onOpenChange,
  nodes,
  edges,
}: SaveTemplateDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<Template["category"]>("planning");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    if (!description.trim()) {
      toast.error("Please enter a template description");
      return;
    }

    if (nodes.length === 0) {
      toast.error("Cannot save an empty template");
      return;
    }

    try {
      const template = saveTemplate(
        name.trim(),
        description.trim(),
        selectedCategory,
        nodes,
        edges,
        tags
      );

      toast.success(`Template "${template.name}" saved successfully!`);
      
      // Reset form
      setName("");
      setDescription("");
      setSelectedCategory("planning");
      setTags([]);
      setTagInput("");
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Failed to save template");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="w-5 h-5 text-purple-500" />
            Save as Template
          </DialogTitle>
          <DialogDescription>
            Save your current project as a reusable template
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Template Name */}
          <div className="space-y-2">
            <Label htmlFor="template-name">Template Name *</Label>
            <Input
              id="template-name"
              placeholder="e.g., Product Launch Plan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white/5 border-white/10"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="template-description">Description *</Label>
            <Textarea
              id="template-description"
              placeholder="Describe what this template is for and when to use it..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-white/5 border-white/10 min-h-[80px] resize-none"
            />
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <Label>Category *</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {Object.entries(categoryConfig).map(([key, config]) => {
                const Icon = config.icon;
                const isSelected = selectedCategory === key;

                return (
                  <motion.button
                    key={key}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() =>
                      setSelectedCategory(key as Template["category"])
                    }
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-all text-left ${
                      isSelected
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 mt-0.5 ${
                        isSelected ? "text-purple-500" : "text-white/60"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm mb-0.5">{config.label}</div>
                      <div className="text-xs text-white/50">
                        {config.description}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="template-tags">Tags (optional)</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  id="template-tags"
                  placeholder="Add tags (press Enter)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="bg-white/5 border-white/10"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim()}
                >
                  Add
                </Button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="bg-white/5 border-white/10"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1.5 hover:text-red-400 transition-colors"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm text-white/60 px-3 py-2 bg-white/5 rounded-lg border border-white/10">
            <span>
              {nodes.length} node{nodes.length !== 1 ? "s" : ""}
            </span>
            <span>
              {edges.length} connection{edges.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
