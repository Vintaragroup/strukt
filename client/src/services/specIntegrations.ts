import type { SpecSummary } from "@/types/ai";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

const jsonHeaders = { "Content-Type": "application/json" };

export async function previewSpecSummary(params: {
  workspaceId: string;
  specType: "openapi" | "postman";
  spec: unknown;
  maxOperations?: number;
}): Promise<{ referenceId: string; summary: SpecSummary; promptFragment: string; expiresInSeconds: number }> {
  const response = await fetch(`${API_BASE}/integrations/spec/preview`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({
      workspaceId: params.workspaceId,
      specType: params.specType,
      spec: params.spec,
      maxOperations: params.maxOperations,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || "Failed to preview spec");
  }

  return response.json();
}

export async function discardSpecSummaries(workspaceId: string): Promise<void> {
  await fetch(`${API_BASE}/integrations/spec/discard`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ workspaceId }),
  });
}

export async function fetchSpecSummary(referenceId: string): Promise<{ referenceId: string; summary: SpecSummary; promptFragment: string }> {
  const response = await fetch(`${API_BASE}/integrations/spec/${referenceId}`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || "Failed to load spec summary");
  }
  return response.json();
}
