import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { APP_NAME } from "@bolantero/shared";
import {
  EMPTY_REGISTRATION_CONSENT,
  MIN_ACCOUNT_AGE,
  PRIVACY_NOTICE_SUMMARY,
  PRIVACY_NOTICE_VERSION,
  PRIVACY_PROCESSORS,
  canContinueRegistration,
  isPhMobile,
  normalizePhMobile,
  oauthUnavailableMessage,
  registrationCopy,
  registrationUserMetadata,
  type RegistrationConsent,
} from "@bolantero/shared";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { theme } from "../theme";

const copy = registrationCopy("customer");

function ConsentRow({
  checked,
  onToggle,
  label,
  optional,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
  optional?: boolean;
}) {
  return (
    <Pressable
      style={styles.consentRow}
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
    >
      <View style={[styles.box, checked && styles.boxOn]}>
        {checked ? <Text style={styles.boxMark}>✓</Text> : null}
      </View>
      <Text style={styles.consentLabel}>
        {label}
        {optional ? <Text style={styles.optional}> (optional)</Text> : null}
      </Text>
    </Pressable>
  );
}

export function RegisterScreen({
  onAuthed,
  onHaveAccount,
}: {
  onAuthed: () => void;
  onHaveAccount: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<"notice" | "method" | "phone" | "otp" | "email">("notice");
  const [afterSocial, setAfterSocial] = useState(false);
  const [consent, setConsent] = useState<RegistrationConsent>(EMPTY_REGISTRATION_CONSENT);
  const [showNotice, setShowNotice] = useState(false);
  const [phone, setPhone] = useState("+63");
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const metadata = () =>
    registrationUserMetadata({
      role: "customer",
      displayName: "Customer",
      consent,
    });

  async function persistConsent(verifiedPhone?: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const now = new Date().toISOString();
    await supabase
      .from("profiles")
      .update({
        privacy_notice_version: PRIVACY_NOTICE_VERSION,
        privacy_accepted_at: now,
        terms_accepted_at: now,
        age_confirmed_at: now,
        marketing_opt_in: consent.marketingOptIn,
        ...(verifiedPhone
          ? { phone: verifiedPhone, phone_verified_at: now }
          : {}),
      })
      .eq("id", user.id);
  }

  async function finish(verifiedPhone?: string) {
    await persistConsent(verifiedPhone);
    onAuthed();
  }

  async function sendOtp() {
    const normalized = normalizePhMobile(phone);
    if (!isPhMobile(normalized)) {
      setError("Enter a Philippine mobile like +63917…");
      return;
    }
    setLoading(true);
    setError(null);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: normalized,
      options: { data: metadata() },
    });
    setLoading(false);
    if (otpError) {
      setError(otpError.message);
      return;
    }
    setPhone(normalized);
    setStep("otp");
  }

  async function verifyOtp() {
    setLoading(true);
    setError(null);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: "sms",
    });
    setLoading(false);
    if (verifyError) {
      setError(verifyError.message);
      return;
    }
    await finish(phone);
  }

  async function social(provider: "google" | "apple") {
    setLoading(true);
    setError(null);
    const redirectTo = Platform.OS === "web" && typeof window !== "undefined" ? window.location.origin : undefined;
    const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        skipBrowserRedirect: Platform.OS !== "web",
        scopes: provider === "google" ? "openid email profile" : undefined,
        queryParams: provider === "google" ? { prompt: "select_account" } : undefined,
      },
    });
    if (oauthError || !data?.url) {
      setLoading(false);
      setError(oauthUnavailableMessage(provider));
      return;
    }
    if (Platform.OS !== "web") {
      await Linking.openURL(data.url);
    }
    setLoading(false);
    setAfterSocial(true);
    setStep("phone");
  }

  async function emailRegister() {
    setLoading(true);
    setError(null);
    const { data, error: signError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata() },
    });
    setLoading(false);
    if (signError) {
      setError(signError.message);
      return;
    }
    if (!data.session) {
      setError("Account created. Confirm email if required, then sign in.");
      return;
    }
    await finish();
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scroll, { paddingBottom: 28 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.hero, { paddingTop: Math.max(insets.top, 16) + 8 }]}>
          <Text style={styles.kicker}>{copy.kicker}</Text>
          <Text style={styles.brand}>{APP_NAME}</Text>
          <Text style={styles.role}>Create account</Text>
          <Text style={styles.heroCopy}>{copy.hero}</Text>
        </View>

        <View style={styles.card}>
          {step === "notice" ? (
            <>
              <Text style={styles.cardTitle}>Privacy first</Text>
              <Text style={styles.cardHint}>{copy.noticeLead}</Text>
              <ConsentRow
                checked={consent.ageConfirmed}
                onToggle={() => setConsent((c) => ({ ...c, ageConfirmed: !c.ageConfirmed }))}
                label={`I am ${MIN_ACCOUNT_AGE} or older`}
              />
              <ConsentRow
                checked={consent.privacyAccepted}
                onToggle={() => setConsent((c) => ({ ...c, privacyAccepted: !c.privacyAccepted }))}
                label={`I have read Privacy Notice ${PRIVACY_NOTICE_VERSION}`}
              />
              <ConsentRow
                checked={consent.termsAccepted}
                onToggle={() => setConsent((c) => ({ ...c, termsAccepted: !c.termsAccepted }))}
                label="I agree to the Terms of Use"
              />
              <ConsentRow
                checked={consent.marketingOptIn}
                onToggle={() => setConsent((c) => ({ ...c, marketingOptIn: !c.marketingOptIn }))}
                label="Send me service tips (not required to create an account)"
                optional
              />
              <Pressable onPress={() => setShowNotice((v) => !v)} style={styles.linkWrap} accessibilityRole="button">
                <Text style={styles.link}>{showNotice ? "Hide notice" : "Read short Privacy Notice"}</Text>
              </Pressable>
              {showNotice ? (
                <View style={styles.noticeBox}>
                  <Text style={styles.noticeBody}>{PRIVACY_NOTICE_SUMMARY}</Text>
                  <Text style={styles.noticeSub}>Who else may process your data</Text>
                  {PRIVACY_PROCESSORS.map((item) => (
                    <Text key={item} style={styles.noticeItem}>
                      • {item}
                    </Text>
                  ))}
                </View>
              ) : null}
              <Pressable
                style={[styles.btn, !canContinueRegistration(consent) && styles.btnDisabled]}
                disabled={!canContinueRegistration(consent)}
                onPress={() => {
                  setError(null);
                  setStep("method");
                }}
              >
                <Text style={styles.btnText}>Continue</Text>
              </Pressable>
            </>
          ) : null}

          {step === "method" ? (
            <>
              <Text style={styles.cardTitle}>{copy.title}</Text>
              <Text style={styles.cardHint}>{copy.methodLead}</Text>
              <Pressable style={styles.socialBtn} onPress={() => social("apple")} disabled={loading}>
                <Text style={styles.socialText}>Continue with Apple</Text>
              </Pressable>
              <Pressable style={styles.socialBtn} onPress={() => social("google")} disabled={loading}>
                {loading ? <ActivityIndicator /> : <Text style={styles.socialText}>Continue with Google</Text>}
              </Pressable>
              <Pressable
                style={styles.btn}
                onPress={() => {
                  setAfterSocial(false);
                  setStep("phone");
                  setError(null);
                }}
              >
                <Text style={styles.btnText}>Continue with mobile number</Text>
              </Pressable>
              <Pressable
                style={styles.linkWrap}
                onPress={() => {
                  setStep("email");
                  setError(null);
                }}
              >
                <Text style={styles.link}>Use email (demo fallback)</Text>
              </Pressable>
              <Pressable style={styles.linkWrap} onPress={() => setStep("notice")}>
                <Text style={styles.mutedLink}>Back to privacy notice</Text>
              </Pressable>
            </>
          ) : null}

          {step === "phone" ? (
            <>
              <Text style={styles.cardTitle}>{afterSocial ? "Add your mobile" : "Philippine mobile"}</Text>
              <Text style={styles.cardHint}>{afterSocial ? copy.afterSocialLead : copy.phoneLead}</Text>
              <Text style={styles.label}>Mobile number</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoComplete="tel"
                placeholder="+63917…"
                placeholderTextColor={theme.colors.muted}
              />
              <Pressable style={[styles.btn, loading && styles.btnDisabled]} onPress={sendOtp} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send OTP</Text>}
              </Pressable>
              <Pressable
                style={styles.linkWrap}
                onPress={() => {
                  setStep("method");
                  setAfterSocial(false);
                  setError(null);
                }}
              >
                <Text style={styles.link}>Choose a different method</Text>
              </Pressable>
            </>
          ) : null}

          {step === "otp" ? (
            <>
              <Text style={styles.cardTitle}>Enter the code</Text>
              <Text style={styles.cardHint}>Sent to {phone}. Local demo needs SMS configured.</Text>
              <TextInput
                style={styles.input}
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                maxLength={8}
                placeholder="6-digit code"
                placeholderTextColor={theme.colors.muted}
              />
              <Pressable style={[styles.btn, loading && styles.btnDisabled]} onPress={verifyOtp} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Verify number</Text>}
              </Pressable>
              <Pressable style={styles.linkWrap} onPress={() => setStep("phone")}>
                <Text style={styles.link}>Use a different number</Text>
              </Pressable>
            </>
          ) : null}

          {step === "email" ? (
            <>
              <Text style={styles.cardTitle}>Demo email</Text>
              <Text style={styles.cardHint}>
                For local development when Apple, Google, or SMS are not connected. Same privacy consents apply.
              </Text>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="you@bolantero.local"
                placeholderTextColor={theme.colors.muted}
              />
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholder="At least 8 characters"
                  placeholderTextColor={theme.colors.muted}
                />
                <Pressable style={styles.showBtn} onPress={() => setShowPassword((v) => !v)}>
                  <Text style={styles.showText}>{showPassword ? "Hide" : "Show"}</Text>
                </Pressable>
              </View>
              <Pressable style={[styles.btn, loading && styles.btnDisabled]} onPress={emailRegister} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create account</Text>}
              </Pressable>
              <Pressable style={styles.linkWrap} onPress={() => setStep("method")}>
                <Text style={styles.link}>Back to Apple, Google, or mobile</Text>
              </Pressable>
            </>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable style={styles.linkWrap} onPress={onHaveAccount} accessibilityRole="button">
            <Text style={styles.mutedLink}>Already have an account? Sign in</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.bg },
  scroll: { flexGrow: 1 },
  hero: {
    backgroundColor: theme.colors.brandDeep,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 48,
  },
  kicker: {
    color: "#c5d4c8",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  brand: { color: theme.colors.white, fontSize: 32, fontWeight: "800" },
  role: { color: theme.colors.accent, fontSize: 22, fontWeight: "700", marginTop: 2 },
  heroCopy: { color: "#d7e3da", marginTop: 12, lineHeight: 22, maxWidth: 360 },
  card: {
    backgroundColor: theme.colors.bgElevated,
    marginHorizontal: theme.spacing.lg,
    marginTop: -24,
    borderRadius: theme.radii.md,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  cardTitle: { fontSize: 18, fontWeight: "800", color: theme.colors.brandDeep },
  cardHint: {
    color: theme.colors.muted,
    marginTop: 6,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  consentRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  boxOn: { backgroundColor: theme.colors.brand, borderColor: theme.colors.brand },
  boxMark: { color: theme.colors.white, fontWeight: "800", fontSize: 12 },
  consentLabel: { flex: 1, color: theme.colors.ink, lineHeight: 20, fontWeight: "600" },
  optional: { color: theme.colors.muted, fontWeight: "600" },
  noticeBox: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: 12,
    marginBottom: 16,
  },
  noticeBody: { color: theme.colors.ink, lineHeight: 20, fontSize: 13 },
  noticeSub: { marginTop: 12, fontWeight: "800", color: theme.colors.brandDeep, fontSize: 13 },
  noticeItem: { color: theme.colors.muted, marginTop: 6, lineHeight: 18, fontSize: 12 },
  socialBtn: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: theme.radii.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.white,
    marginBottom: 10,
  },
  socialText: { fontWeight: "800", color: theme.colors.brandDeep, fontSize: 16 },
  label: { color: theme.colors.muted, fontWeight: "700", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: theme.radii.sm,
    paddingHorizontal: 12,
    minHeight: 44,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.white,
    color: theme.colors.ink,
    fontSize: 16,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.white,
    marginBottom: theme.spacing.md,
    minHeight: 44,
  },
  passwordInput: { flex: 1, paddingHorizontal: 12, minHeight: 44, color: theme.colors.ink, fontSize: 16 },
  showBtn: { paddingHorizontal: 12, minHeight: 44, justifyContent: "center" },
  showText: { color: theme.colors.brand, fontWeight: "800", fontSize: 13 },
  btn: {
    backgroundColor: theme.colors.brand,
    borderRadius: theme.radii.sm,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.45 },
  btnText: { color: theme.colors.white, fontWeight: "800", fontSize: 16 },
  linkWrap: { marginTop: 14, alignItems: "center" },
  link: { color: theme.colors.brand, fontWeight: "700" },
  mutedLink: { color: theme.colors.muted, fontWeight: "600" },
  error: { color: theme.colors.danger, marginTop: 12, fontWeight: "600" },
});
