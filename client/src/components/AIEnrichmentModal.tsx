import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import { Sparkles, ArrowRight, RotateCcw, Plus, CheckCircle2, FileText, ListTodo, Tag as TagIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { 
  getQuestionsForNodeType, 
  NodeType 
} from "../utils/enrich/EnrichmentQuestionBank";
import { 
  aiGenerator, 
  EnrichmentAnswers,
  GeneratedContent 
} from "../utils/enrich/MockAIGenerator";
import { EditableCardData } from "./EditableCard";

interface AIEnrichmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeId: string;
  nodeType: NodeType;
  nodeLabel: string;
  currentSummary?: string;
  onAddContent: (
    textCards: EditableCardData[],
    todoCards: EditableCardData[],
    tags: string[],
    enhancedSummary: string
  ) => void;
}

export function AIEnrichmentModal({
  open,
  onOpenChange,
  nodeId,
  nodeType,
  nodeLabel,
  currentSummary,
  onAddContent,
}: AIEnrichmentModalProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({
    q1: "",
    q2: "",
    q3: "",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [editableContent, setEditableContent] = useState<GeneratedContent | null>(null);
  const firstTextareaRef = useRef<HTMLTextAreaElement>(null);

  const questions = getQuestionsForNodeType(nodeType);

  // Auto-focus first textarea when modal opens
  useEffect(() => {
    if (open && firstTextareaRef.current) {
      setTimeout(() => {
        firstTextareaRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // Keyboard shortcuts within modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const metaKey = isMac ? e.metaKey : e.ctrlKey;

      // Cmd/Ctrl + Enter: Generate or Add to Node
      if (metaKey && e.key === 'Enter') {
        e.preventDefault();
        const allAnswered = questions.every((q) => answers[q.id]?.trim().length > 0);
        if (!generatedContent && allAnswered) {
          handleGenerate();
        } else if (generatedContent) {
          handleAddToNode();
        }
      }

      // Cmd/Ctrl + R: Regenerate
      if (metaKey && e.key === 'r' && generatedContent) {
        e.preventDefault();
        handleRegenerate();
      }
    };

    if (open) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, generatedContent]);

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleGenerate = async () => {
    // Validate that all required questions are answered
    const allAnswered = questions.every((q) => answers[q.id]?.trim().length > 0);
    if (!allAnswered) {
      return;
    }

    setIsGenerating(true);

    // Simulate AI processing delay (200-800ms)
    await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 300));

    const content = aiGenerator.generate(
      nodeType,
      nodeLabel,
      currentSummary,
      answers as unknown as EnrichmentAnswers
    );

    setGeneratedContent(content);
    setEditableContent(JSON.parse(JSON.stringify(content))); // Deep clone for editing
    setIsGenerating(false);
  };

  const handleRegenerate = () => {
    setGeneratedContent(null);
    setEditableContent(null);
    // Keep the answers so user can modify and regenerate
  };

  const handleAddToNode = () => {
    if (!editableContent) return;

    onAddContent(
      editableContent.textCards,
      editableContent.todoCards,
      editableContent.tags,
      editableContent.enhancedSummary
    );

    // Reset state and close modal
    setAnswers({ q1: "", q2: "", q3: "" });
    setGeneratedContent(null);
    setEditableContent(null);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setAnswers({ q1: "", q2: "", q3: "" });
    setGeneratedContent(null);
    setEditableContent(null);
    onOpenChange(false);
  };

  const handleEditSummary = (value: string) => {
    if (!editableContent) return;
    setEditableContent({ ...editableContent, enhancedSummary: value });
  };

  const handleEditTextCard = (index: number, value: string) => {
    if (!editableContent) return;
    const newTextCards = [...editableContent.textCards];
    newTextCards[index] = { ...newTextCards[index], content: value };
    setEditableContent({ ...editableContent, textCards: newTextCards });
  };

  const handleEditTags = (value: string) => {
    if (!editableContent) return;
    // Parse comma-separated tags
    const newTags = value.split(",").map((t) => t.trim()).filter(Boolean);
    setEditableContent({ ...editableContent, tags: newTags });
  };

  const allAnswered = questions.every((q) => answers[q.id]?.trim().length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0 bg-white flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl">Enrich with AI</DialogTitle>
              <DialogDescription className="text-sm text-gray-500 mt-1">
                {nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} Node: {nodeLabel}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 min-h-0">
          <AnimatePresence mode="wait">
            {!generatedContent ? (
              <motion.div
                key="questions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6 pb-6"
              >
                {currentSummary && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-sm text-gray-500 mb-1">Current Summary:</div>
                    <div className="text-sm text-gray-700">{currentSummary}</div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="h-px flex-1 bg-gray-200" />
                    <span>Answer these questions</span>
                    <div className="h-px flex-1 bg-gray-200" />
                  </div>

                  {questions.map((question, index) => (
                    <div key={question.id} className="space-y-2">
                      <Label htmlFor={question.id} className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
                          {index + 1}
                        </span>
                        {question.label}
                        {question.optional && (
                          <Badge variant="outline" className="text-xs">
                            Optional
                          </Badge>
                        )}
                      </Label>
                      <Textarea
                        ref={index === 0 ? firstTextareaRef : undefined}
                        id={question.id}
                        placeholder={question.placeholder || "Type your answer..."}
                        value={answers[question.id] || ""}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        className="min-h-[100px] resize-none"
                      />
                      <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
                        <span>
                          {(answers[question.id] || "").length} characters
                          {(answers[question.id] || "").length < 20 && (
                            <span className="text-amber-500 ml-2">• Add more detail for better results</span>
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 p-3 rounded-lg">
                    <Sparkles className="w-4 h-4" />
                    <span>
                      AI will generate detailed text cards, actionable todos, relevant tags, and an enhanced summary based on your answers.
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 text-center">
                    💡 Tip: Press <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-700">Cmd/Ctrl + Enter</kbd> to generate
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6 pb-6"
              >
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Content generated! Review and edit before adding to your node.</span>
                </div>

                {/* Enhanced Summary */}
                {editableContent && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      <Label className="text-sm font-medium">Enhanced Summary</Label>
                    </div>
                    <Textarea
                      value={editableContent.enhancedSummary}
                      onChange={(e) => handleEditSummary(e.target.value)}
                      className="min-h-[60px] resize-none"
                    />
                  </div>
                )}

                <Separator />

                {/* Text Cards */}
                {editableContent && editableContent.textCards.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <Label className="text-sm font-medium">
                        Text Cards ({editableContent.textCards.length})
                      </Label>
                    </div>
                    <div className="space-y-3">
                      {editableContent.textCards.map((card, index) => (
                        <div key={card.id} className="space-y-2">
                          <div className="text-xs text-gray-500">Card {index + 1}</div>
                          <Textarea
                            value={card.content}
                            onChange={(e) => handleEditTextCard(index, e.target.value)}
                            className="min-h-[120px] resize-none font-mono text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Todo List */}
                {editableContent && editableContent.todoCards.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <ListTodo className="w-4 h-4 text-purple-600" />
                      <Label className="text-sm font-medium">
                        Todo Lists ({editableContent.todoCards.length})
                      </Label>
                    </div>
                    {editableContent.todoCards.map((card, cardIndex) => (
                      <div key={card.id} className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="space-y-2">
                          {card.todos?.map((todo, index) => (
                            <div key={todo.id} className="flex items-start gap-2 text-sm">
                              <span className="text-purple-600 mt-0.5">□</span>
                              <span className="flex-1">{todo.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Separator />

                {/* Tags */}
                {editableContent && editableContent.tags.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <TagIcon className="w-4 h-4 text-green-600" />
                      <Label className="text-sm font-medium">Tags</Label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {editableContent.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Textarea
                      value={editableContent.tags.join(", ")}
                      onChange={(e) => handleEditTags(e.target.value)}
                      placeholder="Edit tags (comma-separated)"
                      className="min-h-[60px] resize-none text-sm"
                    />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollArea>

        <div className="px-6 py-4 border-t bg-white flex items-center justify-between gap-3 shrink-0">
          {!generatedContent ? (
            <>
              <Button variant="ghost" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={!allAnswered || isGenerating}
                className="gap-2"
              >
                {isGenerating ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-4 h-4" />
                    </motion.div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Content
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="flex-1 text-xs text-gray-400 text-center">
                💡 <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-700">Cmd/Ctrl + R</kbd> to regenerate • <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-700">Cmd/Ctrl + Enter</kbd> to add
              </div>
              <Button variant="outline" onClick={handleRegenerate} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Regenerate
              </Button>
              <Button onClick={handleAddToNode} className="gap-2">
                <Plus className="w-4 h-4" />
                Add to Node
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
