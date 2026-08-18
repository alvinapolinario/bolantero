import { describe, expect, it } from "vitest";
import {
  EMPTY_REGISTRATION_CONSENT,
  canContinueRegistration,
  isPhMobile,
  normalizePhMobile,
  registrationUserMetadata,
} from "./privacy";

describe("FR-AUTH-04 / NFR-PRIV-02 registration consent", () => {
  it("blocks continue until age, privacy notice, and terms are accepted", () => {
    expect(canContinueRegistration(EMPTY_REGISTRATION_CONSENT)).toBe(false);
    expect(
      canContinueRegistration({
        ...EMPTY_REGISTRATION_CONSENT,
        ageConfirmed: true,
        privacyAccepted: true,
      }),
    ).toBe(false);
    expect(
      canContinueRegistration({
        ageConfirmed: true,
        privacyAccepted: true,
        termsAccepted: true,
        marketingOptIn: false,
      }),
    ).toBe(true);
  });

  it("keeps marketing optional", () => {
    const required = {
      ageConfirmed: true,
      privacyAccepted: true,
      termsAccepted: true,
      marketingOptIn: false,
    };
    expect(canContinueRegistration(required)).toBe(true);
    const meta = registrationUserMetadata({
      role: "rider",
      displayName: "Rider Partner",
      consent: required,
    });
    expect(meta.marketing_opt_in).toBe("false");
    expect(meta.age_confirmed).toBe("true");
    expect(meta.role).toBe("rider");
  });

  it("refuses metadata without required consents", () => {
    expect(() =>
      registrationUserMetadata({
        role: "customer",
        displayName: "Customer",
        consent: EMPTY_REGISTRATION_CONSENT,
      }),
    ).toThrow(/consents are missing/);
  });
});

describe("FR-AUTH-02 PH mobile", () => {
  it("normalizes local formats to +63", () => {
    expect(normalizePhMobile("09171234567")).toBe("+639171234567");
    expect(normalizePhMobile("9171234567")).toBe("+639171234567");
    expect(normalizePhMobile("+63 917 123 4567")).toBe("+639171234567");
    expect(isPhMobile("09171234567")).toBe(true);
    expect(isPhMobile("+1-555-000-0000")).toBe(false);
  });
});
