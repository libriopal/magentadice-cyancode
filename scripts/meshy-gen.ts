#!/usr/bin/env node
// Meshy AI 3D model generation CLI — L5 ADORNMENT pipeline
//
// Usage (from repo root — requires Node 22+):
//   node --env-file .env --experimental-strip-types scripts/meshy-gen.ts text-to-3d "<prompt>" [--pillar biological|industrial|crystalline|voidshard]
//   node --env-file .env --experimental-strip-types scripts/meshy-gen.ts image-to-3d <image-path>
//   node --env-file .env --experimental-strip-types scripts/meshy-gen.ts status <task-id> [text|image]
//   node --env-file .env --experimental-strip-types scripts/meshy-gen.ts download <task-id> [text|image]
//   node --env-file .env --experimental-strip-types scripts/meshy-gen.ts list [text|image]
// Or use the wrapper:  ./scripts/meshy.sh <command> [args]
//
// Outputs: data/<id>.glb + data/<id>.info.json (extends existing corpus schema)

import { writeFileSync, readFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, join, extname } from 'node:path';

// ── constants ─────────────────────────────────────────────────────────────────

const API_BASE = 'https://api.meshy.ai/openapi/v2';
const DATA_DIR = resolve(process.cwd(), 'data');
const POLL_INTERVAL_MS = 6_000;
const POLL_MAX = 100; // ~10 min

// ── visual pillar → Meshy art style ──────────────────────────────────────────

type Pillar = 'biological' | 'industrial' | 'crystalline' | 'voidshard';

const PILLAR_STYLE: Record<Pillar, string> = {
  biological: 'realistic',
  industrial: 'pbr',
  crystalline: 'sculpture',
  voidshard:   'pbr',
};

const PILLAR_NEGATIVE: Record<Pillar, string> = {
  biological:  'mechanical, metal, clean, synthetic, plastic, cartoon',
  industrial:  'organic, natural, cartoon, low-poly, bright colors',
  crystalline: 'dull, opaque, rough, organic, dirt, rust, cartoon',
  voidshard:   'cartoon, smooth, clean, colorful, bright, flat',
};

// Extra suffix appended to user prompt per pillar to reinforce FAR_NZY aesthetic
const PILLAR_SUFFIX: Record<Pillar, string> = {
  biological:  ', wet biomechanical surface, translucent membrane, fungal growth, neon moss glow, gothic hacker aesthetic',
  industrial:  ', heavy steel and concrete, copper cabling, coolant pipes, amber glow, gothic hacker neon UI aesthetic',
  crystalline: ', fractured ultraviolet crystal, geological glass, internal storms, cosmic violet glow, gothic hacker aesthetic',
  voidshard:   ', VOIDSHARD rarity, black glass, ultraviolet edge glow, negative-space particles, internal lightning, asymmetric jagged geometry, mythic and unstable',
};

// ── API key ───────────────────────────────────────────────────────────────────

