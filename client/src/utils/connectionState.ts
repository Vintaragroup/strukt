// simple module-scoped store for current connection start info
export type ConnectStartInfo = { nodeId: string | null; handleId?: string | null } | null;

let current: ConnectStartInfo = null;

export function setConnectStart(info: ConnectStartInfo) {
  current = info;
}

export function getConnectStart(): ConnectStartInfo {
  return current;
}
