# Contributing to LeafScan

LeafScan combines mobile engineering with agricultural decision support. A change is complete only when both the software behavior and the safety claim are defensible.

## Local setup

Use Node.js 22.13 or newer, then run:

```sh
nvm use
npm ci
npm run validate
```

Camera and TensorFlow Lite are native modules, so Expo Go is not sufficient. Generate a development project with `npx expo prebuild` and use `npm run android` or `npm run ios`.

## Pull requests

- Keep each pull request focused and explain the user-visible outcome.
- Add or update tests for inference, thresholds, persistence, or localization behavior.
- Run Android and web exports. Native changes should also compile an Android debug build.
- Do not commit generated `android/`, `ios/`, `dist/`, credentials, local IDE state, or backup files.
- Preserve accessible labels, minimum touch targets, and both English and Hindi interface catalogs.

## Model and agronomy changes

Do not infer names from numeric class IDs or add placeholder treatments. A model change requires versioned provenance, checksums, input/output documentation, representative field evaluation, and an updated `MODEL_CARD.md`.

Treatment guidance must be reviewed for the target crop, region, and applicable product rules. Do not machine-translate safety-critical agronomy text. The app must continue to distinguish a possible visual match from an uncertain or unsupported result.
