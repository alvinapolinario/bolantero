"use client";

import { useEffect, useMemo, useState } from "react";
import type { Tables } from "@bolantero/database";
import { Shell } from "@/components/Shell";
import { createClient } from "@/lib/supabase/client";

type Payment = Tables<"payments">;

export default function ReportsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("payments")
      .select("*")
      .then(({ data }) => setPayments(data ?? []));
  }, []);

  const summary = useMemo(() => {
    const merchantProduct = payments
      .filter((p) => p.payee === "merchant")
      .reduce((s, p) => s + Number(p.amount), 0);
    const platform = payments
      .filter((p) => p.payee === "platform")
      .reduce((s, p) => s + Number(p.amount), 0);
    return { merchantProduct, platform };
  }, [payments]);

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
          <h2 style={{ marginTop: 0 }}>Bolantero logistics revenue</h2>
          <p style={{ fontSize: 36, margin: 0, fontFamily: "var(--bol-font-display)" }}>
            ₱{summary.platform.toFixed(2)}
          </p>
          <p className="muted">Delivery fees + COD handling fees only.</p>
        </section>
      </div>
    </Shell>
  );
}
