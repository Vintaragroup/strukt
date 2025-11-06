import { buildPrompt } from "../utils/promptBuilder";
import { validate } from "../utils/validators";
import type { Target } from "../platforms";

export type Bundle = { name: string; workspaceMarkdown: string; userAsk: string };
export type Provider = { generate(prompt: string): Promise<string> };
export type Providers = Record<Target, Provider>;

// Temporary mock providers to validate the pipeline end-to-end.
// Replace these with real API adapters as credentials and SDKs are available.
export const providers: Providers = {
  lovable: {
    async generate() {
      // Raw TSX (no code fences) with a single component shape.
      return [
        "import { Button } from '@/components/ui/button';",
        "export default function LoginCard() {",
        "  return (",
        "    <div className=\"p-6 rounded-xl border bg-white\">",
        "      <h2 className=\"text-lg font-semibold mb-4\">Login</h2>",
        "      <form className=\"space-y-3\">",
        "        <input className=\"w-full border rounded px-3 py-2\" placeholder=\"Email\" />",
        "        <input className=\"w-full border rounded px-3 py-2\" placeholder=\"Password\" type=\"password\" />",
        "        <Button type=\"submit\">Sign in</Button>",
        "      </form>",
        "      <ul className=\"mt-3 list-disc pl-5 text-sm text-muted-foreground\">",
        "        <li>TODO: Wire submit handler</li>",
        "      </ul>",
        "    </div>",
        "  );",
        "}",
      ].join("\n");
    },
  },
  base44: {
    async generate() {
      return [
        "# Feature Flags Rollout Plan",
        "",
        "## Scope",
        "Introduce feature flag service for staged releases across FE/BE.",
        "",
        "## Acceptance Criteria",
        "- Given a flag, when enabled, then the new UI is visible to 10% of users",
        "- Given a flag, when disabled, then the old UI is shown",
        "",
        "## Risks",
        "- Misconfiguration causing full exposure",
        "",
        "## Next Steps",
        "1. Add SDK\n2. Wrap routes\n3. Add audit log",
      ].join("\n");
    },
  },
  claude: {
    async generate() {
      return [
        "The proposal is directionally sound but lacks concrete telemetry hooks and rollback notes. Focus the initial slice on a single surface to reduce blast radius.",
        "",
        "Checklist:",
        "- [ ] Add success metrics (adoption, error rate)",
        "- [ ] Define rollback plan",
        "- [ ] List owners and review cadence",
      ].join("\n");
    },
  },
  vscode: {
    async generate() {
      return JSON.stringify(
        {
          tasks: [
            "mkdir -p packages/flags && cd packages/flags",
            "npm init -y && npm i express",
            "touch src/index.ts",
            "# wire SDK in frontend",
          ],
          notes: "Bootstrap a minimal flag service and integrate in FE."
        },
        null,
        2
      );
    },
  },
};

export async function runEval(targets: Target[], bundles: Bundle[]) {
  const results: Array<{ target: Target; bundle: string; ok: boolean; reasons: string[]; sample: string }> = [];
  for (const target of targets) {
    for (const b of bundles) {
      const prompt = buildPrompt({ target, workspaceMarkdown: b.workspaceMarkdown, userAsk: b.userAsk });
      const output = await providers[target].generate(prompt);
      const v = validate(target, output);
      results.push({ target, bundle: b.name, ok: v.ok, reasons: v.reasons, sample: output.slice(0, 800) });
    }
  }
  return results;
}
