import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { APP_NAME, TAGLINE } from "@bolantero/shared";
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
  const [email, setEmail] = useState("customer@bolantero.local");
  const [password, setPassword] = useState("password123");
  const [phone, setPhone] = useState("+639171111111");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      options: { data: { role: "customer", display_name: "Customer" } },
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
    onAuthed();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>{APP_NAME}</Text>
      <Text style={styles.tagline}>{TAGLINE}</Text>
      <View style={styles.card}>
        <View style={styles.modeRow}>
          <Pressable
            style={[styles.modeBtn, mode === "email" && styles.modeActive]}
            onPress={() => setMode("email")}
          >
            <Text style={styles.modeText}>Email</Text>
          </Pressable>
          <Pressable
            style={[styles.modeBtn, mode === "phone" && styles.modeActive]}
            onPress={() => setMode("phone")}
          >
            <Text style={styles.modeText}>Phone OTP</Text>
          </Pressable>
        </View>

        {mode === "email" ? (
          <>
            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" />
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <Pressable style={styles.btn} onPress={emailLogin} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sign in</Text>}
            </Pressable>
          </>
        ) : step === "phone" ? (
          <>
            <Text style={styles.label}>Mobile number</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} />
            <Pressable style={styles.btn} onPress={sendOtp} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send OTP</Text>}
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.label}>OTP code</Text>
            <TextInput style={styles.input} value={otp} onChangeText={setOtp} keyboardType="number-pad" />
            <Pressable style={styles.btn} onPress={verify} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Verify</Text>}
            </Pressable>
          </>
        )}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {onCreateAccount ? (
          <Pressable style={styles.createWrap} onPress={onCreateAccount}>
            <Text style={styles.createLink}>Create an account</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f5f3",
    padding: theme.spacing.lg,
    justifyContent: "center",
  },
  brand: {
    fontSize: 40,
    color: theme.colors.brandDeep,
    fontWeight: "800",
  },
  tagline: {
    color: theme.colors.muted,
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.sm,
  },
  card: {
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.radii.md,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  modeRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  modeBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  modeActive: { backgroundColor: "#e4efe7", borderColor: theme.colors.brand },
  modeText: { fontWeight: "800", color: theme.colors.brandDeep },
  label: {
    color: theme.colors.muted,
    fontWeight: "700",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: theme.radii.sm,
    padding: 12,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.white,
  },
  btn: {
    backgroundColor: theme.colors.brand,
    borderRadius: theme.radii.sm,
    padding: 14,
    alignItems: "center",
  },
  btnText: { color: theme.colors.white, fontWeight: "800" },
  error: { color: theme.colors.danger, marginTop: 12 },
  createWrap: { marginTop: 16, alignItems: "center" },
  createLink: { color: theme.colors.brand, fontWeight: "700" },
});
