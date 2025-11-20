# ASL Dataset Format

Export labelled samples from the in-app **Dataset Recorder** (bottom of the home page) or collect them via another pipeline, then place the resulting JSON file at `data/asl_landmarks.json`.

Expected structure:

```jsonc
{
  "samples": [
    {
      "label": "A",
      "landmarks": [
        { "x": 0.12, "y": 0.35, "z": -0.02 },
        // 21 entries total (MediaPipe hand landmarks)
        { "x": 0.44, "y": 0.61, "z": 0.03 }
      ]
    }
  ]
}
```

- `label` must be an uppercase A–Z character.
- `landmarks` is the array of 21 normalized hand landmarks in MediaPipe order.

Once the file exists, run:

```bash
npm run train:asl
```

The script trains a TensorFlow.js model and saves it to `public/models/asl-letter-model`. The app will automatically load the model on the next refresh.*** End Patch

