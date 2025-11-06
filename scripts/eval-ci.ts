import { runEval } from "../client/src/eval/runEval";

async function readRaw(path: string) {
  const fs = await import("fs/promises");
  return fs.readFile(path, "utf8");
}

async function discoverBundles() {
  const fs = await import("fs/promises");
  const dir = "./eval/bundles";
  const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".md"));
  const bundles = [] as Array<{ name: string; workspaceMarkdown: string; userAsk: string }>;
  for (const f of files) {
    const name = f.replace(/\.md$/i, "");
    const workspaceMarkdown = await readRaw(`${dir}/${f}`);
    const userAsk = "Follow the platform rules to produce the required output for this platform based on the documentation.";
    bundles.push({ name, workspaceMarkdown, userAsk });
  }
  return bundles;
}

(async () => {
  const bundles = await discoverBundles();

  const targets = ["lovable", "base44", "claude", "vscode"] as const;
  try {
    const res = await runEval(targets as any, bundles);
    console.table(
      res.map((r) => ({ target: r.target, bundle: r.bundle, ok: r.ok, reasons: r.reasons?.join("; ") }))
    );
    const failures = res.filter((r) => !r.ok);
    if (failures.length) process.exit(1);
  } catch (err) {
    console.error("Eval run failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  }
})();
