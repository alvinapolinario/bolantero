export const USER_ROLES = [
  "customer",
  "merchant",
  "rider",
  "admin",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const VERIFICATION_LEVELS = {
  REGISTERED: 1,
  VERIFIED_CUSTOMER: 2,
  VERIFIED_MERCHANT: 3,
  VERIFIED_RIDER: 4,
} as const;

export type VerificationLevel =
  (typeof VERIFICATION_LEVELS)[keyof typeof VERIFICATION_LEVELS];

export function isVerifiedForRole(
  role: UserRole,
  level: number,
): boolean {
  switch (role) {
    case "customer":
      return level >= VERIFICATION_LEVELS.VERIFIED_CUSTOMER;
    case "merchant":
      return level >= VERIFICATION_LEVELS.VERIFIED_MERCHANT;
    case "rider":
      return level >= VERIFICATION_LEVELS.VERIFIED_RIDER;
    case "admin":
      return true;
    default:
      return false;
  }
}

export function verifiedBadgeLabel(level: number): string | null {
  if (level >= VERIFICATION_LEVELS.VERIFIED_CUSTOMER) {
    return "Bolantero Verified";
  }
  return null;
}
