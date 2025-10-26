import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import {
  Rocket,
  Microscope,
  Palette,
  Code,
  Target,
  Search,
  Sparkles,
  Trash2,
  Calendar,
  User,
  X,
} from "lucide-react";
import {
  getAllTemplates,
  getTemplatesByCategory,
  searchTemplates,
  deleteTemplate,
  Template,
} from "../utils/templates";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

interface TemplateGalleryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadTemplate: (template: Template) => void;
}

const categoryConfig = {
  product: {
    icon: Rocket,
    label: "Product",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  research: {
    icon: Microscope,
    label: "Research",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  design: {
    icon: Palette,
    label: "Design",
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
  },
  development: {
    icon: Code,
    label: "Development",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  planning: {
    icon: Target,
    label: "Planning",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
};

export function TemplateGallery({
  open,
  onOpenChange,
  onLoadTemplate,
}: TemplateGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<
    Template["category"] | "all"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  const templates = useMemo(() => {
    if (searchQuery.trim()) {
      return searchTemplates(searchQuery);
    }
    if (selectedCategory === "all") {
      return getAllTemplates();
    }
    return getTemplatesByCategory(selectedCategory);
  }, [selectedCategory, searchQuery]);

  const handleLoadTemplate = (template: Template) => {
    onLoadTemplate(template);
    onOpenChange(false);
  };

  const handleDeleteTemplate = (templateId: string) => {
    try {
      deleteTemplate(templateId);
      setTemplateToDelete(null);
      // Trigger re-render by changing search query momentarily
      setSearchQuery((prev) => prev + " ");
      setTimeout(() => setSearchQuery((prev) => prev.trim()), 0);
    } catch (error) {
      console.error("Error deleting template:", error);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl h-[80vh] p-0 gap-0">
          <DialogHeader className="p-6 pb-4 border-b border-white/10">
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Template Gallery
            </DialogTitle>
            <DialogDescription>
              Choose a template to get started quickly
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Search and Filter */}
            <div className="p-6 pb-4 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10"
                />
                {searchQuery && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>

              {/* Categories */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant={selectedCategory === "all" ? "default" : "outline"}
                  onClick={() => setSelectedCategory("all")}
                  className="h-8"
                >
                  All Templates
                </Button>
                {Object.entries(categoryConfig).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <Button
                      key={key}
                      size="sm"
                      variant={
                        selectedCategory === key ? "default" : "outline"
                      }
                      onClick={() =>
                        setSelectedCategory(key as Template["category"])
                      }
                      className="h-8"
                    >
                      <Icon className="w-3 h-3 mr-1.5" />
                      {config.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Templates Grid */}
            <ScrollArea className="flex-1 px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
                <AnimatePresence mode="popLayout">
                  {templates.map((template) => {
                    const categoryData = categoryConfig[template.category];
                    const CategoryIcon = categoryData.icon;

                    return (
                      <motion.div
                        key={template.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="group relative"
                      >
                        <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-lg border border-white/20 p-4 hover:border-white/30 transition-all hover:shadow-lg hover:shadow-purple-500/10">
                          {/* Category Badge */}
                          <div className="flex items-center justify-between mb-3">
                            <div
                              className={`flex items-center gap-1.5 px-2 py-1 rounded ${categoryData.bgColor}`}
                            >
                              <CategoryIcon
                                className={`w-3 h-3 ${categoryData.color}`}
                              />
                              <span
                                className={`text-xs ${categoryData.color}`}
                              >
                                {categoryData.label}
                              </span>
                            </div>

                            {template.isBuiltIn ? (
                              <Badge
                                variant="outline"
                                className="text-xs bg-white/5 border-white/20"
                              >
                                <Sparkles className="w-2.5 h-2.5 mr-1" />
                                Built-in
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTemplateToDelete(template.id);
                                }}
                              >
                                <Trash2 className="w-3 h-3 text-red-400" />
                              </Button>
                            )}
                          </div>

                          {/* Template Info */}
                          <h3 className="mb-2">{template.name}</h3>
                          <p className="text-sm text-white/60 mb-4 line-clamp-2">
                            {template.description}
                          </p>

                          {/* Metadata */}
                          <div className="flex items-center gap-3 mb-4 text-xs text-white/40">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {template.metadata.createdAt.toLocaleDateString()}
                            </div>
                            {template.metadata.author && (
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {template.metadata.author}
                              </div>
                            )}
                          </div>

                          {/* Stats */}
                          <div className="flex items-center gap-4 mb-4 text-xs text-white/50">
                            <span>
                              {template.nodes.length} node
                              {template.nodes.length !== 1 ? "s" : ""}
                            </span>
                            <span>
                              {template.edges.length} connection
                              {template.edges.length !== 1 ? "s" : ""}
                            </span>
                          </div>

                          {/* Tags */}
                          {template.metadata.tags &&
                            template.metadata.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-4">
                                {template.metadata.tags.slice(0, 3).map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="outline"
                                    className="text-xs bg-white/5 border-white/10"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}

                          {/* Use Template Button */}
                          <Button
                            onClick={() => handleLoadTemplate(template)}
                            className="w-full"
                            size="sm"
                          >
                            Use Template
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {templates.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Search className="w-12 h-12 text-white/20 mb-4" />
                  <h3 className="text-white/60 mb-2">No templates found</h3>
                  <p className="text-sm text-white/40">
                    Try a different search or category
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={templateToDelete !== null}
        onOpenChange={(open) => !open && setTemplateToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this custom template. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => templateToDelete && handleDeleteTemplate(templateToDelete)}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
