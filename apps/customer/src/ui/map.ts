import type { ServiceAreaCode } from "@bolantero/shared";
import { LANDMARKS } from "@bolantero/shared";

export const MAP = {
  land: "#d7e6d8",
  landDark: "#c3d6c6",
  road: "#f4f1ea",
  roadEdge: "#b7c8b8",
  water: "#c5dbe8",
  pinPickup: "#1f5c3a",
  pinDrop: "#c47a2c",
  you: "#2b6cb0",
} as const;

const BOUNDS = {
  minLat: 6.60,
  maxLat: 6.82,
  minLng: 124.58,
  maxLng: 124.88,
};

export type MapPoint = { lat: number; lng: number; label?: string };

export function projectPoint(
  lat: number,
  lng: number,
  width: number,
  height: number,
  pad = 28,
) {
  const x =
    pad +
    ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * (width - pad * 2);
  const y =
    pad +
    (1 - (lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * (height - pad * 2);
  return { x, y };
}

export function landmarksInArea(area: ServiceAreaCode) {
  return LANDMARKS.filter((item) => item.serviceAreaCode === area);
}
