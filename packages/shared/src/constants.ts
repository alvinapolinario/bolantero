export const APP_NAME = "Bolantero";
export const TAGLINE = "Real People. Verified Identities. Trusted Local Delivery.";

export const SERVICE_AREAS = [
  { code: "tacurong", name: "Tacurong City" },
  { code: "lambayong", name: "Lambayong" },
  { code: "isulan", name: "Isulan" },
] as const;

export type ServiceAreaCode = (typeof SERVICE_AREAS)[number]["code"];

export const FOOD_CATEGORIES = [
  { slug: "restaurant", name: "Restaurant" },
  { slug: "bakery", name: "Bakery" },
  { slug: "coffee", name: "Coffee Shops" },
  { slug: "fast-food", name: "Fast Food" },
] as const;

export const DELIVERY_TYPES = [
  "immediate",
  "scheduled",
  "express",
] as const;

export type DeliveryType = (typeof DELIVERY_TYPES)[number];
