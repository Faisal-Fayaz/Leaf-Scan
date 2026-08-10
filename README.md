# LeafScan

LeafScan is an offline React Native/Expo app for crop-disease image triage. Camera frames and gallery images are processed on-device with TensorFlow Lite.

> **Pre-release software:** LeafScan can surface a possible visual match, but it is not a definitive diagnosis or pesticide recommendation. Review the [model card](MODEL_CARD.md) before evaluating or distributing the app.

## Product experience

- Guided camera and gallery scanning with large, accessible controls and clear offline/privacy status.
- Conservative result states that separate a possible visual match from an uncertain or unsupported scan.
- A private field notebook with durable local images and reviewable past results.
- English and Hindi navigation and safety prompts, selected from the About screen or the device locale.

Agronomy guidance remains in its reviewed English source until qualified local-language review is complete. LeafScan does not machine-translate safety-critical treatment text.

## Current model scope

The active disease model maps 38 PlantVillage-style classes. An experimental 102-class pest model is retained in the repository, but the app deliberately does not run it because its labels are numeric and unverified. This is not an “any plant” diagnostic system: unsupported species, nutrient stress, weather injury, mixed infections, and poor-quality images can all produce incorrect predictions.

The app rejects low-confidence or close results, records them as uncertain, and hides class-specific guidance. Accepted results are presented only as possible visual matches. Treatment cards provide conservative first steps; they do not replace a local agronomist or a pesticide label.

## Development setup

LeafScan targets Expo SDK 57, React Native 0.86, and Node.js 22.13 or newer.

~~~bash
nvm use
npm ci
npm run validate
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

Every pull request runs the complete validation suite, checks dependency compatibility, exports Android and web bundles, and compiles an Android debug APK. See [CONTRIBUTING.md](CONTRIBUTING.md) for the change checklist.

## Project policies

- [Model capabilities and limitations](MODEL_CARD.md)
- [Privacy notes](PRIVACY.md)
- [Security policy](SECURITY.md)
- [Contributing guide](CONTRIBUTING.md)

## Production checklist

Before publishing:

1. Validate model input/output shapes on representative physical devices.
2. Measure precision, recall, calibration, and out-of-distribution rejection on field images—not only the training split.
3. Replace numeric pest labels with a versioned, verified taxonomy and locally reviewed treatment guidance.
4. Add region/crop metadata and have agronomists review every recommendation.
5. Complete physical-device accessibility testing, independent privacy/legal review, and a documented offline model-update strategy.
6. Add privacy-conscious crash reporting only after defining consent, retention, and redaction requirements.

No computer-vision model can reliably identify every plant disease from one photograph. The path to a farmer-grade product is a continuously evaluated, region-aware model and verified agronomy content—not simply a lower confidence threshold.

## License

LeafScan is available under the [MIT License](LICENSE). The bundled model's upstream license and training provenance are not yet documented; do not assume the app license grants separate model-distribution rights.
