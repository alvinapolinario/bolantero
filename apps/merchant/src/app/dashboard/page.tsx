"use client";

import { useEffect, useState } from "react";
import { verifiedBadgeLabel } from "@bolantero/shared";
import type { Tables } from "@bolantero/database";
import { Shell } from "@/components/Shell";
import { createClient } from "@/lib/supabase/client";

type Merchant = Tables<"merchants">;
type Profile = Tables<"profiles">;

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Sign in to manage your store.");
        return;
      }
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      setProfile(profileData);

      const { data: merchantData } = await supabase
        .from("merchants")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();
      setMerchant(merchantData);

      if (merchantData) {
        const { count } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("merchant_id", merchantData.id)
          .eq("status", "pending");
        setPendingOrders(count ?? 0);
      }
    })();
  }, []);

  const badge = profile
    ? verifiedBadgeLabel(profile.verification_level)
    : null;

  return (
    <Shell title="Store dashboard">
      {error ? <p className="card">{error}</p> : null}
      <div className="grid-2">
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Business</h2>
          {merchant ? (
            <>
              <p style={{ marginBottom: 4, fontWeight: 700 }}>{merchant.name}</p>
              <p className="muted">
                {merchant.service_area_code} · {merchant.status}
              </p>
              <p className="muted">
                Hours: {merchant.opens_at ?? "--"} – {merchant.closes_at ?? "--"}
              </p>
              {badge ? <p className="badge">{badge}</p> : null}
            </>
          ) : (
            <p className="muted">
              Complete onboarding to publish your food business.
            </p>
          )}
        </section>
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Today</h2>
          <p style={{ fontSize: 40, margin: "8px 0", fontFamily: "var(--bol-font-display)" }}>
            {pendingOrders}
          </p>
          <p className="muted">Orders waiting for confirmation</p>
        </section>
      </div>
    </Shell>
  );
}
