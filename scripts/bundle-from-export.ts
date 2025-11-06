#!/usr/bin/env tsx
import fs from 'fs/promises';

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
      args[key] = val;
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  const input = args.in || args.input;
  const output = args.out || args.output;
  if (!input || !output) {
    console.error('Usage: tsx scripts/bundle-from-export.ts --in <export.json> --out <eval/bundles/name.md>');
    process.exit(1);
  }

  const raw = await fs.readFile(input, 'utf8');
  let json: any;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    console.error('Input is not valid JSON:', (e as Error).message);
    process.exit(1);
  }

  const markdown: string | undefined = json?.markdown;
  if (!markdown || typeof markdown !== 'string') {
    console.error('Input JSON does not contain a markdown field. Export a Documentation Bundle from the app.');
    process.exit(1);
  }

  // Ensure target folder exists
  const pathParts = output.split('/');
  const dir = pathParts.slice(0, -1).join('/');
  if (dir) {
    await fs.mkdir(dir, { recursive: true });
  }
  await fs.writeFile(output, markdown.endsWith('\n') ? markdown : markdown + '\n', 'utf8');
  console.log(`Wrote eval bundle: ${output}`);
}

main().catch((err) => {
  console.error('Failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
