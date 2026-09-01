/**
 * Synaera-SA model setup.
 *
 * Copies the MediaPipe vision WASM runtime out of node_modules and downloads the
 * hand / face task models into public/mediapipe so the recogniser runs fully
 * on-device with no CDN dependency at runtime.
 *
 * Binaries are gitignored — run `npm run setup:models` (or just `npm install`,
 * which triggers it) after cloning.
 */
import { createWriteStream } from 'node:fs';
import { mkdir, copyFile, readdir, stat, access } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WASM_SRC = path.join(ROOT, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm');
const WASM_DEST = path.join(ROOT, 'public', 'mediapipe', 'wasm');
const MODEL_DEST = path.join(ROOT, 'public', 'mediapipe', 'models');

const MODELS = [
  {
    file: 'hand_landmarker.task',
    url: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
    note: '21-point hand landmark detector (both hands)',
  },
  {
    file: 'blaze_face_short_range.tflite',
    url: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
    note: 'face box, used to anchor signing-space zones to the head',
  },
];

const exists = async (p) => access(p).then(() => true, () => false);

async function copyWasm() {
  if (!(await exists(WASM_SRC))) {
    console.warn('[setup-models] @mediapipe/tasks-vision not installed yet — skipping WASM copy.');
    return;
  }
  await mkdir(WASM_DEST, { recursive: true });
  const entries = await readdir(WASM_SRC);
  for (const entry of entries) {
    const dest = path.join(WASM_DEST, entry);
    if (await exists(dest)) continue;
    await copyFile(path.join(WASM_SRC, entry), dest);
    console.log(`[setup-models] copied ${entry}`);
  }
}

async function download({ file, url, note }) {
  await mkdir(MODEL_DEST, { recursive: true });
  const dest = path.join(MODEL_DEST, file);
  if (await exists(dest)) {
    const { size } = await stat(dest);
    if (size > 0) {
      console.log(`[setup-models] ${file} already present (${(size / 1e6).toFixed(1)} MB)`);
      return;
    }
  }
  console.log(`[setup-models] downloading ${file} — ${note}`);
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
  const { size } = await stat(dest);
  console.log(`[setup-models] saved ${file} (${(size / 1e6).toFixed(1)} MB)`);
}

async function main() {
  try {
    await copyWasm();
    for (const model of MODELS) await download(model);
    console.log('[setup-models] done — on-device SASL recognition assets ready.');
  } catch (err) {
    // Never fail the install: the app falls back to the public CDN at runtime.
    console.warn(`[setup-models] could not stage assets locally (${err.message}).`);
    console.warn('[setup-models] the app will load MediaPipe from the public CDN instead.');
  }
}

main();
