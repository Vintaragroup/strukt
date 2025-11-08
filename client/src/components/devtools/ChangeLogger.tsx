// @ts-nocheck
import React, { useMemo } from 'react';

type NodeChange = any; // Keep loose to avoid version-specific type friction
type OnNodesChange = (changes: NodeChange[]) => void;

/**
 * wrapOnNodesChange: Returns a handler that logs each change then calls the original.
 */
export function wrapOnNodesChange(original: OnNodesChange, opts?: { label?: string }): OnNodesChange {
  const label = opts?.label ?? 'ChangeLogger';
  return (changes: NodeChange[]) => {
    try {
      if (Array.isArray(changes) && changes.length > 0) {
        // Group by type for quicker reading
        const counts: Record<string, number> = {};
        changes.forEach((c: any) => {
          counts[c?.type || 'unknown'] = (counts[c?.type || 'unknown'] || 0) + 1;
          // Detailed line log
          // eslint-disable-next-line no-console
          console.log(`[${label}]`, c);
        });
        // eslint-disable-next-line no-console
        console.info(`[${label}] batch`, counts);
      } else {
        // eslint-disable-next-line no-console
        console.info(`[${label}] no changes`);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(`[${label}] log error`, e);
    } finally {
      try { original(changes); } catch {}
    }
  };
}

/**
 * ChangeLogger panel: simple indicator that the logger is active.
 * Use wrapOnNodesChange(...) in App to actually wrap the handler.
 */
export function ChangeLoggerPanel() {
  return (
    <div className="fixed left-4 bottom-[84px] z-50 rounded-md bg-indigo-600 text-white px-3 py-1.5 shadow">
      <div className="text-[11px] font-semibold">Change logger active</div>
    </div>
  );
}

export default ChangeLoggerPanel;
