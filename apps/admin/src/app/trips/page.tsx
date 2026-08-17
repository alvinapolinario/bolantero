"use client";

import { useEffect, useState } from "react";
import type { Tables } from "@bolantero/database";
import { tripServiceLabel } from "@bolantero/shared";
import { Shell } from "@/components/Shell";
import { createClient } from "@/lib/supabase/client";

type Trip = Tables<"trips">;

export default function TripsPage() {
  const [rows, setRows] = useState<Trip[]>([]);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("trips")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setRows(data ?? []);
  }

  useEffect(() => {
    const supabase = createClient();
    load();
    const channel = supabase
      .channel("admin-trips")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trips" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Shell title="Live trip monitor">
      <section className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Trip</th>
              <th>Service</th>
              <th>Status</th>
              <th>Route</th>
              <th>Fare split</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <strong>{row.trip_number}</strong>
                  <div className="muted">{row.service_area_code}</div>
                </td>
                <td>
                  <span className="badge">{tripServiceLabel(row.service_type)}</span>
                </td>
                <td>
                  <span className="badge">{row.status}</span>
                </td>
                <td className="muted">
                  {row.pickup_label} → {row.dropoff_label}
                </td>
                <td>
                  ₱{Number(row.fare).toFixed(2)}
                  <div className="muted">
                    Platform ₱{Number(row.platform_fee).toFixed(2)} · Rider ₱
                    {Number(row.rider_earning).toFixed(2)}
                  </div>
                </td>
                <td className="muted">{new Date(row.updated_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </Shell>
  );
}
