import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { APP_NAME } from "@bolantero/shared";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { theme } from "../theme";

export function LoginScreen({
  onAuthed,
  onCreateAccount,
}: {
  onAuthed: () => void;
  onCreateAccount?: () => void;
}) {
  const [mode, setMode] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("rider@bolantero.local");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("+639172222222");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  function switchMode(next: "email" | "phone") {
    setMode(next);
    setError(null);
    setStep("phone");
    setOtp("");
  }

  async function emailLogin() {
    setLoading(true);
    setError(null);
    const { error: signError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (signError) {
      setError(signError.message);
      return;
    }
    onAuthed();
  }

  async function sendOtp() {
    setLoading(true);
    setError(null);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone,
      options: { data: { role: "rider", display_name: "Rider Partner" } },
    });
    setLoading(false);
    if (otpError) {
      setError(otpError.message);
      return;
    }
    setStep("otp");
  }

  async function verify() {
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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ role: "rider" }).eq("id", user.id);
    }
    onAuthed();
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
          <View style={styles.mark}>
            <Text style={styles.markText}>B</Text>
          </View>
          <Text style={styles.kicker}>Partner app</Text>
          <Text style={styles.brand}>{APP_NAME}</Text>
          <Text style={styles.role}>Rider</Text>
          <Text style={styles.heroCopy}>
            Go online for food deliveries, Ride, and Padala across Tacurong, Lambayong, and
            Isulan.
          </Text>
          <View style={styles.chipRow}>
            <View style={styles.chip}>
              <Text style={styles.chipText}>Food</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>Ride</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>Padala</Text>
            </View>
            <View style={styles.chipOutline}>
              <Text style={styles.chipOutlineText}>Motorcycle</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign in to go online</Text>
          <Text style={styles.cardHint}>
            Level 4 riders can accept jobs. Fare split stays visible on every trip.
          </Text>

          <View style={styles.modeRow} accessibilityRole="tablist">
            <Pressable
              style={[styles.modeBtn, mode === "email" && styles.modeActive]}
              onPress={() => switchMode("email")}
              accessibilityRole="tab"
              accessibilityState={{ selected: mode === "email" }}
            >
              <Text style={[styles.modeText, mode === "email" && styles.modeTextOn]}>Email</Text>
            </Pressable>
            <Pressable
              style={[styles.modeBtn, mode === "phone" && styles.modeActive]}
              onPress={() => switchMode("phone")}
              accessibilityRole="tab"
              accessibilityState={{ selected: mode === "phone" }}
            >
              <Text style={[styles.modeText, mode === "phone" && styles.modeTextOn]}>Phone OTP</Text>
            </Pressable>
          </View>

          {mode === "email" ? (
            <>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="username"
                returnKeyType="next"
                placeholder="rider@bolantero.local"
                placeholderTextColor={theme.colors.muted}
              />
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  textContentType="password"
                  returnKeyType="go"
                  onSubmitEditing={emailLogin}
                  placeholder="Password"
                  placeholderTextColor={theme.colors.muted}
                />
                <Pressable
                  style={styles.showBtn}
                  onPress={() => setShowPassword((v) => !v)}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                >
                  <Text style={styles.showText}>{showPassword ? "Hide" : "Show"}</Text>
                </Pressable>
              </View>
              <Pressable
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={emailLogin}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Sign in"
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Sign in</Text>
                )}
              </Pressable>
            </>
          ) : step === "phone" ? (
            <>
              <Text style={styles.label}>Mobile number</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
                placeholder="+63"
                placeholderTextColor={theme.colors.muted}
              />
              <Text style={styles.cardHint}>
                OTP is sent when SMS is configured. Local demo uses email.
              </Text>
              <Pressable
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={sendOtp}
                disabled={loading}
                accessibilityRole="button"
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Send OTP</Text>
                )}
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.label}>OTP code</Text>
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
              <Pressable
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={verify}
                disabled={loading}
                accessibilityRole="button"
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Verify and continue</Text>
                )}
              </Pressable>
              <Pressable onPress={() => setStep("phone")} style={styles.linkWrap} accessibilityRole="button">
                <Text style={styles.link}>Use a different number</Text>
              </Pressable>
            </>
          )}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
        <Text style={styles.footer}>Demo · rider@bolantero.local</Text>
        {onCreateAccount ? (
          <Pressable style={styles.linkWrap} onPress={onCreateAccount} accessibilityRole="button">
            <Text style={styles.link}>Create an account</Text>
          </Pressable>
        ) : null}
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
  mark: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.brand,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.md,
  },
  markText: { color: theme.colors.white, fontWeight: "800", fontSize: 22 },
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
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  chip: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: { color: theme.colors.white, fontSize: 12, fontWeight: "700" },
  chipOutline: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  chipOutlineText: { color: "#c5d4c8", fontSize: 12, fontWeight: "700" },
  card: {
    backgroundColor: theme.colors.bgElevated,
    marginHorizontal: theme.spacing.lg,
    marginTop: -24,
    borderRadius: theme.radii.md,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.brandDeep,
  },
  cardHint: {
    color: theme.colors.muted,
    marginTop: 6,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  modeRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  modeBtn: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.white,
  },
  modeActive: {
    backgroundColor: theme.colors.brand,
    borderColor: theme.colors.brand,
  },
  modeText: { fontWeight: "800", color: theme.colors.brandDeep },
  modeTextOn: { color: theme.colors.white },
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
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    minHeight: 44,
    color: theme.colors.ink,
    fontSize: 16,
  },
  showBtn: { paddingHorizontal: 12, minHeight: 44, justifyContent: "center" },
  showText: { color: theme.colors.brand, fontWeight: "800", fontSize: 13 },
  btn: {
    backgroundColor: theme.colors.brand,
    borderRadius: theme.radii.sm,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: theme.colors.white, fontWeight: "800", fontSize: 16 },
  linkWrap: { marginTop: 14, alignItems: "center" },
  link: { color: theme.colors.brand, fontWeight: "700" },
  error: { color: theme.colors.danger, marginTop: 12, fontWeight: "600" },
  footer: {
    textAlign: "center",
    color: theme.colors.muted,
    marginTop: 18,
    fontSize: 13,
    fontWeight: "600",
  },
});
