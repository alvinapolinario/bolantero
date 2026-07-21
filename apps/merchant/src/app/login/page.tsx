"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { APP_NAME, TAGLINE } from "@bolantero/shared";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("merchant@bolantero.local");
  const [password, setPassword] = useState("password123");
  const [phone, setPhone] = useState("+639171234567");
  const [otp, setOtp] = useState("");
  const [mode, setMode] = useState<"email" | "phone">("email");
  const [step, setStep] = useState<"creds" | "otp">("creds");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onEmailLogin(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: signError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (signError) {
      setError(signError.message);
      return;
    }
    router.replace("/dashboard");
  }

  async function sendOtp(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        data: { role: "merchant", display_name: "Merchant Partner" },
      },
    });
    setLoading(false);
    if (otpError) {
      setError(otpError.message);
      return;
    }
    setStep("otp");
  }

  async function verifyOtp(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
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
    router.replace("/dashboard");
  }

  return (
    <main className="shell" style={{ maxWidth: 520 }}>
      <p className="badge">{APP_NAME}</p>
      <h1 style={{ marginBottom: 8 }}>Merchant Portal</h1>
      <p className="muted">{TAGLINE}</p>
      <div className="card" style={{ marginTop: 24 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button
            className={`btn ${mode === "email" ? "" : "secondary"}`}
            type="button"
            onClick={() => setMode("email")}
          >
            Email
          </button>
          <button
            className={`btn ${mode === "phone" ? "" : "secondary"}`}
            type="button"
            onClick={() => {
              setMode("phone");
              setStep("creds");
            }}
          >
            Phone OTP
          </button>
        </div>

        {mode === "email" ? (
          <form onSubmit={onEmailLogin} style={{ display: "grid", gap: 12 }}>
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button className="btn" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        ) : step === "creds" ? (
          <form onSubmit={sendOtp} style={{ display: "grid", gap: 12 }}>
            <div>
              <label className="label">Mobile (+63)</label>
              <input
                className="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <button className="btn" disabled={loading}>
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} style={{ display: "grid", gap: 12 }}>
            <div>
              <label className="label">OTP Code</label>
              <input
                className="input"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
            <button className="btn" disabled={loading}>
              {loading ? "Verifying..." : "Verify & continue"}
            </button>
          </form>
        )}
        {error ? (
          <p style={{ color: "var(--bol-danger)", marginTop: 12 }}>{error}</p>
        ) : null}
      </div>
    </main>
  );
}
