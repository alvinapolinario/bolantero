"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { APP_NAME } from "@bolantero/shared";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@bolantero.local");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
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

  return (
    <main className="login-page">
      <div className="login-box">
        <p className="login-logo">
          <b>{APP_NAME}</b> Admin
        </p>
        <section className="card">
          <div className="card-body">
            <p className="login-box-msg">Sign in to start your session</p>
            <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
              <div>
                <label className="label">Email</label>
                <input
                  className="input"
                  type="email"
                  autoComplete="username"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Password</label>
                <input
                  className="input"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <button className="btn block" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </button>
              {error ? <p style={{ color: "var(--lte-danger)", margin: 0 }}>{error}</p> : null}
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
