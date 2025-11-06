import { PLATFORM_HEADERS, DELIMS, type Target } from "../platforms";

export function buildPrompt(opts: {
  target: Target;
  workspaceMarkdown: string;
  userAsk: string;
}): string {
  const header = PLATFORM_HEADERS[opts.target];
  return [
    `${DELIMS.sysOpen}\n${header}\n${DELIMS.sysClose}`,
    `${DELIMS.ctxOpen}\n${opts.workspaceMarkdown}\n${DELIMS.ctxClose}`,
    `${DELIMS.askOpen}\n${opts.userAsk}\n${DELIMS.askClose}`,
  ].join("\n\n");
}
