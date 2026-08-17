import { estimateDistanceKm, roundMoney } from "./fees";
import type { ParcelSize, TripServiceType } from "./constants";

export type TripFareRule = {
  baseFee: number;
  freeKm: number;
  perKmFee: number;
  smallSurcharge: number;
  mediumSurcharge: number;
  largeSurcharge: number;
  platformFeeBps: number;
};

export type TripFeeInput = {
  distanceKm: number;
  serviceType: TripServiceType;
  parcelSize?: ParcelSize | null;
  rule: TripFareRule;
};

export type TripFareBreakdown = {
  baseFee: number;
  distanceFee: number;
  sizeSurcharge: number;
  fare: number;
  platformFee: number;
  riderEarning: number;
};

export const DEFAULT_RIDE_FARE_RULE: TripFareRule = {
  baseFee: 40,
  freeKm: 1,
  perKmFee: 12,
  smallSurcharge: 0,
  mediumSurcharge: 0,
  largeSurcharge: 0,
  platformFeeBps: 2000,
};

export const DEFAULT_COURIER_FARE_RULE: TripFareRule = {
  baseFee: 49,
  freeKm: 1,
  perKmFee: 15,
  smallSurcharge: 0,
  mediumSurcharge: 15,
  largeSurcharge: 30,
  platformFeeBps: 2000,
};

export function sizeSurcharge(
  serviceType: TripServiceType,
  parcelSize: ParcelSize | null | undefined,
  rule: TripFareRule,
): number {
  if (serviceType !== "courier" || !parcelSize) return 0;
  if (parcelSize === "medium") return rule.mediumSurcharge;
  if (parcelSize === "large") return rule.largeSurcharge;
  return rule.smallSurcharge;
}

export function calculateTripFare(input: TripFeeInput): TripFareBreakdown {
  const { distanceKm, serviceType, parcelSize, rule } = input;
  const billableKm = Math.max(0, distanceKm - rule.freeKm);
  const distanceFee = billableKm * rule.perKmFee;
  const surcharge = sizeSurcharge(serviceType, parcelSize, rule);
  const fare = roundMoney(rule.baseFee + distanceFee + surcharge);
  const platformFee = roundMoney((fare * rule.platformFeeBps) / 10000);
  const riderEarning = roundMoney(fare - platformFee);

  return {
    baseFee: roundMoney(rule.baseFee),
    distanceFee: roundMoney(distanceFee),
    sizeSurcharge: roundMoney(surcharge),
    fare,
    platformFee,
    riderEarning,
  };
}

export function estimateTripDistanceKm(
  pickupLat: number,
  pickupLng: number,
  dropoffLat: number,
  dropoffLng: number,
): number {
  return estimateDistanceKm(pickupLat, pickupLng, dropoffLat, dropoffLng);
}

export function defaultRuleForService(serviceType: TripServiceType): TripFareRule {
  return serviceType === "courier"
    ? DEFAULT_COURIER_FARE_RULE
    : DEFAULT_RIDE_FARE_RULE;
}
