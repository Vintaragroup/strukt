import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { ScrollArea } from "./ui/scroll-area";
import { Sparkles, Lightbulb, Plus, Layout, Rocket, Microscope, Code } from "lucide-react";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Template, getTemplateById } from "../utils/templates";

interface AISuggestPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSuggestion: (suggestion: any) => void;
  onLoadTemplate?: (template: Template) => void;
}

const mockSuggestions = [
  {
    type: "frontend",
    label: "User Dashboard",
    summary: "Create a centralized dashboard for user analytics and metrics",
    tags: ["UI", "Analytics"],
  },
  {
    type: "backend",
    label: "Authentication API",
    summary: "Implement secure user authentication with JWT tokens",
    tags: ["Security", "API"],
  },
  {
    type: "requirement",
    label: "Mobile Responsiveness",
    summary: "Ensure all components work seamlessly on mobile devices",
    tags: ["UX", "Mobile"],
  },
  {
    type: "doc",
    label: "API Documentation",
    summary: "Comprehensive API documentation with examples",
    tags: ["Docs", "API"],
  },
];

const templateCards = [
  {
    id: "product-launch",
    label: "SaaS Launch Plan",
    description: "Kick off a full go-to-market plan with features, marketing, and launch timeline.",
    icon: Rocket,
    color: "from-blue-500 to-cyan-600",
    fallbackTags: ["SaaS", "Launch"],
  },
  {
    id: "research-project",
    label: "Research Project",
    description: "Structure questions, methodology, findings, and documentation for research work.",
    icon: Microscope,
    color: "from-green-500 to-emerald-600",
    fallbackTags: ["Research", "Insights"],
  },
  {
    id: "fullstack-app",
    label: "Fullstack App Blueprint",
    description: "Frontend, backend, database, and deployment scaffolding to jumpstart development.",
    icon: Code,
    color: "from-purple-500 to-pink-600",
    fallbackTags: ["Engineering", "Architecture"],
  },
  {
    id: "design-system",
    label: "Design System",
    description: "Tokens, components, patterns, and documentation for cohesive product design.",
    icon: Layout,
    color: "from-amber-500 to-orange-600",
    fallbackTags: ["Design", "UI"],
  },
  {
    id: "blank",
    label: "Blank Canvas",
    description: "Start fresh with just the center focal node and build your own structure.",
    icon: Layout,
    color: "from-gray-500 to-slate-600",
    fallbackTags: ["Custom"],
  },
];

export function AISuggestPanel({ isOpen, onClose, onAddSuggestion, onLoadTemplate }: AISuggestPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [suggestions, setSuggestions] = useState(mockSuggestions);

  const handleGenerate = () => {
    // In a real app, this would call an AI API
    setSuggestions(mockSuggestions);
  };

  const handleLoadTemplate = (templateId: string) => {
    if (!onLoadTemplate) {
      return;
    }

    const template = getTemplateById(templateId);
    if (!template) {
      toast.error("Template unavailable", {
        description: "We couldn't find the selected template. Please try another option.",
      });
      return;
    }

    onLoadTemplate(template);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[700px] max-h-[85vh] backdrop-blur-xl bg-white/95 flex flex-col overflow-hidden"
        data-testid="ai-suggest-modal"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-500" />
            AI Assistant & Templates
          </DialogTitle>
          <DialogDescription>
            Get AI-powered suggestions or start with a ready-made template.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="templates" className="w-full flex-1 min-h-0 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="templates" className="gap-2">
              <Layout className="w-4 h-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="gap-2">
              <Sparkles className="w-4 h-4" />
              AI Suggestions
            </TabsTrigger>
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4 flex-1 min-h-0">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-500 mb-3">
                  <Lightbulb className="w-4 h-4" />
                  <span>Choose a Template</span>
                </div>

                {templateCards.map((card) => {
                  const template = getTemplateById(card.id);
                  const Icon = card.icon;
                  const nodeCount = template?.nodes?.length ?? 0;
                  const tags =
                    template?.metadata?.tags && template.metadata.tags.length > 0
                      ? template.metadata.tags
                      : card.fallbackTags;

                  return (
                    <div
                      key={card.id}
                      className="group p-5 rounded-2xl border-2 border-gray-200 bg-white hover:border-indigo-300 hover:shadow-lg transition-all cursor-pointer"
                      onClick={() => handleLoadTemplate(card.id)}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform`}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="text-gray-900 mb-1">{card.label}</h4>
                              <p className="text-sm text-gray-600">{card.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <Badge variant="outline" className="text-xs">
                              {nodeCount} {nodeCount === 1 ? "node" : "nodes"}
                            </Badge>
                            {tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLoadTemplate(card.id);
                          }}
                        >
                          Use Template
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* AI Suggestions Tab */}
          <TabsContent value="suggestions" className="space-y-4 flex-1 min-h-0">
            {/* Prompt Input */}
            <div className="space-y-2">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your project or ask for suggestions..."
                rows={4}
                className="resize-none"
              />
              <Button onClick={handleGenerate} className="w-full gap-2">
                <Sparkles className="w-4 h-4" />
                Generate Suggestions
              </Button>
            </div>

            {/* Suggestions List */}
            <ScrollArea className="h-full pr-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-500 mb-3">
                  <Lightbulb className="w-4 h-4" />
                  <span>Suggested Nodes</span>
                </div>

                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-2xl border border-gray-200 bg-white hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="text-gray-900">{suggestion.label}</h4>
                        <Badge
                          variant="secondary"
                          className={`mt-1 ${
                            suggestion.type === "frontend"
                              ? "bg-blue-100 text-blue-700"
                              : suggestion.type === "backend"
                              ? "bg-green-100 text-green-700"
                              : suggestion.type === "requirement"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-pink-100 text-pink-700"
                          }`}
                        >
                          {suggestion.type}
                        </Badge>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onAddSuggestion(suggestion)}
                        className="shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    <p className="text-gray-600 mb-2">{suggestion.summary}</p>

                    <div className="flex flex-wrap gap-1.5">
                      {suggestion.tags.map((tag, tagIndex) => (
                        <Badge key={tagIndex} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
