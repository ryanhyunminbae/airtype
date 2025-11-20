# AirType — Gesture Typing Prototype

AirType is a purely client-side prototype that uses the webcam, MediaPipe Hands, and TensorFlow.js to turn static hand gestures into letters. A letter wheel highlights the current prediction, while an augmented video feed shows the landmarks, skeleton, and bounding box the computer sees in real time.

## Tech Stack

- **Next.js 16** (App Router) + **React 19**
- **TypeScript** + **Tailwind CSS v4**
- **MediaPipe Tasks (Hand Landmarker)** for landmark extraction
- **TensorFlow.js** for a lightweight gesture-classification pipeline

## Setup & Commands

```bash
npm install       # install dependencies
npm run dev       # start the dev server at http://localhost:3000
npm run build     # production build
npm start         # serve the production build
```

> **Webcam permissions:** The browser will prompt for camera access the first time you visit the page. Grant access and keep the tab focused for the smoothest tracking. HTTPS is required outside localhost due to MediaDevices security restrictions.

## Architecture Overview

1. **CameraFeed (`components/CameraFeed.tsx`)**
   - Requests webcam access, streams the video element, and drives the detection/render loop.
   - Calls `detectHands` (MediaPipe) to fetch landmarks each frame and hands the result to `classifyGesture` (TensorFlow.js).
   - Emits the latest `GesturePrediction` to the parent page and renders `HandVisualizer`.
2. **HandVisualizer (`components/HandVisualizer.tsx`)**
   - Draws bounding boxes, skeleton connections, and the current prediction badge above the video feed canvas.
3. **Gesture Classifier (`lib/gestureClassifier.ts`)**
   - Converts raw landmarks into normalized vectors + heuristic metrics.
   - Automatically loads a trained ASL model from `public/models/asl-letter-model` when available, otherwise falls back to the lightweight prototype heuristic for A/B/C.
4. **LetterWheel (`components/LetterWheel.tsx`) & TextOutput (`components/TextOutput.tsx`)**
   - Letter wheel highlights the active prediction across all 26 letters.
   - Text output buffers confirmed letters (predicted confidently for N consecutive frames) and offers clear/space/backspace controls.

Main data flow:  
**Webcam → MediaPipe (`detectHands`) → Gesture features + TensorFlow.js classifier → Prediction state → Letter wheel + stabilization logic → Textgit addguffer + overlay.**

## Extending the Prototype

- Add more gestures by expanding `GESTURE_PROTOTYPES` in `lib/gestureClassifier.ts`, or swap in a trained tfjs model (see TODO in file).
- Adjust confidence or stabilization thresholds (constants in `app/page.tsx`) to fine-tune typing latency vs. accuracy.
- Swap the handcrafted feature extractor with embeddings produced by a lightweight neural network for better robustness.

## Native App (Expo + React Native)

The `apps/airtype-native` workspace now ships a working on-device pipeline:

- `expo-camera` captures front-facing frames.
- `@tensorflow/tfjs-react-native` runs the MediaPipe HandPose model (tfjs runtime) every ~450ms.
- Landmarks feed into the bundled ASL classifier (`assets/models/asl-letter-model/*`) using the same stabilization logic as web.
- Gesture overlay, letter wheel, and typed text UI parity with the browser experience.

### Setup

```bash
cd apps/airtype-native
npm install --legacy-peer-deps    # tfjs-react-native requires legacy peer resolution
npm start                         # Expo CLI → press i/a for iOS/Android
```

If you retrain the ASL model, copy the new `model.json`/`weights.bin` into `apps/airtype-native/assets/models/asl-letter-model/` before launching the native app.

Key files:

- `App.tsx` – layout + stabilization state
- `src/hooks/useGesturePipeline.ts` – camera capture, tfjs initialization, landmark extraction, classifier invocation
- `src/lib/gestureClassifier.ts` – switches between prototype and ASL model based on availability
- `src/components/*` – camera preview, overlays, wheel, text buffer, stabilization meter

## Collecting ASL Samples

1. Scroll to the **Dataset Recorder** panel on the home page.
2. Choose the ASL letter you want to capture, hold the pose in front of the camera, then click **Capture sample**.
3. Repeat for every letter (aim for 100+ samples per class). You can load previous sessions via the “Load dataset” file input.
4. Click **Export JSON**. Save the file as `data/asl_landmarks.json` (or copy the contents there).

The exported structure matches `data/asl_landmarks.example.json`.

## Training on American Sign Language

After collecting data:

```bash
# Optional: inspect data/asl_landmarks.json
npm run train:asl
```

The script (powered by `@tensorflow/tfjs-node`) trains a dense classifier on the recorded landmark features, then saves the model to `public/models/asl-letter-model`. Reload the app and it will automatically prefer the ASL model over the heuristic fallback. Use `logs/asl-training` with TensorBoard for deeper diagnostics:

```bash
npx tensorboard --logdir logs/asl-training
```
