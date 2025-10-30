import { useState } from "react";
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
import { Sparkles, Lightbulb, Plus, Layout, Rocket, ShoppingCart, MessageSquare } from "lucide-react";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface AISuggestPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSuggestion: (suggestion: any) => void;
  onLoadTemplate?: (template: any) => void;
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

const templates = [
  {
    id: "saas-app",
    name: "SaaS Application",
    description: "Complete structure for a modern SaaS product with authentication, dashboards, and billing",
    icon: Rocket,
    color: "from-blue-500 to-cyan-600",
    nodes: 12,
    tags: ["SaaS", "Full Stack", "Popular"],
  },
  {
    id: "ecommerce",
    name: "E-Commerce Platform",
    description: "Product catalog, shopping cart, checkout flow, and order management system",
    icon: ShoppingCart,
    color: "from-green-500 to-emerald-600",
    nodes: 10,
    tags: ["E-Commerce", "Retail"],
  },
  {
    id: "social-app",
    name: "Social Media App",
    description: "User profiles, feeds, messaging, notifications, and content sharing features",
    icon: MessageSquare,
    color: "from-purple-500 to-pink-600",
    nodes: 15,
    tags: ["Social", "Mobile"],
  },
  {
    id: "blank",
    name: "Blank Canvas",
    description: "Start from scratch with just the center focal node",
    icon: Layout,
    color: "from-gray-500 to-slate-600",
    nodes: 1,
    tags: ["Custom"],
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
    if (onLoadTemplate) {
      onLoadTemplate(templateId);
      onClose();
    }
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

                {templates.map((template) => {
                  const Icon = template.icon;
                  return (
                    <div
                      key={template.id}
                      className="group p-5 rounded-2xl border-2 border-gray-200 bg-white hover:border-indigo-300 hover:shadow-lg transition-all cursor-pointer"
                      onClick={() => handleLoadTemplate(template.id)}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform`}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="text-gray-900 mb-1">{template.name}</h4>
                              <p className="text-sm text-gray-600">{template.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <Badge variant="outline" className="text-xs">
                              {template.nodes} {template.nodes === 1 ? 'node' : 'nodes'}
                            </Badge>
                            {template.tags.map((tag, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
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
                            handleLoadTemplate(template.id);
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
