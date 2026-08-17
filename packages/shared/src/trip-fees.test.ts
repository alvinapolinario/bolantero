import { describe, expect, it } from "vitest";
import { TRIP_PAYEES } from "./constants";
import { tripRequestSchema } from "./schemas";
import {
  DEFAULT_COURIER_FARE_RULE,
  DEFAULT_RIDE_FARE_RULE,
  calculateTripFare,
} from "./trip-fees";

describe("FR-FEE-05 trip fare split", () => {
  it("fare equals platform fee plus rider earning", () => {
    const result = calculateTripFare({
      distanceKm: 4,
      serviceType: "ride",
      rule: DEFAULT_RIDE_FARE_RULE,
    });
    expect(result.distanceFee).toBe(36);
    expect(result.fare).toBe(76);
    expect(result.platformFee + result.riderEarning).toBe(result.fare);
    expect(result.platformFee).toBe(15.2);
    expect(result.riderEarning).toBe(60.8);
  });

  it("charges base within free km", () => {
    const result = calculateTripFare({
      distanceKm: 0.8,
      serviceType: "ride",
      rule: DEFAULT_RIDE_FARE_RULE,
    });
    expect(result.distanceFee).toBe(0);
    expect(result.fare).toBe(DEFAULT_RIDE_FARE_RULE.baseFee);
  });
});

describe("FR-FEE-04 trip money isolation", () => {
  it("trip payees never include merchant", () => {
    expect(TRIP_PAYEES).toEqual(["platform", "rider"]);
    expect(TRIP_PAYEES.includes("merchant" as never)).toBe(false);
  });

  it("ride ignores parcel size surcharge", () => {
    const plain = calculateTripFare({
      distanceKm: 2,
      serviceType: "ride",
      parcelSize: "large",
      rule: DEFAULT_COURIER_FARE_RULE,
    });
    expect(plain.sizeSurcharge).toBe(0);
  });
});

describe("FR-TRIP-04 padala required fields", () => {
  const rideBase = {
    serviceType: "ride" as const,
    serviceAreaCode: "tacurong" as const,
    pickup: {
      label: "A",
      line1: "National Highway",
      barangay: "Poblacion",
      city: "Tacurong City",
      lat: 6.69,
      lng: 124.84,
    },
    dropoff: {
      label: "B",
      line1: "Bonifacio Street",
      barangay: "Poblacion",
      city: "Tacurong City",
      lat: 6.695,
      lng: 124.85,
    },
    paymentMethod: "cod" as const,
  };

  it("accepts a ride without parcel fields", () => {
    expect(tripRequestSchema.safeParse(rideBase).success).toBe(true);
  });

  it("rejects padala without recipient and item", () => {
    const result = tripRequestSchema.safeParse({
      ...rideBase,
      serviceType: "courier",
    });
    expect(result.success).toBe(false);
  });
});

describe("FR-TRIP-02 padala size surcharge", () => {
  it("adds medium surcharge for courier", () => {
    const result = calculateTripFare({
      distanceKm: 1,
      serviceType: "courier",
      parcelSize: "medium",
      rule: DEFAULT_COURIER_FARE_RULE,
    });
    expect(result.sizeSurcharge).toBe(15);
    expect(result.fare).toBe(64);
    expect(result.platformFee + result.riderEarning).toBe(result.fare);
  });
});
