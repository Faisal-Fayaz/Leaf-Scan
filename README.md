# LeafScan

LeafScan is an offline React Native/Expo app for crop disease and insect-image triage. Camera frames and gallery images are processed on-device with TensorFlow Lite models.

## Current model scope

The bundled disease model maps 38 PlantVillage-style classes. The bundled pest model maps 102 IP102-style classes, but its labels are numeric in this repository. This is not an “any plant” diagnostic system: unsupported species, nutrient stress, weather injury, mixed infections, and poor-quality images can all produce incorrect predictions.

The app intentionally shows a confirmation warning for low-confidence or ambiguous results. Treatment cards provide conservative first steps only; they do not replace a local agronomist or a pesticide label.

## Development setup

~~~bash
npm install
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
