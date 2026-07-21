import type { DeliveryType } from "./constants";

export type FeeRule = {
  baseFee: number;
  freeKm: number;
  perKmFee: number;
  expressMultiplier: number;
  scheduledSurcharge: number;
  codHandlingFee: number;
};

export type FeeInput = {
  distanceKm: number;
  deliveryType: DeliveryType;
  paymentMethod: "cod" | "online";
  rule: FeeRule;
};

export type FeeBreakdown = {
  baseFee: number;
  distanceFee: number;
  typeSurcharge: number;
  codFee: number;
  deliveryFee: number;
  platformRevenue: number;
};

export const DEFAULT_FEE_RULE: FeeRule = {
  baseFee: 49,
  freeKm: 2,
  perKmFee: 10,
  expressMultiplier: 1.5,
  scheduledSurcharge: 15,
  codHandlingFee: 10,
};

export function calculateDeliveryFee(input: FeeInput): FeeBreakdown {
  const { distanceKm, deliveryType, paymentMethod, rule } = input;
  const billableKm = Math.max(0, distanceKm - rule.freeKm);
  const distanceFee = billableKm * rule.perKmFee;
  let base = rule.baseFee + distanceFee;

  let typeSurcharge = 0;
  if (deliveryType === "express") {
    typeSurcharge = base * (rule.expressMultiplier - 1);
    base = base * rule.expressMultiplier;
  } else if (deliveryType === "scheduled") {
    typeSurcharge = rule.scheduledSurcharge;
    base += rule.scheduledSurcharge;
  }

  const codFee =
    paymentMethod === "cod" ? rule.codHandlingFee : 0;
  const deliveryFee = roundMoney(base + codFee);

  return {
    baseFee: roundMoney(rule.baseFee),
    distanceFee: roundMoney(distanceFee),
    typeSurcharge: roundMoney(typeSurcharge),
    codFee: roundMoney(codFee),
    deliveryFee,
    platformRevenue: deliveryFee,
  };
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function estimateDistanceKm(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): number {
  const R = 6371;
  const dLat = deg2rad(toLat - fromLat);
  const dLng = deg2rad(toLng - fromLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(fromLat)) *
      Math.cos(deg2rad(toLat)) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}
