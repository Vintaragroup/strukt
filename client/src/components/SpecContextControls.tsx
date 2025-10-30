import { useCallback, useMemo, useRef, useState, ChangeEvent } from "react";
import { useAISpecSettings } from "@/store/useAISpecSettings";
import { previewSpecSummary, discardSpecSummaries } from "@/services/specIntegrations";

type SpecContextControlsProps = {
  workspaceId: string;
  variant?: "panel" | "dialog";
  className?: string;
};

type SpecType = "openapi" | "postman";

function detectSpecType(doc: unknown): SpecType | null {
  if (!doc || typeof doc !== "object") return null;
  const record = doc as Record<string, unknown>;
  if (typeof record.openapi === "string" || typeof record.swagger === "string") {
    return "openapi";
  }
  if (record.info && Array.isArray((record as any).item)) {
    return "postman";
  }
  return null;
}

export function SpecContextControls({
  workspaceId,
  variant = "panel",
  className,
}: SpecContextControlsProps) {
  const {
    allowSpecContext,
    setAllowSpecContext,
    summary: specSummary,
    promptFragment,
    promptBudgetTokens,
    setPromptBudget,
    estimatedTokens,
    setEstimatedTokens,
    apiIntent,
    setApiIntent,
    setSpecSummary,
    clearSpecSummary,
    lastSummaryTitle,
  } = useAISpecSettings();

  const [specError, setSpecError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const containerClass = useMemo(() => {
    if (variant === "dialog") {
      return "space-y-4";
    }
    return "mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3";
  }, [variant]);

  const handleToggleSpec = useCallback(
    async (value: boolean) => {
      setAllowSpecContext(value);
      setSpecError(null);

      if (!value) {
        clearSpecSummary();
        setApiIntent(undefined);
        setEstimatedTokens(0);
        try {
          await discardSpecSummaries(workspaceId);
        } catch (error) {
          console.warn("Failed to discard spec cache", error);
        }
      }
    },
    [setAllowSpecContext, clearSpecSummary, setApiIntent, setEstimatedTokens, workspaceId],
  );

  const handleSpecFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setSpecError(null);
      const LIMIT_BYTES = 1.5 * 1024 * 1024;
      if (file.size > LIMIT_BYTES) {
        setSpecError("File exceeds 1.5MB. Remove large samples or split the spec.");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      try {
        const text = await file.text();
        let parsed: unknown;
        try {
          parsed = JSON.parse(text);
        } catch {
          setSpecError("Only JSON OpenAPI or Postman specs are supported.");
          return;
        }

        const specType = detectSpecType(parsed);
        if (!specType) {
          setSpecError("Unable to detect spec type. Provide OpenAPI or Postman JSON.");
          return;
        }

        const preview = await previewSpecSummary({
          workspaceId,
          specType,
          spec: parsed,
          maxOperations: 20,
        });

        setSpecSummary({
          referenceId: preview.referenceId,
          summary: preview.summary,
          promptFragment: preview.promptFragment,
        });
        setEstimatedTokens(Math.ceil(preview.promptFragment.length / 4));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to process spec.";
        setSpecError(message);
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [workspaceId, setSpecSummary, setEstimatedTokens],
  );

  const handleClearSpec = useCallback(async () => {
    clearSpecSummary();
    setEstimatedTokens(0);
    setSpecError(null);
    try {
      await discardSpecSummaries(workspaceId);
    } catch (error) {
      console.warn("Failed to discard spec cache", error);
    }
  }, [clearSpecSummary, setEstimatedTokens, workspaceId]);

  return (
    <div className={`${containerClass} ${className ?? ""}`}>
      <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
        <input
          type="checkbox"
          className="h-3.5 w-3.5 accent-emerald-600"
          checked={allowSpecContext}
          onChange={(event) => handleToggleSpec(event.target.checked)}
        />
        Use API spec context
      </label>

      {allowSpecContext && (
        <div className={variant === "panel" ? "mt-3 space-y-3" : "space-y-3"}>
          {specSummary ? (
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <div className="font-semibold text-slate-800">{specSummary.title}</div>
                  <div className="text-[10px] uppercase tracking-wide text-slate-400">
                    {specSummary.specType.toUpperCase()} • {specSummary.operations.length} endpoints
                  </div>
                </div>
                <button
                  type="button"
                  className="text-[10px] font-medium text-slate-400 hover:text-slate-600"
                  onClick={handleClearSpec}
                >
                  Clear
                </button>
              </div>
              <ul className="space-y-1.5">
                {specSummary.operations.slice(0, 3).map((operation) => (
                  <li key={`${operation.method}-${operation.path}`} className="leading-snug">
                    <span className="font-medium text-slate-700">{operation.method}</span>
                    <span className="ml-1 text-slate-500">{operation.path}</span>
                    {operation.summary && (
                      <div className="text-[11px] text-slate-400">{operation.summary}</div>
                    )}
                  </li>
                ))}
                {specSummary.operations.length > 3 && (
                  <li className="text-[11px] text-slate-400">
                    +{specSummary.operations.length - 3} more endpoints captured
                  </li>
                )}
              </ul>
            </div>
          ) : (
            <div className="text-xs text-slate-600">
              <label className="mb-2 block text-[11px] uppercase tracking-wide text-slate-400">
                Attach OpenAPI or Postman JSON
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                onChange={handleSpecFileChange}
                className="w-full text-[11px] text-slate-500 file:mr-3 file:rounded-md file:border file:border-slate-200 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-600 hover:file:bg-slate-50"
              />
              <p className="mt-2 text-[11px] text-slate-400">
                Specs are summarised locally and never stored. Keep files lean by stripping large sample payloads.
              </p>
              {lastSummaryTitle ? (
                <p className="mt-2 text-[11px] text-amber-600">
                  Previous spec "{lastSummaryTitle}" expired. Reattach it to continue using API context.
                </p>
              ) : (
                <p className="mt-2 text-[11px] text-slate-400">
                  No spec attached yet. Upload a Swagger/OpenAPI or Postman file to enable API-aware suggestions.
                </p>
              )}
            </div>
          )}

          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-wide text-slate-400">
              API intent (optional)
            </label>
            <textarea
              value={apiIntent ?? ""}
              onChange={(event) => setApiIntent(event.target.value)}
              rows={variant === "dialog" ? 3 : 2}
              placeholder="e.g., Sync billing with Stripe or Fetch supplier statuses"
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Prompt budget: {promptBudgetTokens} tokens</span>
              <span className={estimatedTokens > promptBudgetTokens ? "font-medium text-red-600" : "text-emerald-600"}>
                Estimated: {estimatedTokens}
              </span>
            </div>
            <input
              type="range"
              min={400}
              max={4000}
              step={100}
              value={promptBudgetTokens}
              onChange={(event) => setPromptBudget(Number(event.target.value))}
              className="mt-1 w-full accent-emerald-600"
            />
          </div>
        </div>
      )}

      {specError && (
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          {specError}
        </div>
      )}
    </div>
  );
}
