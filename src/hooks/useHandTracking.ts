/**
 * Synaera-SA — live hand tracking hook.
 *
 * Owns the MediaPipe lifecycle and the per-frame loop: detect hands, anchor the
 * signing space to the signer's face, extract features, and drive the SASL
 * recogniser. Everything runs on-device.
 */

import type { RefObject } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FaceDetector, HandLandmarker } from '@mediapipe/tasks-vision';
import { resolveAssetPaths } from '../lib/mediapipeAssets';
import { extractHandFeatures, type FaceAnchor, type HandFeatures, type Point3 } from '../lib/handFeatures';
import {
  SaslGestureRecognizer,
  type RecognisedSign,
  type RecognitionState,
} from '../lib/gestureRecognizer';

export type TrackingStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface TrackedFrame {
  /** Normalised image landmarks per hand, for drawing the skeleton. */
  landmarks: Point3[][];
  features: HandFeatures[];
  face: FaceAnchor | null;
}

const EMPTY_FRAME: TrackedFrame = { landmarks: [], features: [], face: null };

const EMPTY_STATE: RecognitionState = {
  candidate: null,
  alternatives: [],
  stability: 0,
  motion: { type: 'static', travel: 0, netX: 0, netY: 0, directness: 0, reversalsX: 0, reversalsY: 0 },
  handCount: 0,
};

/** Face detection is far more stable than hand motion, so it can run slower. */
const FACE_EVERY_N_FRAMES = 5;

interface UseHandTrackingOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  /** Tracking only runs while this is true. */
  enabled: boolean;
  /** Fired once per confirmed sign — this is what drives the voice output. */
  onSign?: (sign: RecognisedSign) => void;
}

export function useHandTracking({ videoRef, enabled, onSign }: UseHandTrackingOptions) {
  const [status, setStatus] = useState<TrackingStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [assetSource, setAssetSource] = useState<'local' | 'cdn' | null>(null);
  const [frame, setFrame] = useState<TrackedFrame>(EMPTY_FRAME);
  const [recognition, setRecognition] = useState<RecognitionState>(EMPTY_STATE);
  const [fps, setFps] = useState(0);

  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const faceDetectorRef = useRef<FaceDetector | null>(null);
  const recognizerRef = useRef(new SaslGestureRecognizer());
  const rafRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const frameCountRef = useRef(0);
  const faceRef = useRef<FaceAnchor | null>(null);
  const fpsWindowRef = useRef<number[]>([]);

  // Keep the latest callback without restarting the loop when it changes.
  const onSignRef = useRef(onSign);
  useEffect(() => {
    onSignRef.current = onSign;
  }, [onSign]);

  /* ---------------------------------------------------------------- *
   * Model loading
   * ---------------------------------------------------------------- */
  useEffect(() => {
    if (!enabled) return;
    if (handLandmarkerRef.current) return;

    let cancelled = false;

    (async () => {
      setStatus('loading');
      setError(null);

      try {
        const [{ FilesetResolver, HandLandmarker, FaceDetector }, paths] = await Promise.all([
          import('@mediapipe/tasks-vision'),
          resolveAssetPaths(),
        ]);
        if (cancelled) return;

        const fileset = await FilesetResolver.forVisionTasks(paths.wasmBase);
        if (cancelled) return;

        const hands = await HandLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: paths.handModel, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        if (cancelled) {
          hands.close();
          return;
        }
        handLandmarkerRef.current = hands;

        // The face anchor is an enhancement, not a requirement: without it the
        // recogniser falls back to frame-relative zones.
        try {
          faceDetectorRef.current = await FaceDetector.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: paths.faceModel, delegate: 'GPU' },
            runningMode: 'VIDEO',
            minDetectionConfidence: 0.5,
          });
        } catch (faceErr) {
          console.warn('[synaera] face anchor unavailable, using frame-relative zones', faceErr);
        }

        if (cancelled) return;
        setAssetSource(paths.local ? 'local' : 'cdn');
        setStatus('ready');
      } catch (err) {
        if (cancelled) return;
        console.error('[synaera] hand tracking failed to initialise', err);
        setError(
          err instanceof Error
            ? `Could not load the sign recognition models: ${err.message}`
            : 'Could not load the sign recognition models.',
        );
        setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  /* ---------------------------------------------------------------- *
   * Per-frame detection loop
   * ---------------------------------------------------------------- */
  useEffect(() => {
    if (!enabled || status !== 'ready') return;

    let stopped = false;

    const tick = () => {
      if (stopped) return;

      const video = videoRef.current;
      const hands = handLandmarkerRef.current;

      if (video && hands && video.readyState >= 2 && video.videoWidth > 0) {
        // detectForVideo requires strictly increasing timestamps, and there is
        // no point re-running on a frame we have already seen.
        if (video.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = video.currentTime;
          const now = performance.now();

          try {
            frameCountRef.current++;

            if (faceDetectorRef.current && frameCountRef.current % FACE_EVERY_N_FRAMES === 0) {
              const faceResult = faceDetectorRef.current.detectForVideo(video, now);
              const box = faceResult.detections?.[0]?.boundingBox;
              faceRef.current = box
                ? {
                    // Face boxes come back in pixels; the rest of the pipeline
                    // works in normalised coordinates.
                    cx: (box.originX + box.width / 2) / video.videoWidth,
                    cy: (box.originY + box.height / 2) / video.videoHeight,
                    width: box.width / video.videoWidth,
                    height: box.height / video.videoHeight,
                  }
                : null;
            }

            const result = hands.detectForVideo(video, now);

            const features: HandFeatures[] = result.landmarks.map((screen, i) => {
              const handedness = (result.handedness?.[i]?.[0]?.categoryName ?? 'Right') as 'Left' | 'Right';
              const score = result.handedness?.[i]?.[0]?.score ?? 1;
              return extractHandFeatures(
                result.worldLandmarks[i] as Point3[],
                screen as Point3[],
                handedness,
                score,
                faceRef.current,
              );
            });

            const { state, emitted } = recognizerRef.current.update(features, now);

            setFrame({
              landmarks: result.landmarks as Point3[][],
              features,
              face: faceRef.current,
            });
            setRecognition(state);

            if (emitted) onSignRef.current?.(emitted);

            // Rolling FPS over the last second.
            const window = fpsWindowRef.current;
            window.push(now);
            while (window.length && now - window[0] > 1000) window.shift();
            setFps(window.length);
          } catch (err) {
            console.warn('[synaera] frame skipped', err);
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      stopped = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [enabled, status, videoRef]);

  /* ---------------------------------------------------------------- *
   * Clear state when tracking is switched off
   * ---------------------------------------------------------------- */
  useEffect(() => {
    if (enabled) return;
    recognizerRef.current.reset();
    lastVideoTimeRef.current = -1;
    faceRef.current = null;
    fpsWindowRef.current = [];
    setFrame(EMPTY_FRAME);
    setRecognition(EMPTY_STATE);
    setFps(0);
  }, [enabled]);

  /* ---------------------------------------------------------------- *
   * Tear down the models on unmount
   * ---------------------------------------------------------------- */
  useEffect(() => {
    return () => {
      handLandmarkerRef.current?.close();
      handLandmarkerRef.current = null;
      faceDetectorRef.current?.close();
      faceDetectorRef.current = null;
    };
  }, []);

  const resetRecognition = useCallback(() => {
    recognizerRef.current.reset();
    setRecognition(EMPTY_STATE);
  }, []);

  return { status, error, assetSource, frame, recognition, fps, resetRecognition };
}
