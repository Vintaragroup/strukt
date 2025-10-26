import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { Bold, Italic, List, Link2, Code, ListOrdered } from "lucide-react";
import { EditableCardData, TodoItem } from "./EditableCard";

interface DetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  card: EditableCardData | null;
  onUpdate: (data: EditableCardData) => void;
  color?: string;
}

export function DetailPanel({ isOpen, onClose, card, onUpdate, color = "teal" }: DetailPanelProps) {
  if (!card) return null;

  const colorClasses = {
    teal: "border-teal-400 bg-teal-50/50",
    purple: "border-purple-400 bg-purple-50/50",
    blue: "border-blue-400 bg-blue-50/50",
    pink: "border-pink-400 bg-pink-50/50",
  }[color] || "border-teal-400 bg-teal-50/50";

  const handleTodoToggle = (todoId: string) => {
    if (card.todos) {
      const updatedTodos = card.todos.map(todo =>
        todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
      );
      onUpdate({ ...card, todos: updatedTodos });
    }
  };

  const handleTodoTextChange = (todoId: string, text: string) => {
    if (card.todos) {
      const updatedTodos = card.todos.map(todo =>
        todo.id === todoId ? { ...todo, text } : todo
      );
      onUpdate({ ...card, todos: updatedTodos });
    }
  };

  const handleAddTodo = () => {
    const newTodo: TodoItem = {
      id: `todo-${Date.now()}`,
      text: "",
      completed: false,
    };
    onUpdate({ 
      ...card, 
      todos: [...(card.todos || []), newTodo] 
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] p-0 bg-gray-50">
        <div className="flex flex-col max-h-[80vh]">
          {/* Header */}
          <DialogHeader className={`p-4 border-l-4 ${colorClasses}`}>
            <DialogTitle className="flex items-center gap-2">
              <Input
                value={card.title}
                onChange={(e) => onUpdate({ ...card, title: e.target.value })}
                className="border-0 p-0 text-lg bg-transparent focus-visible:ring-0 text-gray-900"
              />
            </DialogTitle>
            <DialogDescription>
              Edit card details and content
            </DialogDescription>
          </DialogHeader>

          {/* Toolbar */}
          <div className="px-4 py-2 border-b bg-white flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Bold className="w-4 h-4 text-gray-600" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Italic className="w-4 h-4 text-gray-600" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Code className="w-4 h-4 text-gray-600" />
            </Button>
            <div className="w-px h-5 bg-gray-300" />
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <List className="w-4 h-4 text-gray-600" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ListOrdered className="w-4 h-4 text-gray-600" />
            </Button>
            <div className="w-px h-5 bg-gray-300" />
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Link2 className="w-4 h-4 text-gray-600" />
            </Button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className={`p-4 rounded-lg border-2 ${colorClasses}`}>
              {card.type === "text" ? (
                <Textarea
                  value={card.content || ""}
                  onChange={(e) => onUpdate({ ...card, content: e.target.value })}
                  className="min-h-[300px] resize-none border-0 p-0 bg-transparent focus-visible:ring-0"
                  placeholder="Start typing..."
                />
              ) : (
                <div className="space-y-3">
                  {card.todos?.map((todo) => (
                    <div key={todo.id} className="flex items-start gap-3">
                      <Checkbox
                        checked={todo.completed}
                        onCheckedChange={() => handleTodoToggle(todo.id)}
                        className="mt-1"
                      />
                      <Input
                        value={todo.text}
                        onChange={(e) => handleTodoTextChange(todo.id, e.target.value)}
                        className={`flex-1 border-0 p-0 bg-transparent focus-visible:ring-0 ${
                          todo.completed ? "line-through text-gray-400" : "text-gray-700"
                        }`}
                        placeholder="Todo item..."
                      />
                    </div>
                  ))}
                  <button
                    onClick={handleAddTodo}
                    className="w-full text-left text-sm text-gray-400 hover:text-gray-600 py-2"
                  >
                    + Add item
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
