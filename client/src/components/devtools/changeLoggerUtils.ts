// @ts-nocheck
// Utility: debounced node change logging extracted from prior ChangeLogger implementation.
// Gated by ?changeLogs=1 and optional verbose ?changeLogsVerbose=1

export type NodeChange = any;
export type OnNodesChange = (changes: NodeChange[]) => void;

const batchBuffers: Record<string, any[]> = {};
const batchTimers: Record<string, number | NodeJS.Timeout | undefined> = {};

function scheduleBatchLog(label: string, verbose: boolean) {
  const delay = 75;
  if (batchTimers[label]) return;
  batchTimers[label] = setTimeout(() => {
    const buffer = batchBuffers[label] || [];
    delete batchTimers[label];
    batchBuffers[label] = [];
    if (!buffer.length) return;
    const counts: Record<string, number> = {};
    buffer.forEach((c: any) => {
      counts[c?.type || 'unknown'] = (counts[c?.type || 'unknown'] || 0) + 1;
    });
    console.info(`[NodesChange] batch`, counts);
    if (verbose) {
      buffer.forEach((c) => console.log('[NodesChange]', c));
    }
  }, delay) as any;
}

export function wrapOnNodesChange(original: OnNodesChange, opts?: { label?: string }): OnNodesChange {
  const label = opts?.label ?? 'NodesChange';
  const verboseFlag = (() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('changeLogsVerbose') === '1';
      const env = (import.meta as any)?.env?.VITE_CHANGE_LOGGER_VERBOSE === 'on';
      return q || env;
    } catch {
      return false;
    }
  })();
  return (changes: NodeChange[]) => {
    try {
      try { original(changes); } catch (err) {
        console.warn(`[${label}] original handler error`, err);
      }
      if (Array.isArray(changes) && changes.length) {
        batchBuffers[label] ||= [];
        batchBuffers[label].push(...changes);
        scheduleBatchLog(label, verboseFlag);
      }
    } catch (e) {
      console.warn(`[${label}] log error`, e);
    }
  };
}
