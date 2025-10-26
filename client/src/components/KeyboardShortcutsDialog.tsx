import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Keyboard } from "lucide-react";

interface KeyboardShortcutsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsDialog({ isOpen, onClose }: KeyboardShortcutsDialogProps) {
  const shortcuts = [
    {
      category: "Quick Access",
      items: [
        { keys: ["⌘/Ctrl", "K"], description: "Open command palette" },
        { keys: ["⌘/Ctrl", "F"], description: "Search nodes" },
        { keys: ["?"], description: "Show keyboard shortcuts" },
      ],
    },
    {
      category: "Navigation",
      items: [
        { keys: ["⌘/Ctrl", "0"], description: "Fit all nodes in view" },
        { keys: ["⌘/Ctrl", "⇧", "0"], description: "Zoom to selected nodes" },
        { keys: ["F"], description: "Zoom to selected nodes" },
        { keys: ["⌘/Ctrl", "."], description: "Center on main node" },
        { keys: ["Click Minimap"], description: "Navigate on minimap" },
      ],
    },
    {
      category: "History",
      items: [
        { keys: ["⌘/Ctrl", "Z"], description: "Undo" },
        { keys: ["⌘/Ctrl", "⇧", "Z"], description: "Redo" },
        { keys: ["⌘/Ctrl", "Y"], description: "Redo (alternative)" },
        { keys: ["⌘/Ctrl", "⇧", "V"], description: "Open version snapshots" },
      ],
    },
    {
      category: "Selection",
      items: [
        { keys: ["⌘/Ctrl", "A"], description: "Select all nodes" },
        { keys: ["⌘/Ctrl", "⇧", "F"], description: "Select by criteria" },
        { keys: ["Esc"], description: "Deselect all nodes" },
        { keys: ["⇧", "Click"], description: "Multi-select nodes" },
      ],
    },
    {
      category: "Node Actions",
      items: [
        { keys: ["⌘/Ctrl", "N"], description: "Add new node" },
        { keys: ["⌘/Ctrl", "D"], description: "Duplicate selected nodes" },
        { keys: ["⌘/Ctrl", "⇧", "E"], description: "Enrich node with AI (select one node)" },
        { keys: ["Delete"], description: "Delete selected nodes" },
        { keys: ["Right Click"], description: "Open context menu" },
      ],
    },
    {
      category: "Templates & Analysis",
      items: [
        { keys: ["⌘/Ctrl", "⇧", "T"], description: "Open template gallery" },
        { keys: ["⌘/Ctrl", "⇧", "S"], description: "Save as template" },
        { keys: ["⌘/Ctrl", "⇧", "R"], description: "Relationships & dependencies" },
      ],
    },
    {
      category: "Import & Export",
      items: [
        { keys: ["⌘/Ctrl", "I"], description: "Import node from JSON" },
        { keys: ["⌘/Ctrl", "E"], description: "Export selected nodes (batch)" },
      ],
    },
    {
      category: "General",
      items: [
        { keys: ["Space", "Drag"], description: "Pan canvas" },
        { keys: ["Scroll"], description: "Zoom in/out" },
      ],
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-indigo-600" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Master these shortcuts to navigate FlowForge like a pro
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {shortcuts.map((section) => (
            <div key={section.category}>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                {section.category}
              </h3>
              <div className="space-y-2">
                {section.items.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50"
                  >
                    <span className="text-sm text-gray-600">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex} className="flex items-center gap-1">
                          <kbd className="px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded shadow-sm">
                            {key}
                          </kbd>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="text-gray-400 text-xs">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
          <p className="text-sm text-indigo-900">
            <span className="font-semibold">Pro Tip:</span> Press{" "}
            <kbd className="px-2 py-0.5 text-xs bg-white border border-indigo-300 rounded shadow-sm mx-1">
              ⌘/Ctrl
            </kbd>
            {" + "}
            <kbd className="px-2 py-0.5 text-xs bg-white border border-indigo-300 rounded shadow-sm mx-1">
              K
            </kbd>{" "}
            to quickly search and navigate to any node, or press{" "}
            <kbd className="px-2 py-0.5 text-xs bg-white border border-indigo-300 rounded shadow-sm mx-1">
              ?
            </kbd>{" "}
            to view all shortcuts.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
