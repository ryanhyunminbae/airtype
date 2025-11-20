import * as tf from "@tensorflow/tfjs";
import { bundleResourceIO } from "@tensorflow/tfjs-react-native";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const MODEL_JSON = require("../../assets/models/asl-letter-model/model.json");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const MODEL_WEIGHTS = require("../../assets/models/asl-letter-model/weights.bin");

export const loadAslModel = async (): Promise<tf.LayersModel> => {
  return tf.loadLayersModel(bundleResourceIO(MODEL_JSON, MODEL_WEIGHTS));
};

