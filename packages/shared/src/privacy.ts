/** Registration privacy helpers (RA 10173 / NFR-PRIV-02). Not legal advice. */

export const PRIVACY_NOTICE_VERSION = "2026-08-18";
export const MIN_ACCOUNT_AGE = 18;

export const PRIVACY_PROCESSORS = [
  "Google LLC (Sign in with Google; data may be processed outside the Philippines)",
  "Apple Inc. (Sign in with Apple; Hide My Email supported; data may be processed outside the Philippines)",
  "SMS gateway (one-time passwords to your mobile number)",
  "Supabase (authentication, database, and file storage as our processor)",
] as const;

export const PRIVACY_NOTICE_SUMMARY = `Bolantero is the personal information controller for this app. We collect only what we need to create your account and run food delivery, Ride, and Padala in Tacurong City, Lambayong, and Isulan.

At registration we may receive your name and email from Apple or Google, or your mobile number if you choose OTP. We do not ask for location, contacts, camera, or a government ID on this screen.

Identity documents and a selfie are collected later only if you choose to become Bolantero Verified, so we can confirm you are a real customer or rider. Those files are stored privately and reviewed by authorized admins.

You may access, correct, or request deletion of your account data, subject to legal holds (for example completed trips or payouts). You may complain to the National Privacy Commission.`;

export type RegistrationConsent = {
  ageConfirmed: boolean;
  privacyAccepted: boolean;
  termsAccepted: boolean;
  marketingOptIn: boolean;
};

export const EMPTY_REGISTRATION_CONSENT: RegistrationConsent = {
  ageConfirmed: false,
  privacyAccepted: false,
  termsAccepted: false,
  marketingOptIn: false,
};

export function canContinueRegistration(consent: RegistrationConsent): boolean {
  return consent.ageConfirmed && consent.privacyAccepted && consent.termsAccepted;
}

export function registrationUserMetadata(input: {
  role: "customer" | "rider";
  displayName: string;
  consent: RegistrationConsent;
  noticeVersion?: string;
}) {
  if (!canContinueRegistration(input.consent)) {
    throw new Error("Required registration consents are missing");
  }
  return {
    role: input.role,
    display_name: input.displayName,
    privacy_notice_version: input.noticeVersion ?? PRIVACY_NOTICE_VERSION,
    marketing_opt_in: String(input.consent.marketingOptIn),
    age_confirmed: "true",
  };
}

export function normalizePhMobile(input: string): string {
  const digits = input.replace(/[^\d]/g, "");
  if (digits.startsWith("63") && digits.length === 12) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 11) return `+63${digits.slice(1)}`;
  if (digits.length === 10 && digits.startsWith("9")) return `+63${digits}`;
  if (input.trim().startsWith("+") && digits.startsWith("63")) return `+${digits}`;
  return input.trim();
}

export function isPhMobile(phone: string): boolean {
  return /^\+639\d{9}$/.test(normalizePhMobile(phone));
}

export function oauthUnavailableMessage(provider: "google" | "apple"): string {
  const label = provider === "google" ? "Google" : "Apple";
  return `${label} sign-in is not connected in this environment. Use a Philippine mobile number, or demo email, after the privacy notice.`;
}

export function registrationCopy(role: "customer" | "rider") {
  if (role === "rider") {
    return {
      kicker: "Partner app",
      title: "Create a rider account",
      hero: "One sign-in method. We will ask for a government ID only when you apply to go online.",
      noticeLead:
        "Before we collect an email or mobile number, please confirm you are 18+ and that you have read our Privacy Notice (RA 10173).",
      methodLead: "Choose one way to create your Level 1 account. You can add a PH mobile next if you use Apple or Google.",
      phoneLead: "We use this number so dispatch can reach you. OTP proves you have the phone, not your legal identity.",
      afterSocialLead: "Add a Philippine mobile before you go online. Apple or Google is not a substitute for rider verification.",
    };
  }
  return {
    kicker: "Customer app",
    title: "Create your account",
    hero: "One sign-in method. ID and selfie come later, only if you want to book.",
    noticeLead:
      "Before we collect an email or mobile number, please confirm you are 18+ and that you have read our Privacy Notice (RA 10173).",
    methodLead: "Choose one way to create your Level 1 account. Browse first; verify identity when you are ready to book.",
    phoneLead: "We use this number for trip and order updates. OTP proves you have the phone, not your legal identity.",
    afterSocialLead: "Add a Philippine mobile before you book. Apple or Google is not a substitute for Bolantero Verified.",
  };
}
