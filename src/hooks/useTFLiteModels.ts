import { useTensorflowModel } from "react-native-fast-tflite";
import diseaseClasses from "@/data/disease_class_names.json";
import pestClasses from "@/data/pest_class_names.json";

export function useDiseaseModel() {
  return useTensorflowModel(require("../../assets/models/disease_model.tflite"));
}

export function usePestModel() {
  return useTensorflowModel(require("../../assets/models/pest_model.tflite"));
}

export let diseaseClassNames: string[] = diseaseClasses;
export let pestClassNames: string[] = pestClasses;

export function setClassNames(disease: string[], pest: string[]) {
  diseaseClassNames = disease;
  pestClassNames = pest;
}