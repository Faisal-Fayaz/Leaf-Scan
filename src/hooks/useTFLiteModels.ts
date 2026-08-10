import { useEffect, useState } from "react";
import {
  loadTensorflowModel,
  type TensorflowPlugin,
} from "react-native-fast-tflite";
import diseaseClasses from "@/data/disease_class_names.json";

const diseaseModelSource = require("../../assets/models/disease_model.tflite");

export function useDiseaseModel(retryKey = 0): TensorflowPlugin {
  const [state, setState] = useState<TensorflowPlugin>({
    model: undefined,
    state: "loading",
  });

  useEffect(() => {
    let active = true;
    setState({ model: undefined, state: "loading" });
    void loadTensorflowModel(diseaseModelSource, [])
      .then((model) => {
        if (active) setState({ model, state: "loaded" });
      })
      .catch((error: unknown) => {
        if (!active) return;
        const modelError = error instanceof Error ? error : new Error(String(error));
        console.error("Failed to load the disease model:", modelError);
        setState({ model: undefined, state: "error", error: modelError });
      });

    return () => {
      active = false;
    };
  }, [retryKey]);

  return state;
}

export const diseaseClassNames: string[] = diseaseClasses;
