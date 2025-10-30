import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { SpecContextControls } from "./SpecContextControls";
import { FileCode } from "lucide-react";

interface SpecContextDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
}

export function SpecContextDialog({ open, onOpenChange, workspaceId }: SpecContextDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <FileCode className="w-5 h-5 text-emerald-500" />
            API Spec Context
          </DialogTitle>
          <DialogDescription>
            Attach a Swagger/OpenAPI or Postman collection to guide AI suggestions. Specs are summarised
            temporarily and never stored.
          </DialogDescription>
        </DialogHeader>

        <SpecContextControls workspaceId={workspaceId} variant="dialog" />
      </DialogContent>
    </Dialog>
  );
}
