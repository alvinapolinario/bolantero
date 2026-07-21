import { describe, expect, it } from "vitest";
import {
  DEFAULT_FEE_RULE,
  calculateDeliveryFee,
  estimateDistanceKm,
} from "./fees";
import { isVerifiedForRole, VERIFICATION_LEVELS } from "./roles";

describe("FR-FEE-01 delivery fee engine", () => {
  it("charges base fee within free km", () => {
    const result = calculateDeliveryFee({
      distanceKm: 1.5,
      deliveryType: "immediate",
      paymentMethod: "online",
      rule: DEFAULT_FEE_RULE,
    });
    expect(result.distanceFee).toBe(0);
    expect(result.deliveryFee).toBe(DEFAULT_FEE_RULE.baseFee);
    expect(result.platformRevenue).toBe(result.deliveryFee);
  });

  it("adds per-km after free threshold", () => {
    const result = calculateDeliveryFee({
      distanceKm: 4,
      deliveryType: "immediate",
      paymentMethod: "online",
      rule: DEFAULT_FEE_RULE,
    });
    expect(result.distanceFee).toBe(20);
    expect(result.deliveryFee).toBe(69);
  });

  it("applies express multiplier and COD fee", () => {
    const result = calculateDeliveryFee({
      distanceKm: 2,
      deliveryType: "express",
      paymentMethod: "cod",
      rule: DEFAULT_FEE_RULE,
    });
    expect(result.codFee).toBe(DEFAULT_FEE_RULE.codHandlingFee);
    expect(result.deliveryFee).toBeGreaterThan(DEFAULT_FEE_RULE.baseFee);
  });

  it("adds scheduled surcharge", () => {
    const immediate = calculateDeliveryFee({
      distanceKm: 2,
      deliveryType: "immediate",
      paymentMethod: "online",
      rule: DEFAULT_FEE_RULE,
    });
    const scheduled = calculateDeliveryFee({
      distanceKm: 2,
      deliveryType: "scheduled",
      paymentMethod: "online",
      rule: DEFAULT_FEE_RULE,
    });
    expect(scheduled.deliveryFee - immediate.deliveryFee).toBe(
      DEFAULT_FEE_RULE.scheduledSurcharge,
    );
  });
});

describe("FR-FEE-02 money invariant helpers", () => {
  it("platform revenue equals delivery fee total only", () => {
    const result = calculateDeliveryFee({
      distanceKm: 5,
      deliveryType: "express",
      paymentMethod: "cod",
      rule: DEFAULT_FEE_RULE,
    });
    expect(result.platformRevenue).toBe(result.deliveryFee);
  });
});

describe("distance estimate", () => {
  it("returns positive km between Tacurong points", () => {
    const km = estimateDistanceKm(6.6925, 124.8472, 6.695, 124.85);
    expect(km).toBeGreaterThan(0);
    expect(km).toBeLessThan(5);
  });
});

describe("FR-KYC verification gates", () => {
  it("requires level 2 for customers", () => {
    expect(isVerifiedForRole("customer", VERIFICATION_LEVELS.REGISTERED)).toBe(
      false,
    );
    expect(
      isVerifiedForRole("customer", VERIFICATION_LEVELS.VERIFIED_CUSTOMER),
    ).toBe(true);
  });

  it("requires level 4 for riders", () => {
    expect(
      isVerifiedForRole("rider", VERIFICATION_LEVELS.VERIFIED_CUSTOMER),
    ).toBe(false);
    expect(isVerifiedForRole("rider", VERIFICATION_LEVELS.VERIFIED_RIDER)).toBe(
      true,
    );
  });
});
