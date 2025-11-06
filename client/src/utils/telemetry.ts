// Lightweight, anonymous telemetry for the client. Best-effort and non-blocking.
// Usage: track("event_name", { optional: "props" })

type TelemetryPayload = {
  event: string;
  props?: Record<string, any>;
  anonId: string;
  ts: string;
  app: string;
  version?: string;
};

const STORAGE_KEY_ID = "telemetry_anon_id";
const STORAGE_KEY_OPT_OUT = "telemetry_opt_out";

function genId() {
  // Simple random id (16 hex chars)
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

let anonId = "";
try {
  anonId = localStorage.getItem(STORAGE_KEY_ID) || "";
  if (!anonId) {
    anonId = genId();
    localStorage.setItem(STORAGE_KEY_ID, anonId);
  }
} catch {
  // localStorage may be unavailable; fall back to ephemeral id
  anonId = genId();
}

export function getAnonId() {
  return anonId;
}

export function isOptedOut() {
  try {
    return localStorage.getItem(STORAGE_KEY_OPT_OUT) === "1";
  } catch {
    return false;
  }
}

export function setOptOut(optOut: boolean) {
  try {
    if (optOut) localStorage.setItem(STORAGE_KEY_OPT_OUT, "1");
    else localStorage.removeItem(STORAGE_KEY_OPT_OUT);
  } catch {
    // ignore
  }
}

export function track(event: string, props?: Record<string, any>) {
  try {
    if (isOptedOut()) return;
    const endpoint = (import.meta as any).env?.VITE_TELEMETRY_ENDPOINT as string | undefined;
    const payload: TelemetryPayload = {
      event,
      props,
      anonId,
      ts: new Date().toISOString(),
      app: "strukt-client",
      version: (import.meta as any).env?.VITE_APP_VERSION as string | undefined,
    };

    // If no endpoint is configured, log in dev and return.
    if (!endpoint) {
      if ((import.meta as any).env?.DEV) {
        // eslint-disable-next-line no-console
        console.debug("[telemetry]", payload);
      }
      return;
    }

    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(endpoint, blob);
      return;
    }

    // Fallback to fetch with keepalive for backgrounding safety
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
      // Avoid blocking UI; errors are intentionally ignored
    }).catch(() => {});
  } catch {
    // Swallow errors; telemetry must never break UX
  }
}