const API_KEY = process.env.MESHY_API_KEY;
if (!API_KEY) {
  console.error('[ERROR] MESHY_API_KEY not set.');
  console.error('  Run: node --env-file .env --import tsx/esm scripts/meshy-gen.ts ...');
  process.exit(1);
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

async function apiGet(path: string): Promise<unknown> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GET ${path} → ${res.status}: ${body}`);
  }
  return res.json();
}

async function apiPost(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

async function apiPostForm(path: string, formData: FormData): Promise<unknown> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${API_KEY}` },
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${path} (form) → ${res.status}: ${text}`);
  }
  return res.json();
}

// ── polling ───────────────────────────────────────────────────────────────────

type TaskType = 'text-to-3d' | 'image-to-3d';

interface MeshyTask {
  id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' | 'EXPIRED';
  model_urls?: { glb?: string; fbx?: string; obj?: string; usdz?: string };
  thumbnail_url?: string;
  prompt?: string;
  art_style?: string;
  progress?: number;
  task_error?: { message: string };
}

async function pollTask(taskId: string, type: TaskType): Promise<MeshyTask> {
  const endpoint = type === 'text-to-3d' ? `/text-to-3d/${taskId}` : `/image-to-3d/${taskId}`;
  for (let i = 0; i < POLL_MAX; i++) {
    const task = await apiGet(endpoint) as MeshyTask;
    const pct = task.progress ?? 0;
    process.stdout.write(`\r  [${type}] ${task.status} ${pct}%  (${i + 1}/${POLL_MAX})  `);
    if (task.status === 'SUCCEEDED') {
      process.stdout.write('\n');
      return task;
    }
    if (task.status === 'FAILED' || task.status === 'EXPIRED') {
      process.stdout.write('\n');
      throw new Error(`Task ${taskId} ${task.status}: ${task.task_error?.message ?? 'unknown'}`);
    }
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new Error(`Task ${taskId} did not complete within ${(POLL_MAX * POLL_INTERVAL_MS) / 60_000} min`);
}

// ── asset download & save ─────────────────────────────────────────────────────

function genId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 14 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

async function downloadBinary(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function saveTask(task: MeshyTask, pillar?: Pillar): Promise<string> {
  if (!task.model_urls?.glb) throw new Error('Task has no GLB URL');
  mkdirSync(DATA_DIR, { recursive: true });

  const id = genId();
  const glbPath = join(DATA_DIR, `${id}.glb`);
  // Thumbnail saved as {id}.jpg so manifest.sh corpus pairing logic finds it
  const thumbPath = join(DATA_DIR, `${id}.jpg`);
  const infoPath = join(DATA_DIR, `${id}.info.json`);

  console.log(`  Downloading GLB…`);
  const glb = await downloadBinary(task.model_urls.glb);
  writeFileSync(glbPath, glb);
  console.log(`  ✓ ${glbPath} (${(glb.byteLength / 1024).toFixed(0)} KB)`);

  if (task.thumbnail_url) {
    const thumb = await downloadBinary(task.thumbnail_url);
    writeFileSync(thumbPath, thumb);
    console.log(`  ✓ ${thumbPath}`);
  }

  const info = {
    meta: {
      id,
      date: Date.now(),
      rating: 0,
      // w/h = standard Meshy thumbnail dimensions; satisfies manifest.sh corpus shape check
      w: 512,
      h: 512,
      source: 'meshy-ai',
      taskId: task.id,
      artStyle: task.art_style ?? 'unknown',
      ...(pillar ? { pillar } : {}),
      format: 'glb',
    },
    info: {
      prompt: task.prompt ?? '',
      ...(pillar ? { pillarSuffix: PILLAR_SUFFIX[pillar] } : {}),
    },
    // mime describes the thumbnail (corpus image); GLB is referenced via meta.format
    mime: 'image/jpeg',
  };
  writeFileSync(infoPath, JSON.stringify(info, null, 2));
  console.log(`  ✓ ${infoPath}`);

  return id;
}

// ── commands ──────────────────────────────────────────────────────────────────

async function cmdTextTo3D(args: string[]): Promise<void> {
  const promptIdx = args.findIndex(a => !a.startsWith('--'));
  if (promptIdx === -1) {
    console.error('[ERROR] Usage: text-to-3d "<prompt>" [--pillar biological|industrial|crystalline|voidshard] [--refine]');
    process.exit(1);
  }

  const prompt = args[promptIdx];
  const pillarIdx = args.indexOf('--pillar');
  const pillar = (pillarIdx !== -1 ? args[pillarIdx + 1] : undefined) as Pillar | undefined;
  const doRefine = args.includes('--refine');

  if (pillar && !PILLAR_STYLE[pillar]) {
    console.error(`[ERROR] Unknown pillar "${pillar}". Must be: biological | industrial | crystalline | voidshard`);
    process.exit(1);
  }

  const fullPrompt = pillar ? `${prompt}${PILLAR_SUFFIX[pillar]}` : prompt;
  const artStyle = pillar ? PILLAR_STYLE[pillar] : 'realistic';
  const negativePrompt = pillar ? PILLAR_NEGATIVE[pillar] : 'cartoon, flat, low quality';

  console.log(`\n[meshy] text-to-3d (preview)`);
  console.log(`  prompt: ${fullPrompt.slice(0, 120)}…`);
  console.log(`  style:  ${artStyle}${pillar ? ` (${pillar})` : ''}`);

  const createRes = await apiPost('/text-to-3d', {
    mode: 'preview',
    prompt: fullPrompt,
    art_style: artStyle,
    negative_prompt: negativePrompt,
    ai_model: 'meshy-6',
  }) as { result: string };

  const taskId = createRes.result;
  console.log(`  task:   ${taskId}`);

  const task = await pollTask(taskId, 'text-to-3d');

  if (doRefine) {
    console.log(`\n[meshy] text-to-3d (refine)`);
    const refineRes = await apiPost(`/text-to-3d/${taskId}/refine`, {
      texture_richness: 'high',
    }) as { result: string };
    const refineId = refineRes.result;
    console.log(`  refine task: ${refineId}`);
    const refined = await pollTask(refineId, 'text-to-3d');
    const id = await saveTask(refined, pillar);
    console.log(`\n✅ Saved as corpus ID: ${id}`);
    return;
  }

  const id = await saveTask(task, pillar);
  console.log(`\n✅ Saved as corpus ID: ${id}`);
}

async function cmdImageTo3D(args: string[]): Promise<void> {
  const imagePath = args.find(a => !a.startsWith('--'));
  if (!imagePath) {
    console.error('[ERROR] Usage: image-to-3d <image-path> [--pillar biological|industrial|crystalline|voidshard]');
    process.exit(1);
  }
  const absPath = resolve(process.cwd(), imagePath);
  if (!existsSync(absPath)) {
    console.error(`[ERROR] File not found: ${absPath}`);
    process.exit(1);
  }

  const pillarIdx = args.indexOf('--pillar');
  const pillar = (pillarIdx !== -1 ? args[pillarIdx + 1] : undefined) as Pillar | undefined;

  console.log(`\n[meshy] image-to-3d`);
  console.log(`  source: ${absPath}`);

  const imageBytes = readFileSync(absPath);
  const ext = extname(absPath).slice(1).toLowerCase() || 'png';
  const mimeMap: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
  const mime = mimeMap[ext] ?? 'image/png';

  const form = new FormData();
  const blob = new Blob([imageBytes], { type: mime });
  form.append('image_file', blob, `upload.${ext}`);

  const createRes = await apiPostForm('/image-to-3d', form) as { result: string };
  const taskId = createRes.result;
  console.log(`  task:   ${taskId}`);

  const task = await pollTask(taskId, 'image-to-3d');
  const id = await saveTask(task, pillar);
  console.log(`\n✅ Saved as corpus ID: ${id}`);
}

async function cmdStatus(args: string[]): Promise<void> {
  const taskId = args[0];
  const type = (args[1] ?? 'text') === 'image' ? 'image-to-3d' : 'text-to-3d';
  if (!taskId) { console.error('[ERROR] Usage: status <task-id> [text|image]'); process.exit(1); }
  const task = await apiGet(type === 'text-to-3d' ? `/text-to-3d/${taskId}` : `/image-to-3d/${taskId}`) as MeshyTask;
  console.log(JSON.stringify(task, null, 2));
}

async function cmdDownload(args: string[]): Promise<void> {
  const taskId = args[0];
  const type = (args[1] ?? 'text') === 'image' ? 'image-to-3d' : 'text-to-3d';
  if (!taskId) { console.error('[ERROR] Usage: download <task-id> [text|image]'); process.exit(1); }
  const task = await apiGet(type === 'text-to-3d' ? `/text-to-3d/${taskId}` : `/image-to-3d/${taskId}`) as MeshyTask;
  if (task.status !== 'SUCCEEDED') {
    console.error(`[ERROR] Task ${taskId} is ${task.status}, not SUCCEEDED`);
    process.exit(1);
  }
  const id = await saveTask(task);
  console.log(`✅ Saved as corpus ID: ${id}`);
}

async function cmdList(args: string[]): Promise<void> {
  const type = (args[0] ?? 'text') === 'image' ? 'image-to-3d' : 'text-to-3d';
  const tasks = await apiGet(`/${type}?page_num=1&page_size=20`) as { result: MeshyTask[] };
  const list = tasks.result ?? (Array.isArray(tasks) ? tasks as MeshyTask[] : []);
  if (!list.length) { console.log('  (no tasks found)'); return; }
  for (const t of list) {
    const pct = t.status === 'SUCCEEDED' ? '100%' : `${t.progress ?? 0}%`;
    console.log(`  ${t.id}  ${t.status.padEnd(12)} ${pct.padStart(4)}  ${(t.prompt ?? '').slice(0, 60)}`);
  }
}

function cmdCorpusList(): void {
  const files = readdirSync(DATA_DIR).filter((f: string) => f.endsWith('.info.json'));
  const meshyAssets: Array<{ id: string; pillar?: string; prompt: string; date: string; hasGlb: boolean }> = [];

  for (const f of files) {
    const raw = readFileSync(join(DATA_DIR, f), 'utf8');
    const info = JSON.parse(raw) as { meta?: Record<string, unknown>; info?: { prompt?: string } };
    if (info.meta?.source !== 'meshy-ai') continue;
    const id = String(info.meta.id ?? f.replace('.info.json', ''));
    meshyAssets.push({
      id,
      pillar: info.meta.pillar as string | undefined,
      prompt: (info.info?.prompt ?? '').slice(0, 70),
      date: new Date(Number(info.meta.date ?? 0)).toISOString().slice(0, 10),
      hasGlb: existsSync(join(DATA_DIR, `${id}.glb`)),
    });
  }

  if (!meshyAssets.length) { console.log('  (no Meshy assets in data/)'); return; }
  console.log(`\n  ${meshyAssets.length} Meshy asset(s) in data/\n`);
  for (const a of meshyAssets) {
    const glb = a.hasGlb ? '✓glb' : '✗glb';
    const pillar = (a.pillar ?? 'none').padEnd(12);
    console.log(`  ${a.id}  ${a.date}  ${pillar}  ${glb}  ${a.prompt}`);
  }
}

function printHelp(): void {
  console.log(`
