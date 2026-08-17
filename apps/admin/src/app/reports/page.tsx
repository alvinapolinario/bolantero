"use client";

import { useEffect, useMemo, useState } from "react";
import type { Tables } from "@bolantero/database";
import { Shell } from "@/components/Shell";
import { Icon } from "@/components/icons";
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
    <Shell
      title="Reports"
      lede="Merchant product stays with merchants. Platform take is food logistics and trip fees only."
    >
      <div className="stat-grid cols-3">
        <section className="info-box">
          <span className="info-box-icon bg-success">
            <Icon name="store" size={28} />
          </span>
          <div className="info-box-content">
            <span className="info-box-text">Merchant product</span>
            <span className="info-box-number">₱{summary.merchantProduct.toFixed(2)}</span>
            <span className="info-box-desc">Paid fully to merchants — zero commission.</span>
          </div>
        </section>
        <section className="info-box">
          <span className="info-box-icon bg-info">
            <Icon name="delivery" size={28} />
          </span>
          <div className="info-box-content">
            <span className="info-box-text">Food logistics</span>
            <span className="info-box-number">₱{summary.foodPlatform.toFixed(2)}</span>
            <span className="info-box-desc">Delivery fees + COD handling fees only.</span>
          </div>
        </section>
        <section className="info-box">
          <span className="info-box-icon bg-primary">
            <Icon name="trip" size={28} />
          </span>
          <div className="info-box-content">
            <span className="info-box-text">Trip platform</span>
            <span className="info-box-number">₱{summary.tripPlatform.toFixed(2)}</span>
            <span className="info-box-desc">Ride + Padala platform fees. No merchant payee.</span>
          </div>
        </section>
      </div>
    </Shell>
  );
}
