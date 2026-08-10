import type { TreatmentInfo } from "@/types";
import diseaseClassNames from "@/data/disease_class_names.json";

/**
 * Conservative, non-chemical guidance for the classes this app actually
 * understands. A photo alone is not enough context to recommend a pesticide:
 * crop, growth stage, local law, resistance history and label all matter.
 */
const SAFE_FIRST_STEPS = [
  "Isolate the affected plant or area when practical and avoid moving wet foliage between plants.",
  "Remove badly affected leaves or fruit and dispose of them away from the growing area; do not compost diseased material.",
  "Improve airflow, reduce leaf wetness, and water at the soil line rather than over the canopy.",
  "Recheck the plant in 3–5 days and confirm the diagnosis with a local agricultural extension professional before applying any product.",
];

const GUIDANCE_BY_PATTERN: Array<{
  pattern: RegExp;
  description: string;
  organicTreatment?: string[];
  severity?: TreatmentInfo["severity"];
}> = [
  {
    pattern: /healthy/i,
    description:
      "No known disease pattern was detected in this image. Keep monitoring new growth and use good sanitation and watering practices.",
    organicTreatment: [
      "Continue routine scouting, especially the underside of leaves and new growth.",
      "Keep tools clean and remove fallen leaves or fruit from around the plant.",
    ],
    severity: "info",
  },
  {
    pattern: /powdery_mildew/i,
    description:
      "The closest supported visual pattern was powdery mildew. These fungi are often encouraged by humid, poorly ventilated growth and can spread quickly.",
    organicTreatment: [
      "Prune crowded growth to improve air movement without removing more than one-third of the plant at once.",
      "Remove heavily infected leaves and keep the canopy dry overnight.",
      ...SAFE_FIRST_STEPS.slice(3),
    ],
    severity: "moderate",
  },
  {
    pattern: /bacterial_spot/i,
    description:
      "The closest supported visual pattern was bacterial spot. Splashing water and contaminated tools can spread bacterial leaf spots.",
    organicTreatment: [
      "Avoid overhead irrigation and do not handle plants while foliage is wet.",
      "Sanitize pruning tools between plants and remove badly affected leaves.",
      ...SAFE_FIRST_STEPS.slice(3),
    ],
    severity: "moderate",
  },
  {
    pattern: /late_blight|early_blight|leaf_blight|leaf_spot|target_spot|septoria/i,
    description:
      "The closest supported visual pattern was a fungal leaf blight or leaf spot. Confirmation is important because several conditions look similar in photos.",
    organicTreatment: [
      "Remove affected lower leaves and fallen debris to reduce sources of new infection.",
      "Stake or space plants to improve airflow and avoid wetting the leaves.",
      ...SAFE_FIRST_STEPS.slice(3),
    ],
    severity: "moderate",
  },
  {
    pattern: /black_rot|apple_scab|cedar_apple_rust|esca/i,
    description:
      "The closest supported visual pattern was a fruit-tree or grape fungal disease. Pruning, sanitation, and a locally approved disease-management plan are important.",
    organicTreatment: [
      "Remove mummified fruit and infected leaves from the tree floor.",
      "Prune dead or badly affected wood during the appropriate dormant-season window for the crop.",
      ...SAFE_FIRST_STEPS.slice(3),
    ],
    severity: "moderate",
  },
  {
    pattern: /rust/i,
    description:
      "The closest supported visual pattern was rust-like. Rust symptoms can overlap with nutrient stress and other leaf diseases, so confirm before treating.",
    organicTreatment: [
      "Remove and dispose of severely affected leaves and keep volunteer host plants under control.",
      "Increase spacing and airflow where possible.",
      ...SAFE_FIRST_STEPS.slice(3),
    ],
    severity: "moderate",
  },
  {
    pattern: /mosaic|yellow_leaf_curl|greening/i,
    description:
      "The closest supported visual pattern was virus-like. Viruses cannot be cured by a spray; vector control and removal of infected plants may be necessary after local confirmation.",
    organicTreatment: [
      "Mark the plant and compare symptoms on new growth before removing it.",
      "Control suspected insect vectors using locally approved integrated-pest-management methods.",
      "Do not take cuttings or save seed from a plant with confirmed viral symptoms.",
      ...SAFE_FIRST_STEPS.slice(3),
    ],
    severity: "urgent",
  },
  {
    pattern: /spider_mites/i,
    description:
      "The closest supported visual pattern was two-spotted spider mite. Mites often increase under hot, dry conditions and can be confused with nutrient stress.",
    organicTreatment: [
      "Inspect leaf undersides and nearby plants; use a strong but gentle water spray where the crop tolerates it.",
      "Reduce dust and heat stress and protect beneficial predators.",
      ...SAFE_FIRST_STEPS.slice(3),
    ],
    severity: "moderate",
  },
];

function humanizeClassId(classId: string): { displayName: string; crop?: string } {
  const [cropPart, diseasePart] = classId.split("___");
  const crop = cropPart?.replace(/_/g, " ").replace(/\(including sour\)/i, "").trim();
  const displayName = (diseasePart ?? classId)
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  return { displayName, crop };
}

function makeTreatment(classId: string): TreatmentInfo {
  const { displayName, crop } = humanizeClassId(classId);
  const matched = GUIDANCE_BY_PATTERN.find(({ pattern }) => pattern.test(classId));

  return {
    classId,
    displayName,
    crop,
    description:
      matched?.description ??
      "The image's closest supported visual pattern is shown here. Several plant problems look alike in a single photograph, so confirm it locally before taking action.",
    organicTreatment: matched?.organicTreatment ?? SAFE_FIRST_STEPS,
    chemicalTreatment: [],
    severity: matched?.severity ?? "moderate",
  };
}

export const TREATMENTS: Record<string, TreatmentInfo> = Object.fromEntries(
  (diseaseClassNames as string[]).map((classId) => [classId, makeTreatment(classId)])
) as Record<string, TreatmentInfo>;

export function getTreatment(classId: string): TreatmentInfo | null {
  return TREATMENTS[classId] ?? null;
}
