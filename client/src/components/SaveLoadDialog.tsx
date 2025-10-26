import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import { Save, FolderOpen, FileText, Calendar } from "lucide-react";

interface SaveLoadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  onLoad: (id: string) => void;
}

const mockSavedWorkspaces = [
  {
    id: "1",
    name: "E-commerce Platform",
    date: "2025-10-20",
    nodes: 12,
  },
  {
    id: "2",
    name: "Mobile App Redesign",
    date: "2025-10-18",
    nodes: 8,
  },
  {
    id: "3",
    name: "Backend Architecture",
    date: "2025-10-15",
    nodes: 15,
  },
];

export function SaveLoadDialog({ isOpen, onClose, onSave, onLoad }: SaveLoadDialogProps) {
  const [workspaceName, setWorkspaceName] = useState("");

  const handleSave = () => {
    if (workspaceName.trim()) {
      onSave(workspaceName.trim());
      setWorkspaceName("");
      onClose();
    }
  };

  const handleLoad = (id: string) => {
    onLoad(id);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] backdrop-blur-xl bg-white/95">
        <DialogHeader>
          <DialogTitle>Save & Load</DialogTitle>
          <DialogDescription>
            Save your current workspace or load a previously saved one.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="save" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="save" className="gap-2">
              <Save className="w-4 h-4" />
              Save
            </TabsTrigger>
            <TabsTrigger value="load" className="gap-2">
              <FolderOpen className="w-4 h-4" />
              Load
            </TabsTrigger>
          </TabsList>

          <TabsContent value="save" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workspace-name">Workspace Name</Label>
              <Input
                id="workspace-name"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="Enter workspace name..."
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!workspaceName.trim()} className="gap-2">
                <Save className="w-4 h-4" />
                Save Workspace
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="load">
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {mockSavedWorkspaces.map((workspace) => (
                  <button
                    key={workspace.id}
                    onClick={() => handleLoad(workspace.id)}
                    className="w-full p-4 rounded-2xl border border-gray-200 hover:border-violet-300 hover:bg-violet-50/50 transition-all text-left"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-violet-600" />
                        </div>
                        <div>
                          <h4 className="text-gray-900 mb-1">{workspace.name}</h4>
                          <div className="flex items-center gap-4 text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {workspace.date}
                            </span>
                            <span>{workspace.nodes} nodes</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
