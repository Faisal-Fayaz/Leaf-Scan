import { useEffect, useState } from "react";
import { Asset } from "expo-asset";
import {
  loadTensorflowModel,
  type TensorflowPlugin,
} from "react-native-fast-tflite";
import diseaseClasses from "@/data/disease_class_names.json";
import { requireLocalModelUri } from "@/lib/modelAsset";

// Metro needs a static require call to turn this native model into an asset ID.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const diseaseModelSource = require("../../assets/models/disease_model.tflite");

const LOADING_MODEL: TensorflowPlugin = {
  model: undefined,
  state: "loading",
};

type KeyedModelState = {
  retryKey: number;
  modelState: TensorflowPlugin;
};

async function loadBundledDiseaseModel() {
  const [asset] = await Asset.loadAsync(diseaseModelSource);
  const localUri = requireLocalModelUri(asset?.localUri);
  return loadTensorflowModel({ url: localUri }, []);
}

export function useDiseaseModel(retryKey = 0): TensorflowPlugin {
  const [state, setState] = useState<KeyedModelState>({
    retryKey,
    modelState: LOADING_MODEL,
  });

  useEffect(() => {
    let active = true;
    void loadBundledDiseaseModel()
      .then((model) => {
        if (active) {
          setState({ retryKey, modelState: { model, state: "loaded" } });
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        const modelError = error instanceof Error ? error : new Error(String(error));
        console.error("Failed to load the disease model:", modelError);
        setState({
          retryKey,
          modelState: { model: undefined, state: "error", error: modelError },
        });
      });

    return () => {
      active = false;
    };
  }, [retryKey]);

  return state.retryKey === retryKey ? state.modelState : LOADING_MODEL;
}

export const diseaseClassNames: string[] = diseaseClasses;
