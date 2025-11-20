import * as tf from "@tensorflow/tfjs";
import { bundleResourceIO } from "@tensorflow/tfjs-react-native";
import { Asset } from "expo-asset";

const MODEL_JSON = Asset.fromModule(
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("../../assets/models/asl-letter-model/model.json"),
);

const MODEL_WEIGHTS = Asset.fromModule(
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("../../assets/models/asl-letter-model/weights.bin"),
);

export const loadAslModel = async (): Promise<tf.LayersModel> => {
  await MODEL_JSON.downloadAsync();
  await MODEL_WEIGHTS.downloadAsync();

  return tf.loadLayersModel(
    bundleResourceIO(
      MODEL_JSON.localUri ?? MODEL_JSON.uri,
      MODEL_WEIGHTS.localUri ?? MODEL_WEIGHTS.uri,
    ),
  );
};

