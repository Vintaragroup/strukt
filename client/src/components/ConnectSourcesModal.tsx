import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { GitBranch, BookOpen, ExternalLink } from "lucide-react";

interface ConnectSourcesModalProps {
  open: boolean;
  onClose: () => void;
  onConnectGit: () => void;
  onConnectWiki: () => void;
}

export function ConnectSourcesModal({ open, onClose, onConnectGit, onConnectWiki }: ConnectSourcesModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px] bg-white max-h-[calc(100vh-4rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-indigo-600" />
            Connect Your Knowledge Sources
          </DialogTitle>
          <DialogDescription>
            Link a Git repository or a documentation wiki to let Strukt evaluate your architecture automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
            <h4 className="text-sm font-medium text-indigo-900 mb-1">Why connect a source?</h4>
            <p className="text-sm text-indigo-800">
              Pull in realtime project context so we can map requirements, detect gaps, and generate architecture insights based on live documentation.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              className="w-full justify-between bg-indigo-600 hover:bg-indigo-700"
              onClick={onConnectGit}
            >
              <span className="flex items-center gap-2">
                <GitBranch className="w-5 h-5" />
                Connect Git Repository
              </span>
              <ExternalLink className="w-4 h-4 opacity-80" />
            </Button>
            <p className="text-xs text-gray-600 pl-1">
              Sync pull requests, code owners, and architectural decisions from your source control provider.
            </p>

            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={onConnectWiki}
            >
              <span className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Connect Wiki or Knowledge Base
              </span>
              <ExternalLink className="w-4 h-4 opacity-80" />
            </Button>
            <p className="text-xs text-gray-600 pl-1">
              Import requirements, SOPs, and specs from Confluence, Notion, or any markdown knowledge source.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
