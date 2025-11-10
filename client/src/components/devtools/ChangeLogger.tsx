// @ts-nocheck
import React from 'react';

/**
 * ChangeLogger panel: simple indicator that the logger is active.
 * The noisy logging is implemented in changeLoggerUtils.ts and gated from App.
 */
export function ChangeLoggerPanel() {
  return (
    <div className="fixed left-4 bottom-[84px] z-50 rounded-md bg-indigo-600 text-white px-3 py-1.5 shadow">
      <div className="text-[11px] font-semibold">Change logger active</div>
    </div>
  );
}

export default ChangeLoggerPanel;
