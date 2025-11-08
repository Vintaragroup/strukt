import { useState } from "react";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import {
  Maximize2,
  GripVertical,
  MoreHorizontal,
  Trash2,
  Sparkles,
  Loader2,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";

export type CardType =
  | "text"
  | "todo"
  | "markdown"
  | "checklist"
  | "brief"
  | "spec";

export interface CardSection {
  id: string;
  title: string;
  body: string;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface EditableCardData {
  id: string;
  title: string;
  type: CardType;
  content?: string;
  todos?: TodoItem[];
  sections?: CardSection[];
  metadata?: {
    templateId?: string;
    templateName?: string;
    generatedAt?: string;
    generatedBy?: "ai" | "template" | "user";
    tags?: string[];
    suggestedPrdTemplates?: string[];
    reason?: string;
    description?: string;
    prdTemplateId?: string;
    warnings?: string[];
    accuracy?: {
      score: number;
      status: "fresh" | "fallback" | "stale";
      factors?: string[];
      lastGeneratedAt?: string;
      qualityConfidence?: number;
      needsReview?: boolean;
    };
  };
}

interface EditableCardProps {
  data: EditableCardData;
  onUpdate: (data: EditableCardData) => void;
  onDelete: () => void;
  onExpand: () => void;
  color?: string;
  onEditingChange?: (isEditing: boolean) => void;
  onGenerateContent?: () => void;
  isGenerating?: boolean;
}

export function EditableCard({
  data,
  onUpdate,
  onDelete,
  onExpand,
  color = "teal",
  onEditingChange,
  onGenerateContent,
  isGenerating,
  }: EditableCardProps) {
  const [showToolbar, setShowToolbar] = useState(false);

  const handleEditingChange = (editing: boolean) => {
    onEditingChange?.(editing && data.type === "text");
  };  const colorClasses = {
    teal: "border-teal-300 bg-teal-50/50 focus-within:border-teal-400",
    purple: "border-purple-300 bg-purple-50/50 focus-within:border-purple-400",
    blue: "border-blue-300 bg-blue-50/50 focus-within:border-blue-400",
    pink: "border-pink-300 bg-pink-50/50 focus-within:border-pink-400",
  }[color] || "border-teal-300 bg-teal-50/50 focus-within:border-teal-400";

  const handleTodoToggle = (todoId: string) => {
    if (data.todos) {
      const updatedTodos = data.todos.map(todo =>
        todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
      );
      onUpdate({ ...data, todos: updatedTodos });
    }
  };

  const handleTodoTextChange = (todoId: string, text: string) => {
    if (data.todos) {
      const updatedTodos = data.todos.map(todo =>
        todo.id === todoId ? { ...todo, text } : todo
      );
      onUpdate({ ...data, todos: updatedTodos });
    }
  };

  const handleAddTodo = () => {
    const newTodo: TodoItem = {
      id: `todo-${Date.now()}`,
      text: "",
      completed: false,
    };
    onUpdate({ 
      ...data, 
      todos: [...(data.todos || []), newTodo] 
    });
  };

  const handleSectionTitleChange = (sectionId: string, title: string) => {
    const updatedSections = (data.sections || []).map((section) =>
      section.id === sectionId ? { ...section, title } : section
    );
    onUpdate({ ...data, sections: updatedSections });
  };

  const handleSectionBodyChange = (sectionId: string, body: string) => {
    const updatedSections = (data.sections || []).map((section) =>
      section.id === sectionId ? { ...section, body } : section
    );
    onUpdate({ ...data, sections: updatedSections });
  };

  const handleAddSection = () => {
    const newSection: CardSection = {
      id: `section-${Date.now()}`,
      title: `Section ${(data.sections?.length || 0) + 1}`,
      body: "",
    };
    onUpdate({ ...data, sections: [...(data.sections || []), newSection] });
  };

  return (
    <div
      className={`rounded-xl border-2 ${colorClasses} transition-all group relative`}
      onMouseEnter={() => setShowToolbar(true)}
      onMouseLeave={() => setShowToolbar(false)}
    >
      {/* Header */}
      <div className="flex items-start gap-2 px-3 py-2 border-b border-current/10">
        <GripVertical className="w-3.5 h-3.5 text-gray-400 cursor-move mt-1" />
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={data.title}
            onChange={(e) => onUpdate({ ...data, title: e.target.value })}
            className="w-full bg-transparent border-none outline-none text-sm text-gray-900 placeholder:text-gray-400"
            placeholder="Card title..."
          />
          {(data.metadata?.accuracy || onGenerateContent) && (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {data.metadata?.accuracy && (
                <span
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${
                    data.metadata.accuracy.status === "fallback"
                      ? "bg-amber-100 text-amber-700"
                      : data.metadata.accuracy.status === "stale"
                      ? "bg-slate-200 text-slate-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                  title={
                    data.metadata.accuracy.factors
                      ? data.metadata.accuracy.factors.join(" • ")
                      : undefined
                  }
                >
                  {data.metadata.accuracy.score}% accuracy
                  {data.metadata.accuracy.status === "stale" ? " (refresh suggested)" : ""}
                </span>
              )}
              {onGenerateContent &&
                data.metadata?.templateId &&
                (data.type === "markdown" || data.type === "brief" || data.type === "spec") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onGenerateContent}
                    disabled={isGenerating}
                    className="h-7 px-2 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span className="ml-1.5">Generate</span>
                  </Button>
                )}
            </div>
          )}
        </div>
        
        {showToolbar && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onExpand}
              className="h-6 w-6 text-gray-500 hover:text-gray-700"
              title="Expand"
            >
              <Maximize2 className="w-3 h-3" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-gray-500 hover:text-gray-700"
                >
                  <MoreHorizontal className="w-3 h-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-40 p-1" align="end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  Delete
                </Button>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* Formatting Toolbar - Now shown as floating toolbar when editing */}

      {/* Content */}
      <div className="p-3">
        {data.type === "todo" || data.type === "checklist" ? (
          <div className="space-y-2">
            {data.todos?.map((todo) => (
              <div key={todo.id} className="flex items-start gap-2 group/todo">
                <Checkbox
                  checked={todo.completed}
                  onCheckedChange={() => handleTodoToggle(todo.id)}
                  className="mt-0.5"
                />
                <input
                  type="text"
                  value={todo.text}
                  onChange={(e) => handleTodoTextChange(todo.id, e.target.value)}
                  className={`flex-1 bg-transparent border-none outline-none text-sm ${
                    todo.completed ? "line-through text-gray-400" : "text-gray-700"
                  } placeholder:text-gray-400`}
                  placeholder="Todo item..."
                />
              </div>
            ))}
            <button
              onClick={handleAddTodo}
              className="w-full text-left text-sm text-gray-400 hover:text-gray-600 py-1"
            >
              + Add item
            </button>
          </div>
        ) : data.sections && data.sections.length > 0 ? (
          <div className="space-y-3">
            {data.sections.map((section) => (
              <div key={section.id} className="space-y-1.5">
                <input
                  type="text"
                  value={section.title}
                  onChange={(e) => handleSectionTitleChange(section.id, e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-sm font-semibold text-gray-800 placeholder:text-gray-400"
                  placeholder="Section title"
                />
                <textarea
                  value={section.body}
                  onChange={(e) => handleSectionBodyChange(section.id, e.target.value)}
                  onFocus={() => handleEditingChange(true)}
                  onBlur={() => handleEditingChange(false)}
                  className="w-full min-h-[80px] bg-transparent border-none outline-none text-sm text-gray-700 resize-none placeholder:text-gray-400"
                  placeholder="Add details..."
                />
              </div>
            ))}
            <button
              onClick={handleAddSection}
              className="w-full text-left text-sm text-gray-400 hover:text-gray-600 py-1"
            >
              + Add section
            </button>
          </div>
        ) : (
          <textarea
            value={data.content || ""}
            onChange={(e) => onUpdate({ ...data, content: e.target.value })}
            onFocus={() => handleEditingChange(true)}
            onBlur={() => handleEditingChange(false)}
            className="w-full min-h-[80px] bg-transparent border-none outline-none text-sm text-gray-700 resize-none placeholder:text-gray-400"
            placeholder="Start typing..."
          />
        )}
      </div>
    </div>
  );
}
