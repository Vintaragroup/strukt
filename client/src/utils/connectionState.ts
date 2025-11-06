// simple module-scoped store for current connection start info
export type ConnectStartInfo = { nodeId: string | null; handleId?: string | null } | null;

let current: ConnectStartInfo = null;
let shiftPressed = false;
let hoveredHandleEl: HTMLElement | null = null;

export function setConnectStart(info: ConnectStartInfo) {
  current = info;
}

export function getConnectStart(): ConnectStartInfo {
  return current;
}

export function setShiftPressed(pressed: boolean) {
  shiftPressed = !!pressed;
}

export function isShiftPressed(): boolean {
  return shiftPressed;
}

// Manage a single highlighted target handle element for hover/snap feedback
export function setHoveredTargetHandle(el: HTMLElement | null) {
  try {
    if (hoveredHandleEl && hoveredHandleEl !== el) {
      // clear previous styles
      hoveredHandleEl.style.outline = '';
      hoveredHandleEl.style.outlineOffset = '';
      hoveredHandleEl.style.boxShadow = '';
      hoveredHandleEl.style.transform = '';
      hoveredHandleEl.style.transition = '';
    }
    hoveredHandleEl = el;
    if (hoveredHandleEl) {
      hoveredHandleEl.style.transition = 'box-shadow 120ms ease, transform 120ms ease';
      hoveredHandleEl.style.boxShadow = '0 0 0 3px rgba(34,211,238,0.8)'; // cyan ring
      hoveredHandleEl.style.transform = 'scale(1.1)';
      hoveredHandleEl.style.outline = 'none';
      hoveredHandleEl.style.outlineOffset = '0px';
    }
  } catch {
    // no-op
  }
}

export function clearHoveredTargetHandle() {
  try {
    if (hoveredHandleEl) {
      hoveredHandleEl.style.outline = '';
      hoveredHandleEl.style.outlineOffset = '';
      hoveredHandleEl.style.boxShadow = '';
      hoveredHandleEl.style.transform = '';
      hoveredHandleEl.style.transition = '';
    }
  } finally {
    hoveredHandleEl = null;
  }
}

export function getHoveredTargetHandle(): HTMLElement | null {
  return hoveredHandleEl;
}
