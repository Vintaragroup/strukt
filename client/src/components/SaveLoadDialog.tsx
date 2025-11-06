import { useEffect, useMemo, useState } from "react";
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
import { Save, FolderOpen, FileText, Calendar, CheckCircle } from "lucide-react";
import type { Workspace } from "@/types";

interface SaveLoadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<void> | void;
  onLoad: (workspace: Workspace) => Promise<void> | void;
  workspaces: Workspace[];
  activeWorkspaceId?: string;
  initialName?: string;
}
export function SaveLoadDialog({
  isOpen,
  onClose,
  onSave,
  onLoad,
  workspaces,
  activeWorkspaceId,
  initialName,
}: SaveLoadDialogProps) {
  const [workspaceName, setWorkspaceName] = useState(initialName ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingId, setIsLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setWorkspaceName(initialName ?? "");
      setIsSaving(false);
      setIsLoadingId(null);
    }
  }, [isOpen, initialName]);

  const sortedWorkspaces = useMemo(() => {
    return [...(workspaces ?? [])].sort((a, b) => {
      const aTime = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
      const bTime = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
      return bTime - aTime;
    });
  }, [workspaces]);

  const formatDate = (value?: string) => {
    if (!value) return "Unknown";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Unknown";
    return date.toLocaleDateString();
  };

  const handleSave = async () => {
    const trimmed = workspaceName.trim();
    if (!trimmed) return;
    try {
      setIsSaving(true);
      await onSave(trimmed);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoad = async (workspace: Workspace) => {
    try {
      setIsLoadingId(workspace._id ?? workspace.name);
      await onLoad(workspace);
      onClose();
    } catch (error) {
      // Error handling delegated to parent callback; swallow to keep dialog open
    } finally {
      setIsLoadingId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-white">
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
              <Button
                onClick={handleSave}
                disabled={!workspaceName.trim() || isSaving}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Saving…" : "Save Workspace"}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="load">
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {sortedWorkspaces.length === 0 && (
                  <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                    No saved workspaces yet.
                  </div>
                )}

                {sortedWorkspaces.map((workspace) => {
                  const workspaceKey = workspace._id ?? workspace.name;
                  const isActive = activeWorkspaceId && workspace._id === activeWorkspaceId;
                  const isLoading = isLoadingId === workspaceKey;
                  return (
                    <div
                      key={workspaceKey}
                      className={`w-full p-4 rounded-2xl border transition-all ${
                        isActive
                          ? "border-violet-400 bg-violet-50"
                          : "border-gray-200 hover:border-violet-300 hover:bg-violet-50/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-violet-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-gray-900 mb-1">{workspace.name}</h4>
                              {isActive && <CheckCircle className="w-4 h-4 text-violet-600" />}
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-gray-500 text-sm">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(workspace.updatedAt ?? workspace.createdAt)}
                              </span>
                              <span>{workspace.nodes?.length ?? 0} nodes</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant={isActive ? "outline" : "secondary"}
                          size="sm"
                          onClick={() => handleLoad(workspace)}
                          disabled={isLoading}
                          className="shrink-0"
                        >
                          {isLoading ? "Loading…" : isActive ? "Reload" : "Load"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
