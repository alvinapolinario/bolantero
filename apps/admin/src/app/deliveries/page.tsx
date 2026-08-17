"use client";

import { useEffect, useState } from "react";
import type { Tables } from "@bolantero/database";
import { Shell } from "@/components/Shell";
import { createClient } from "@/lib/supabase/client";

type Delivery = Tables<"deliveries"> & {
  orders?: { order_number: string; status: string; delivery_fee: number } | null;
};

export default function DeliveriesPage() {
  const [rows, setRows] = useState<Delivery[]>([]);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("deliveries")
      .select("*, orders(order_number, status, delivery_fee)")
      .order("created_at", { ascending: false })
      .limit(50);
    setRows((data as Delivery[]) ?? []);
  }

  useEffect(() => {
    const supabase = createClient();
    load();
    const channel = supabase
      .channel("admin-deliveries")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "deliveries" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Shell title="Live deliveries" lede="Food jobs in motion. Platform take is delivery and COD fees only.">
      <section className="card">
        <div className="card-header">Recent deliveries</div>
        {rows.length === 0 ? (
          <p className="empty">No deliveries yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Delivery status</th>
                  <th>Rider</th>
                  <th>Fee / earning</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td data-label="Order">
                      <strong>{row.orders?.order_number ?? row.order_id.slice(0, 8)}</strong>
                      <div className="muted">Order: {row.orders?.status}</div>
                    </td>
                    <td data-label="Status">
                      <span className="badge">{row.status}</span>
                    </td>
                    <td className="muted" data-label="Rider">
                      {row.rider_id ? row.rider_id.slice(0, 8) : "Unassigned"}
                    </td>
                    <td data-label="Fee / earning">
                      ₱{Number(row.orders?.delivery_fee ?? 0).toFixed(2)}
                      <div className="muted">Rider ₱{Number(row.rider_earning).toFixed(2)}</div>
                    </td>
                    <td className="muted" data-label="Updated">
                      {new Date(row.updated_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </Shell>
  );
}
