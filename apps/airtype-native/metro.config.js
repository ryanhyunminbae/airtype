import { getDefaultConfig } from "expo/metro-config";

const config = getDefaultConfig(__dirname);

if (!config.resolver.assetExts.includes("bin")) {
  config.resolver.assetExts.push("bin");
}

export default config;

