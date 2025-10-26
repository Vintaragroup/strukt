import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";
import { User, Bell, Palette, Lock, HelpCircle, RotateCcw, GitBranch, Network } from "lucide-react";

interface UserSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onShowTutorial?: () => void;
  onResetDemo?: () => void;
  onOpenSnapshots?: () => void;
  onOpenRelationships?: () => void;
}

export function UserSettingsDialog({ isOpen, onClose, onShowTutorial, onResetDemo, onOpenSnapshots, onOpenRelationships }: UserSettingsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] backdrop-blur-xl bg-white/95">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your profile, notifications, appearance, and security settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Profile Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-gray-700">
              <User className="w-4 h-4" />
              <h3>Profile</h3>
            </div>
            <div className="space-y-3 pl-6">
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input id="name" defaultValue="John Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="john@example.com" />
              </div>
            </div>
          </div>

          <Separator />

          {/* Notifications Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-gray-700">
              <Bell className="w-4 h-4" />
              <h3>Notifications</h3>
            </div>
            <div className="space-y-3 pl-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications">Enable notifications</Label>
                <Switch id="notifications" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="autosave">Auto-save changes</Label>
                <Switch id="autosave" defaultChecked />
              </div>
            </div>
          </div>

          <Separator />

          {/* Appearance Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-gray-700">
              <Palette className="w-4 h-4" />
              <h3>Appearance</h3>
            </div>
            <div className="space-y-3 pl-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="grid">Show grid</Label>
                <Switch id="grid" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="minimap">Show minimap</Label>
                <Switch id="minimap" defaultChecked />
              </div>
            </div>
          </div>

          <Separator />

          {/* Help Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-gray-700">
              <HelpCircle className="w-4 h-4" />
              <h3>Help & Support</h3>
            </div>
            <div className="space-y-3 pl-6">
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={() => {
                  onShowTutorial?.();
                  onClose();
                }}
              >
                <HelpCircle className="w-4 h-4" />
                Show Tutorial Again
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2 text-indigo-600 border-indigo-300 hover:bg-indigo-50"
                onClick={() => {
                  onOpenSnapshots?.();
                  onClose();
                }}
              >
                <GitBranch className="w-4 h-4" />
                Version Snapshots
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2 text-purple-600 border-purple-300 hover:bg-purple-50"
                onClick={() => {
                  onOpenRelationships?.();
                  onClose();
                }}
              >
                <Network className="w-4 h-4" />
                Relationships & Dependencies
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2 text-orange-600 border-orange-300 hover:bg-orange-50"
                onClick={() => {
                  onResetDemo?.();
                  onClose();
                }}
              >
                <RotateCcw className="w-4 h-4" />
                Reset to Empty Canvas (Demo)
              </Button>
            </div>
          </div>

          <Separator />

          {/* Security Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-gray-700">
              <Lock className="w-4 h-4" />
              <h3>Security</h3>
            </div>
            <div className="space-y-3 pl-6">
              <Button variant="outline" className="w-full">
                Change Password
              </Button>
              <Button variant="outline" className="w-full">
                Two-Factor Authentication
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onClose}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
