# LeafScan model card

## Intended use

LeafScan uses an on-device image classifier for limited crop-disease visual triage. It can suggest a possible pattern for the user to confirm. It is not a definitive diagnosis, pesticide recommendation system, or an any-plant expert.

## Active disease model

| Property | Value |
|---|---|
| File | `assets/models/disease_model.tflite` |
| SHA-256 | `e5fe51c408abafedb89719e8dd23acaaa6c1bbfb7c71ecafe1ec2374df95d18e` |
| Input | One `float32[1,224,224,3]` RGB tensor |
| App pixel range | 0–255 |
| Graph preprocessing | The graph begins with approximately `x / 127.5 - 1` |
| Output | One 38-class score tensor |
| Labels | `src/data/disease_class_names.json` |
| Execution | TensorFlow Lite on-device, CPU delegate |

The label names are PlantVillage-style. The repository does not currently contain a trustworthy training-data manifest, model-author statement, license, split definition, or evaluation report. The training provenance must therefore be treated as unknown.

## Disabled pest model

`assets/models/pest_model.tflite` has SHA-256 `481636cddc50a3d06693e100b6c45a97f26b93fcb6e1fb9994da56702c8a2596` and 102 numeric labels. It is retained for provenance work but is not loaded or bundled into the active app. Numeric IDs are not converted into pest names or treatments.

## Result policy

- A score below 0.60 is uncertain.
- A gap below 0.08 between the two highest classes is ambiguous.
- Uncertain, ambiguous, unsupported, or unmapped output hides class-specific guidance.
- Accepted output is phrased as a possible visual match, never a confirmed diagnosis.

These thresholds are conservative product guardrails, not calibrated probabilities or validated agronomic operating points.

## Known limitations

- The supported label set is narrow and region-agnostic.
- Field background, lighting, camera quality, growth stage, mixed symptoms, cultivars, and multiple simultaneous problems can shift performance.
- Nutrient stress, herbicide injury, heat, water stress, insects, and unsupported diseases may be forced toward a known class.
- Current guidance lacks crop stage, location, weather, resistance history, and product-label context.
- No representative field precision, recall, calibration, subgroup, or out-of-distribution report is available.

## Release requirements

Before making diagnostic or treatment efficacy claims, publish a versioned model/data license and provenance record; evaluate representative field images by crop, region, device, and condition; measure class-level precision/recall and calibration; test unknown-condition rejection; and obtain qualified agronomy and legal review for every supported region.
