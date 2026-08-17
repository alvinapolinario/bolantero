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

export const TRIP_SERVICE_TYPES = ["ride", "courier"] as const;
export type TripServiceType = (typeof TRIP_SERVICE_TYPES)[number];

export const PARCEL_SIZES = ["small", "medium", "large"] as const;
export type ParcelSize = (typeof PARCEL_SIZES)[number];

export const TRIP_PAYEES = ["platform", "rider"] as const;
export type TripPayee = (typeof TRIP_PAYEES)[number];

export const LANDMARKS = [
  {
    serviceAreaCode: "tacurong",
    label: "City Hall",
    line1: "National Highway",
    barangay: "Poblacion",
    city: "Tacurong City",
    lat: 6.6925,
    lng: 124.8472,
  },
  {
    serviceAreaCode: "tacurong",
    label: "Public Market",
    line1: "Bonifacio Street",
    barangay: "Poblacion",
    city: "Tacurong City",
    lat: 6.695,
    lng: 124.85,
  },
  {
    serviceAreaCode: "lambayong",
    label: "Poblacion Center",
    line1: "Municipal Road",
    barangay: "Poblacion",
    city: "Lambayong",
    lat: 6.7889,
    lng: 124.6333,
  },
  {
    serviceAreaCode: "isulan",
    label: "Provincial Capitol area",
    line1: "Provincial Road",
    barangay: "Kalawag",
    city: "Isulan",
    lat: 6.6294,
    lng: 124.605,
  },
] as const;
