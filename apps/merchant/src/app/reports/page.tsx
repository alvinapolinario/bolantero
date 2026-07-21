"use client";

import { useEffect, useMemo, useState } from "react";
import type { Tables } from "@bolantero/database";
import { Shell } from "@/components/Shell";
import { createClient } from "@/lib/supabase/client";

type Order = Tables<"orders">;

export default function ReportsPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: merchant } = await supabase
        .from("merchants")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();
      if (!merchant) return;
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("merchant_id", merchant.id)
        .in("status", ["confirmed", "preparing", "ready", "completed"]);
      setOrders(data ?? []);
    })();
  }, []);

  const totals = useMemo(() => {
    const gross = orders.reduce((sum, o) => sum + Number(o.subtotal), 0);
    const platformFees = orders.reduce(
      (sum, o) => sum + Number(o.delivery_fee) + Number(o.cod_fee),
      0,
    );
    return { gross, platformFees, count: orders.length };
  }, [orders]);

  return (
    <Shell title="Sales report">
      <div className="grid-2">
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Gross product sales</h2>
          <p style={{ fontSize: 36, margin: 0, fontFamily: "var(--bol-font-display)" }}>
            ₱{totals.gross.toFixed(2)}
          </p>
          <p className="muted">No commission deducted by Bolantero.</p>
        </section>
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Orders counted</h2>
          <p style={{ fontSize: 36, margin: 0, fontFamily: "var(--bol-font-display)" }}>
            {totals.count}
          </p>
          <p className="muted">
            Customer-paid delivery fees (platform): ₱{totals.platformFees.toFixed(2)}
          </p>
        </section>
      </div>
    </Shell>
  );
}
