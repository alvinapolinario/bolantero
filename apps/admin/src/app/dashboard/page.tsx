"use client";

import { useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    pendingVerifications: 0,
    pendingMerchants: 0,
    activeDeliveries: 0,
    ordersToday: 0,
  });

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const [{ count: pendingVerifications }, { count: pendingMerchants }, { count: activeDeliveries }, { count: ordersToday }] =
        await Promise.all([
          supabase
            .from("verification_submissions")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending"),
          supabase
            .from("merchants")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending"),
          supabase
            .from("deliveries")
            .select("*", { count: "exact", head: true })
            .in("status", ["awaiting_rider", "assigned", "arrived_store", "picked_up"]),
          supabase.from("orders").select("*", { count: "exact", head: true }),
        ]);

      setStats({
        pendingVerifications: pendingVerifications ?? 0,
        pendingMerchants: pendingMerchants ?? 0,
        activeDeliveries: activeDeliveries ?? 0,
        ordersToday: ordersToday ?? 0,
      });
    })();
  }, []);

  return (
    <Shell title="Operations overview">
      <div className="grid-2">
        {[
          ["Pending verifications", stats.pendingVerifications],
          ["Merchant approvals", stats.pendingMerchants],
          ["Live deliveries", stats.activeDeliveries],
          ["Orders tracked", stats.ordersToday],
        ].map(([label, value]) => (
          <section key={String(label)} className="card">
            <p className="muted" style={{ margin: 0 }}>
              {label}
            </p>
            <p style={{ fontSize: 40, margin: "8px 0 0", fontFamily: "var(--bol-font-display)" }}>
              {value}
            </p>
          </section>
        ))}
      </div>
    </Shell>
  );
}
