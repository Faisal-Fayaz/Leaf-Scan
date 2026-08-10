import { useTensorflowModel } from "react-native-fast-tflite";
import diseaseClasses from "@/data/disease_class_names.json";

export function useDiseaseModel() {
  return useTensorflowModel(require("../../assets/models/disease_model.tflite"), []);
}

export const diseaseClassNames: string[] = diseaseClasses;
