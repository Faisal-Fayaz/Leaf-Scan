import { useState, useCallback } from "react";
import { useFrameProcessor } from "react-native-vision-camera";
import { useResizePlugin } from "vision-camera-resize-plugin";
import { Worklets } from "react-native-worklets-core";
import type { TensorflowModel } from "react-native-fast-tflite";
import type { Prediction, ScanMode } from "@/types";
import { diseaseClassNames, pestClassNames } from "./useTFLiteModels";
import { predictionFromOutputs } from "@/lib/prediction";
import {
  hasExpectedModelInput,
  MODEL_INPUT_HEIGHT,
  MODEL_INPUT_WIDTH,
  rgbBytesToModelInput,
} from "@/lib/modelInput";

export function useLivePrediction(
  diseaseModel: TensorflowModel | undefined,
  pestModel: TensorflowModel | undefined
) {
  const [livePrediction, setLivePrediction] = useState<Prediction | null>(null);
  const { resize } = useResizePlugin();
  const updatePrediction = useCallback((pred: Prediction) => {
    setLivePrediction(pred);
  }, []);
  const updatePredictionOnJS = Worklets.createRunOnJS(updatePrediction);

  const runModel = (
    model: TensorflowModel | undefined,
    input: Float32Array,
    classNames: string[],
    mode: ScanMode
  ): Prediction | null => {
    "worklet";
    if (model == null || classNames.length === 0 || !hasExpectedModelInput(model)) return null;
    return predictionFromOutputs(model.runSync([input]), classNames, mode);
  };

  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";

      const rgb = resize(frame, {
        scale: { width: MODEL_INPUT_WIDTH, height: MODEL_INPUT_HEIGHT },
        pixelFormat: "rgb",
        dataType: "uint8",
      });
      const input = rgbBytesToModelInput(rgb);

      const diseasePred = runModel(diseaseModel, input, diseaseClassNames, "disease");
      const pestPred = runModel(pestModel, input, pestClassNames, "pest");

      const best =
        diseasePred && pestPred
          ? diseasePred.confidence >= pestPred.confidence
            ? diseasePred
            : pestPred
          : diseasePred ?? pestPred;

      if (best) updatePredictionOnJS(best);
    },
    [diseaseModel, pestModel]
  );

  return { frameProcessor, livePrediction };
}
