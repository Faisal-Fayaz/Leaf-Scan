# LeafScan

LeafScan is an offline React Native/Expo app for crop-disease image triage. Camera frames and gallery images are processed on-device with TensorFlow Lite.

## Current model scope

The active disease model maps 38 PlantVillage-style classes. An experimental 102-class pest model is retained in the repository, but the app deliberately does not run it because its labels are numeric and unverified. This is not an “any plant” diagnostic system: unsupported species, nutrient stress, weather injury, mixed infections, and poor-quality images can all produce incorrect predictions.

The app rejects low-confidence or close results, records them as uncertain, and hides class-specific guidance. Accepted results are presented only as possible visual matches. Treatment cards provide conservative first steps; they do not replace a local agronomist or a pesticide label.

## Development setup

LeafScan targets Expo SDK 57, React Native 0.86, and Node.js 22.13 or newer.

~~~bash
nvm use
npm ci
npm test
npm run typecheck
npm run doctor
npm start
~~~

Because camera and TensorFlow Lite modules are native modules, Expo Go is not sufficient. Use a development build:

~~~bash
npx expo prebuild
npm run android
# iOS requires macOS/Xcode:
npm run ios
~~~

The browser export intentionally shows a mobile handoff rather than loading the native camera and TensorFlow Lite runtime. This keeps the web build usable without claiming that browser scans are supported.

For an installable Android preview build:

~~~bash
npm run build:android
~~~

## Production checklist

Before publishing:

1. Validate model input/output shapes on representative physical devices.
2. Measure precision, recall, calibration, and out-of-distribution rejection on field images—not only the training split.
3. Replace numeric pest labels with a versioned, verified taxonomy and locally reviewed treatment guidance.
4. Add region/crop metadata and have agronomists review every recommendation.
5. Add crash reporting, privacy/legal review, accessibility testing, localization, and an offline update strategy.
6. Commit the source, model assets, and generated build configuration that your release process depends on.

No computer-vision model can reliably identify every plant disease from one photograph. The path to a farmer-grade product is a continuously evaluated, region-aware model and verified agronomy content—not simply a lower confidence threshold.