meshy-gen.ts — FAR_NZY L5 ADORNMENT 3D asset generator

USAGE (from repo root):
  ./scripts/meshy.sh <command> [args]
  node --env-file .env --experimental-strip-types scripts/meshy-gen.ts <command> [args]

COMMANDS
  text-to-3d "<prompt>" [--pillar <pillar>] [--refine]
      Generate a 3D model from text. --refine adds a high-quality texture pass.

  image-to-3d <path> [--pillar <pillar>]
      Generate a 3D model from an image file.

  status <task-id> [text|image]
      Check the status of a running task.

  download <task-id> [text|image]
      Download a completed task to data/.

  list [text|image]
      List recent tasks.

  corpus-list
      Show all Meshy-generated assets already saved in data/.

PILLARS (visual aesthetic — maps to Meshy art style + prompt suffix)
  biological    → realistic  (wet, overgrown, biomechanical)
  industrial    → pbr        (steel, concrete, coolant pipes)
  crystalline   → sculpture  (ultraviolet shards, geological glass)
  voidshard     → pbr        (VOIDSHARD rarity — highest tier)

OUTPUT
  data/<id>.glb          — 3D model (GLTF binary)
  data/<id>.thumbnail.jpg — preview thumbnail
  data/<id>.info.json    — corpus metadata (extends existing schema)

ENVIRONMENT
  MESHY_API_KEY   — required (set in .env, never commit)
`);
}

// ── dispatch ──────────────────────────────────────────────────────────────────

const [,, cmd, ...rest] = process.argv;

(async () => {
  try {
    switch (cmd) {
      case 'text-to-3d':   await cmdTextTo3D(rest); break;
      case 'image-to-3d':  await cmdImageTo3D(rest); break;
      case 'status':       await cmdStatus(rest); break;
      case 'download':     await cmdDownload(rest); break;
      case 'list':         await cmdList(rest); break;
      case 'corpus-list':  cmdCorpusList(); break;
      case 'help':
      case '--help':
      case undefined:      printHelp(); break;
      default:
        console.error(`[ERROR] Unknown command: ${cmd}`);
        printHelp();
        process.exit(1);
    }
  } catch (err) {
    console.error(`\n[ERROR] ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
})();
