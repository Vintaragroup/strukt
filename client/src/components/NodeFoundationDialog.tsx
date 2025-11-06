import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Badge } from "./ui/badge";
import { cn } from "./ui/utils";

export type NodeFoundationKind = "auth" | "frontend" | "backend" | "data" | "onboarding";

export interface NodeFoundationConfigAuth {
  provider: "auth0" | "supabase" | "keycloak" | "cognito";
  mfa: boolean;
  rolesModel: "roles" | "groups" | "both";
}

type NodeFoundationConfig = NodeFoundationConfigAuth; // extend later for other kinds

export function NodeFoundationDialog({
  open,
  onOpenChange,
  kind,
  nodeLabel,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: NodeFoundationKind;
  nodeLabel: string;
  onApply: (config: NodeFoundationConfig) => void;
}) {
  // Only 'auth' implemented for now
  const [provider, setProvider] = useState<NodeFoundationConfigAuth["provider"]>("auth0");
  const [mfa, setMfa] = useState<boolean>(true);
  const [rolesModel, setRolesModel] = useState<NodeFoundationConfigAuth["rolesModel"]>("roles");

  const canApply = kind === "auth";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="text-base">Auto‑create for {nodeLabel}</DialogTitle>
          <DialogDescription className="text-xs">
            Answer a couple questions and we’ll scaffold requirements and supporting nodes for this {kind}.
          </DialogDescription>
        </DialogHeader>

        {kind === "auth" ? (
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-700">Choose your identity provider</p>
              <div className="flex flex-wrap gap-2">
                {([
                  { id: "auth0", label: "Auth0" },
                  { id: "supabase", label: "Supabase" },
                  { id: "keycloak", label: "Keycloak" },
                  { id: "cognito", label: "AWS Cognito" },
                ] as const).map((opt) => (
                  <Button
                    key={opt.id}
                    type="button"
                    variant={provider === opt.id ? "default" : "outline"}
                    className={cn("h-8 text-xs", provider === opt.id ? "bg-indigo-600" : "")}
                    onClick={() => setProvider(opt.id)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-700">Policies</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Switch checked={mfa} onCheckedChange={setMfa} />
                  <span className="text-xs text-slate-600">Require MFA</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-700">Access control model</p>
              <div className="flex flex-wrap gap-2">
                {([
                  { id: "roles", label: "Roles" },
                  { id: "groups", label: "Groups" },
                  { id: "both", label: "Both" },
                ] as const).map((opt) => (
                  <Button
                    key={opt.id}
                    type="button"
                    variant={rolesModel === opt.id ? "default" : "outline"}
                    className={cn("h-8 text-xs", rolesModel === opt.id ? "bg-indigo-600" : "")}
                    onClick={() => setRolesModel(opt.id)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-[10px]">Will create requirements and supporting services</Badge>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button
                  type="button"
                  disabled={!canApply}
                  onClick={() => onApply({ provider, mfa, rolesModel })}
                >
                  Create
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-600">This template is coming soon.</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
