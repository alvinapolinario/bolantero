export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "rejected",
  "cancelled",
  "completed",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const DELIVERY_STATUSES = [
  "awaiting_rider",
  "assigned",
  "arrived_store",
  "picked_up",
  "delivered",
  "cancelled",
] as const;

export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export const VERIFICATION_STATUSES = [
  "draft",
  "pending",
  "approved",
  "rejected",
] as const;

export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const TRIP_STATUSES = [
  "requested",
  "accepted",
  "arrived_pickup",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export type TripStatus = (typeof TRIP_STATUSES)[number];

export const TRIP_NEXT_STATUS: Partial<Record<TripStatus, TripStatus>> = {
  accepted: "arrived_pickup",
  arrived_pickup: "in_progress",
  in_progress: "completed",
};

export function tripServiceLabel(type: "ride" | "courier"): string {
  return type === "ride" ? "Ride" : "Padala";
}
