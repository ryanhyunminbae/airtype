import { useCallback, useEffect } from "react";
import type { MutableRefObject } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Camera, CameraType } from "expo-camera";
import type { HandDetection } from "../types";
import GestureOverlay from "./GestureOverlay";

type CameraPreviewProps = {
  detection: HandDetection | null;
  disabled?: boolean;
  cameraRef: MutableRefObject<Camera | null>;
};

const CameraPreview = ({ detection, disabled, cameraRef }: CameraPreviewProps) => {
  const [permission, requestPermission] = Camera.useCameraPermissions();

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleRequestPermission = useCallback(() => {
    requestPermission();
  }, [requestPermission]);

  const permissionDenied = permission && !permission.granted;

  return (
    <View style={styles.wrapper}>
      <View style={styles.cameraContainer}>
        {permission?.granted ? (
          <>
            <Camera
              ref={(ref) => {
                cameraRef.current = ref;
              }}
              style={StyleSheet.absoluteFill}
              type={CameraType.front}
            />
            <GestureOverlay detection={detection} />
            {disabled && (
              <View style={styles.overlay}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.overlayText}>Initializing pipeline…</Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.permissionPrompt}>
            {permissionDenied ? (
              <>
                <Text style={styles.permissionTitle}>Camera access needed</Text>
                <Text style={styles.permissionBody}>
                  Allow camera access to visualize your hand landmarks and capture gestures.
                </Text>
                <Pressable style={styles.permissionButton} onPress={handleRequestPermission}>
                  <Text style={styles.permissionButtonText}>Grant Permission</Text>
                </Pressable>
              </>
            ) : (
              <>
                <ActivityIndicator size="large" color="#0ea5e9" />
                <Text style={styles.permissionBody}>
                  Requesting camera access…
                </Text>
              </>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
  },
  cameraContainer: {
    position: "relative",
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#0f172a",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  overlayText: {
    color: "#fff",
    marginTop: 12,
    fontWeight: "600",
  },
  permissionPrompt: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  permissionBody: {
    textAlign: "center",
    color: "#475569",
  },
  permissionButton: {
    backgroundColor: "#0f172a",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
  },
  permissionButtonText: {
    color: "#fff",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
});

export default CameraPreview;

