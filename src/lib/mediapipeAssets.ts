/**
 * Resolves where the MediaPipe WASM runtime and task models are loaded from.
 *
 * Preference order:
 *   1. `public/mediapipe/*` staged locally by `npm run setup:models` — works
 *      offline, which matters for clinics and schools on unreliable links.
 *   2. The public CDN, so a fresh clone still runs without the setup step.
 */

const CDN_WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm';
const CDN_MODELS = 'https://storage.googleapis.com/mediapipe-models';

export const LOCAL_WASM = '/mediapipe/wasm';
export const LOCAL_MODELS = '/mediapipe/models';

export const CDN_HAND_MODEL = `${CDN_MODELS}/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`;
export const CDN_FACE_MODEL = `${CDN_MODELS}/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`;

async function isReachable(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}

export interface AssetPaths {
  wasmBase: string;
  handModel: string;
  faceModel: string;
  /** True when everything is served from this origin (fully offline capable). */
  local: boolean;
}

let cached: Promise<AssetPaths> | null = null;

export function resolveAssetPaths(): Promise<AssetPaths> {
  if (cached) return cached;

  cached = (async () => {
    const local = await isReachable(`${LOCAL_WASM}/vision_wasm_internal.js`);
    if (local) {
      const handLocal = await isReachable(`${LOCAL_MODELS}/hand_landmarker.task`);
      const faceLocal = await isReachable(`${LOCAL_MODELS}/blaze_face_short_range.tflite`);
      return {
        wasmBase: LOCAL_WASM,
        handModel: handLocal ? `${LOCAL_MODELS}/hand_landmarker.task` : CDN_HAND_MODEL,
        faceModel: faceLocal ? `${LOCAL_MODELS}/blaze_face_short_range.tflite` : CDN_FACE_MODEL,
        local: handLocal && faceLocal,
      };
    }

    return {
      wasmBase: CDN_WASM,
      handModel: CDN_HAND_MODEL,
      faceModel: CDN_FACE_MODEL,
      local: false,
    };
  })();

  return cached;
}
