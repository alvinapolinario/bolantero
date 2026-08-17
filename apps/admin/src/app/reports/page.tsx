"use client";

import { useEffect, useMemo, useState } from "react";
import type { Tables } from "@bolantero/database";
import { Shell } from "@/components/Shell";
import { createClient } from "@/lib/supabase/client";

type Payment = Tables<"payments">;
type TripPayment = Tables<"trip_payments">;

export default function ReportsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tripPayments, setTripPayments] = useState<TripPayment[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("payments")
      .select("*")
      .then(({ data }) => setPayments(data ?? []));
    supabase
      .from("trip_payments")
      .select("*")
      .then(({ data }) => setTripPayments(data ?? []));
  }, []);

  const summary = useMemo(() => {
    const merchantProduct = payments
      .filter((p) => p.payee === "merchant")
      .reduce((s, p) => s + Number(p.amount), 0);
    const foodPlatform = payments
      .filter((p) => p.payee === "platform")
      .reduce((s, p) => s + Number(p.amount), 0);
    const tripPlatform = tripPayments
      .filter((p) => p.payee === "platform")
      .reduce((s, p) => s + Number(p.amount), 0);
    return { merchantProduct, foodPlatform, tripPlatform };
  }, [payments, tripPayments]);

  return (
    <Shell title="Platform reports">
      <div className="grid-2">
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Merchant product revenue</h2>
          <p style={{ fontSize: 36, margin: 0, fontFamily: "var(--bol-font-display)" }}>
            ₱{summary.merchantProduct.toFixed(2)}
          </p>
          <p className="muted">Paid fully to merchants — zero commission.</p>
        </section>
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Food logistics revenue</h2>
          <p style={{ fontSize: 36, margin: 0, fontFamily: "var(--bol-font-display)" }}>
            ₱{summary.foodPlatform.toFixed(2)}
          </p>
          <p className="muted">Delivery fees + COD handling fees only.</p>
        </section>
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Trip platform revenue</h2>
          <p style={{ fontSize: 36, margin: 0, fontFamily: "var(--bol-font-display)" }}>
            ₱{summary.tripPlatform.toFixed(2)}
          </p>
          <p className="muted">Ride + Padala platform fees. No merchant payee.</p>
        </section>
      </div>
    </Shell>
  );
}
