# Synaera-SA — Accessible SASL Bridge

A free, open-source, two-way translator between **South African Sign Language (SASL)** and spoken/written English.

SASL became South Africa's 12th official language in 2023. This project exists to make everyday interactions — a clinic visit, a classroom, a taxi rank, a police station — work in both directions, without either person needing an interpreter on hand.

Non-profit and community-owned. Apache-2.0 licensed. No accounts, no tracking, no data collection.

Inspired by the [Synaera / Team Semaphore](https://github.com/MehrinFirdousi/Synaera-TeamSemaphore) project, rebuilt around South African Sign Language.

---

## What it does

| Mode | What happens |
|---|---|
| **Sign → Voice** | Your camera tracks your hands, recognises SASL signs, and speaks the English out loud in a South African English voice. |
| **Speak → Sign** | Speak English into the microphone; a blue mannequin signs it back, with a live listening indicator. |
| **Type → Sign** | Type English; the same mannequin signs it. Needs no camera or microphone. |
| **Conversation** | Both directions side by side, for a real back-and-forth between a Deaf and a hearing person. |

---

## How sign recognition works

**All recognition runs on your device.** Camera frames are never uploaded. This is a hard requirement, not a nice-to-have: the app is meant for clinics, schools and police stations, where a recording of what someone said is not something we are willing to create.

The pipeline:

```
camera frame
  → MediaPipe HandLandmarker      21 3-D landmarks per hand, both hands
  → feature extraction            handshape, orientation, location, movement
  → template scoring              matched against the SASL sign vocabulary
  → stability gate                the sign must be held to confirm
  → spoken English
```

Signs are described in the four parameters SASL linguistics actually uses:

- **Handshape** — which fingers are extended, and how far apart (`src/lib/handFeatures.ts`)
- **Orientation** — where the hand points, and whether the palm faces the camera
- **Location** — where the hand sits in the signing space, measured in *face-heights* from your detected face, so it stays correct whether you are close to the camera or far from it
- **Movement** — classified over a rolling ~0.9 s window into still / wave / tap / circle / directed motion

A sign only fires when it is held steadily for several frames **and** clearly beats the runner-up. If your hand is relaxed or mid-transition between signs, the app stays silent rather than guessing. A false translation puts words in a Deaf signer's mouth, so silence is the correct answer when the reading is ambiguous.

### The sign vocabulary

The vocabulary lives in `src/lib/signTemplates.ts` as plain, readable descriptions — no trained model, no dataset, no ML pipeline. Adding a sign means describing it:

```ts
{
  id: 'sharp_good',
  gloss: 'SHARP / GOOD',
  english: 'Sharp sharp! Good',
  hands: 1,
  shape: { thumb: 1, index: 0.05, middle: 0.05, ring: 0.05, pinky: 0.05 },
  pointing: 'up',
  motion: 'static',
  tip: 'Make a fist with your thumb pointing straight up, and hold it.',
}
```

**This is a starter vocabulary of high-frequency signs, not the whole of SASL.** Signs were chosen to be reliably distinguishable from hand landmarks alone. Growing it is exactly the kind of contribution this project wants, especially from Deaf SASL users and qualified interpreters — see [Contributing](#contributing).

---

## Running it

**Requirements:** Node.js 20+, and a browser with camera access.

```bash
npm install     # also stages the on-device models (~8 MB, one time)
npm run dev     # http://localhost:3000
```

That's the whole setup. **No API key is required** — sign recognition, the avatar, speech-to-text and text-to-speech all run in the browser.

### Optional: AI assist

Setting `GEMINI_API_KEY` in `.env.local` enables two optional extras: richer English→SASL gloss parsing, and an AI second opinion on signs outside the built-in vocabulary. Without it the app falls back to its own rule-based parser and on-device recogniser, and says so plainly rather than inventing an answer.

```bash
GEMINI_API_KEY="your-key"     # optional
GEMINI_MODEL="gemini-2.5-flash"  # optional override
```

### Offline use

`npm install` stages the MediaPipe runtime and models into `public/mediapipe/` so the app works with no internet connection — which matters on unreliable or metered links. If those files are missing, the app falls back to a public CDN automatically. To stage them manually:

```bash
npm run setup:models
```

---

## Tests

```bash
npm test
```

Two suites, both runnable without a camera:

- `npm run verify:recognizer` — builds synthetic 21-point hand landmarks for known handshapes (thumbs up, ILY, a V, a waving open hand, a nodding fist…) and asserts the recogniser identifies each one. It also asserts that a **relaxed or half-formed hand produces no sign at all**, which is what stops the app blurting out random words.
- `npm run verify:parser` — asserts English→SASL gloss parsing, including that no sign is silently dropped from the middle of a sentence.

If you change a threshold in `handFeatures.ts` or `gestureRecognizer.ts`, these tell you immediately which signs stopped being distinguishable.

---

## Project layout

```
src/
  lib/
    handFeatures.ts       landmarks → handshape, orientation, location
    gestureRecognizer.ts  movement analysis, scoring, stability gate
    signTemplates.ts      the recognisable sign vocabulary  ← add signs here
    saslDictionary.ts     signs + avatar keyframes, English → gloss parsing
  hooks/
    useHandTracking.ts    MediaPipe lifecycle and the per-frame loop
  components/
    SignToSpeech.tsx      camera → spoken English
    SpeechToSign.tsx      microphone → avatar
    TextToSign.tsx        typing → avatar
    BlueMannequin.tsx     the Three.js half-body avatar
scripts/
  setup-models.mjs        stages MediaPipe assets for offline use
  verify-recognizer.mjs   synthetic recognition tests
  verify-text-parser.mjs  gloss parsing tests
server.ts                 Express + Vite, optional AI assist endpoints
```

---

## Contributing

The most valuable contributions are **from Deaf SASL users, interpreters and SASL linguists**, and they don't require writing code:

- **A sign is wrong.** Regional variation is real — Gauteng, Western Cape and KZN differ. Open an issue saying which sign, how it should be formed, and where you sign.
- **A sign is missing.** Describe the handshape, where it sits on the body, and how it moves. That description is literally the implementation.
- **A sign won't register.** Tell us what you did and what it said instead.

For code contributions: add your sign to `src/lib/signTemplates.ts`, add a scenario to `scripts/verify-recognizer.mjs`, and run `npm test`.

### Known limitations

We would rather state these plainly than oversell:

- The vocabulary is a starter set, not full SASL.
- Recognition uses hand landmarks only. SASL grammar also lives in facial expression, eye gaze and body shift, which the recogniser does not yet read.
- Fingerspelling is generated for the avatar but not yet recognised from the camera.
- The avatar's signing is an approximation built from keyframes, not motion-captured from native signers.
- Speech recognition uses the browser's Web Speech API, best supported in Chrome and Edge.

---

## Licence

Apache-2.0. Free to use, fork, and deploy — including by NGOs, schools, clinics and government services.
