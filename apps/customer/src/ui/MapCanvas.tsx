import { useState } from "react";
import { LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import type { ServiceAreaCode } from "@bolantero/shared";
import { LANDMARKS } from "@bolantero/shared";
import { MAP, projectPoint, type MapPoint } from "./map";

export function MapCanvas({
  area,
  pickup,
  dropoff,
}: {
  area: ServiceAreaCode;
  pickup?: MapPoint | null;
  dropoff?: MapPoint | null;
}) {
  const [{ width, height }, setSize] = useState({ width: 0, height: 0 });

  function onLayout(event: LayoutChangeEvent) {
    const { width: nextW, height: nextH } = event.nativeEvent.layout;
    if (nextW !== width || nextH !== height) setSize({ width: nextW, height: nextH });
  }

  const ready = width > 0 && height > 0;
  const pins = LANDMARKS.filter((item) => item.serviceAreaCode === area);

  return (
    <View style={styles.canvas} onLayout={onLayout}>
      <View style={[styles.blob, styles.blobA]} />
      <View style={[styles.blob, styles.blobB]} />
      <View style={[styles.blob, styles.blobC]} />
      <View style={styles.roadH} />
      <View style={styles.roadV} />
      <View style={styles.roadDiag} />
      <Text style={styles.city}>
        {area === "tacurong" ? "Tacurong" : area === "lambayong" ? "Lambayong" : "Isulan"}
      </Text>
      {ready
        ? pins.map((pin) => {
            const { x, y } = projectPoint(pin.lat, pin.lng, width, height);
            return (
              <View key={pin.label} style={[styles.dot, { left: x - 4, top: y - 4 }]} />
            );
          })
        : null}
      {ready && pickup ? (
        <Pin x={projectPoint(pickup.lat, pickup.lng, width, height).x} y={projectPoint(pickup.lat, pickup.lng, width, height).y} color={MAP.pinPickup} label="A" />
      ) : null}
      {ready && dropoff ? (
        <Pin x={projectPoint(dropoff.lat, dropoff.lng, width, height).x} y={projectPoint(dropoff.lat, dropoff.lng, width, height).y} color={MAP.pinDrop} label="B" />
      ) : null}
    </View>
  );
}

function Pin({ x, y, color, label }: { x: number; y: number; color: string; label: string }) {
  return (
    <View style={[styles.pinWrap, { left: x - 12, top: y - 28 }]}>
      <View style={[styles.pin, { backgroundColor: color }]}>
        <Text style={styles.pinText}>{label}</Text>
      </View>
      <View style={[styles.pinStem, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: MAP.land,
    overflow: "hidden",
  },
  blob: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: MAP.landDark,
    opacity: 0.55,
  },
  blobA: { width: 220, height: 180, left: -40, top: 80 },
  blobB: { width: 160, height: 160, right: 20, top: 40, backgroundColor: MAP.water },
  blobC: { width: 280, height: 200, right: -60, bottom: 120 },
  roadH: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "42%",
    height: 10,
    backgroundColor: MAP.road,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: MAP.roadEdge,
  },
  roadV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "38%",
    width: 10,
    backgroundColor: MAP.road,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: MAP.roadEdge,
  },
  roadDiag: {
    position: "absolute",
    top: "18%",
    left: -40,
    width: "140%",
    height: 8,
    backgroundColor: MAP.road,
    transform: [{ rotate: "-18deg" }],
    opacity: 0.9,
  },
  city: {
    position: "absolute",
    top: 18,
    right: 16,
    color: "#3d5243",
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    fontSize: 11,
  },
  dot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#6b7f6e",
  },
  pinWrap: { position: "absolute", alignItems: "center", width: 24 },
  pin: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  pinText: { color: "#fff", fontWeight: "800", fontSize: 11 },
  pinStem: { width: 3, height: 10, marginTop: -2 },
});
