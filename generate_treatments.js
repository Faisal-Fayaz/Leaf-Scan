const fs = require('fs');
const path = require('path');

const diseasePath = path.join(__dirname, 'src/data/disease_class_names.json');
const pestPath = path.join(__dirname, 'src/data/pest_class_names.json');
const treatmentsPath = path.join(__dirname, 'src/data/treatments.ts');

const diseaseClasses = JSON.parse(fs.readFileSync(diseasePath, 'utf8'));
const pestClasses = JSON.parse(fs.readFileSync(pestPath, 'utf8'));

console.log(`Disease classes: ${diseaseClasses.length}`);
console.log(`Pest classes: ${pestClasses.length}`);

const generateTreatment = (classId, displayName, crop) => {
  return {
    classId,
    displayName,
    crop,
    description: `Description for ${displayName} on ${crop}. This is a placeholder description that should be replaced with accurate information.`,
    organicTreatment: [
      `Organic treatment 1 for ${displayName}`,
      `Organic treatment 2 for ${displayName}`,
      `Organic treatment 3 for ${displayName}`,
    ],
    chemicalTreatment: [
      `Chemical treatment 1 for ${displayName}`,
      `Chemical treatment 2 for ${displayName}`,
    ],
    severity: 'moderate', // default, can be info, moderate, urgent
  };
};

const treatments = {};

// Add existing treatments from the file to preserve them
const existingTreatments = {
  "Tomato___Late_blight": {
    classId: "Tomato___Late_blight",
    displayName: "Late Blight",
    crop: "Tomato",
    description:
      "A fungal disease that spreads fast in cool, wet weather. Look for dark, water-soaked spots on leaves that turn brown and papery.",
    organicTreatment: [
      "Remove and destroy infected leaves immediately",
      "Apply copper-based fungicide spray weekly",
      "Improve airflow by spacing plants and pruning lower leaves",
      "Avoid overhead watering — water at the base",
    ],
    chemicalTreatment: ["Chlorothalonil or mancozeb-based fungicides per label instructions"],
    severity: "urgent",
  },
  "Tomato___healthy": {
    classId: "Tomato___healthy",
    displayName: "Healthy",
    crop: "Tomato",
    description: "No signs of disease detected on this leaf.",
    organicTreatment: ["Continue regular monitoring", "Maintain good spacing and airflow"],
    chemicalTreatment: [],
    severity: "info",
  },
  "Potato___Early_blight": {
    classId: "Potato___Early_blight",
    displayName: "Early Blight",
    crop: "Potato",
    description:
      "Fungal disease causing concentric dark rings on older leaves first, spreading upward over time.",
    organicTreatment: [
      "Remove infected foliage",
      "Apply neem oil or copper fungicide every 7-10 days",
      "Rotate crops — avoid planting potatoes/tomatoes in the same spot next season",
    ],
    chemicalTreatment: ["Chlorothalonil-based fungicide"],
    severity: "moderate",
  },
};

// Copy existing treatments
for (const [key, value] of Object.entries(existingTreatments)) {
  treatments[key] = value;
}

// Add treatments for disease classes
for (const classId of diseaseClasses) {
  if (!treatments[classId]) {
    // Extract crop and disease name from classId format: "Crop___Disease"
    const parts = classId.split('___');
    const crop = parts[0];
    let diseaseName = parts[1];
    // Replace underscores with spaces and handle special cases
    diseaseName = diseaseName.replace(/_/g, ' ');
    // Handle special naming like "Cherry_(including_sour)" -> "Cherry (including sour)"
    if (diseaseName.includes('_(including')) {
      diseaseName = diseaseName.replace('_(', ' (').replace(')_', ') ');
    }
    treatments[classId] = generateTreatment(classId, diseaseName, crop);
  }
}

// Add treatments for pest classes
for (const classId of pestClasses) {
  if (!treatments[classId]) {
    // Pest class IDs are numeric strings like "0", "1", etc.
    // We don't have a mapping to pest names, so we'll use a generic name.
    treatments[classId] = {
      classId,
      displayName: `Pest ${classId}`,
      crop: "Various", // pests can affect multiple crops
      description: `Description for pest ${classId}. This is a placeholder description that should be replaced with accurate information.`,
      organicTreatment: [
        `Organic treatment 1 for pest ${classId}`,
        `Organic treatment 2 for pest ${classId}`,
        `Organic treatment 3 for pest ${classId}`,
      ],
      chemicalTreatment: [
        `Chemical treatment 1 for pest ${classId}`,
        `Chemical treatment 2 for pest ${classId}`,
      ],
      severity: "moderate",
    };
  }
}

// Write the treatments file
let output = `export const TREATMENTS: Record<string, TreatmentInfo> = {\n`;
const entries = Object.entries(treatments);
for (let i = 0; i < entries.length; i++) {
  const [classId, treatment] = entries[i];
  output += `  ${JSON.stringify(classId)}: {\n`;
  output += `    classId: ${JSON.stringify(treatment.classId)},\n`;
  output += `    displayName: ${JSON.stringify(treatment.displayName)},\n`;
  output += `    crop: ${JSON.stringify(treatment.crop)},\n`;
  output += `    description: ${JSON.stringify(treatment.description)},\n`;
  output += `    organicTreatment: ${JSON.stringify(treatment.organicTreatment)},\n`;
  output += `    chemicalTreatment: ${JSON.stringify(treatment.chemicalTreatment)},\n`;
  output += `    severity: ${JSON.stringify(treatment.severity)},\n`;
  output += `  }${i === entries.length - 1 ? '\n' : ',\n'}`;
}
output += `};\n\nexport function getTreatment(classId: string): TreatmentInfo | null {\n  return TREATMENTS[classId] ?? null;\n}\n`;

fs.writeFileSync(treatmentsPath, output, 'utf8');
console.log(`Generated treatments for ${Object.keys(treatments).length} classes`);
